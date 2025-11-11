import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Simple protection: require a header that matches an env key
    const seedKey = process.env.ADMIN_SEED_KEY
    const providedKey = request.headers.get('x-admin-seed-key')
    if (!seedKey || providedKey !== seedKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin not initialized' }, { status: 500 })
    }

    const results: {
      customersCreated: number
      ordersLinked: number
      invoicesCreated: number
      errors: string[]
    } = {
      customersCreated: 0,
      ordersLinked: 0,
      invoicesCreated: 0,
      errors: []
    }

    // Step 1: Extract unique customers from orders and insert into customers
    try {
      const { data: uniqueCustomers, error: selectError } = await supabaseAdmin
        .from('orders')
        .select('client_name, client_email, client_phone, created_at')
        .not('client_email', 'is', null)
        .neq('client_email', '')

      if (selectError) throw selectError

      // Group by email to get unique customers
      const customerMap = new Map<string, any>()
      uniqueCustomers?.forEach((order: any) => {
        const email = order.client_email?.toLowerCase().trim()
        if (email && !customerMap.has(email)) {
          customerMap.set(email, {
            name: order.client_name?.trim() || '',
            email: email,
            phone: order.client_phone?.trim() || null,
            status: 'active',
            created_at: order.created_at
          })
        }
      })

      // Insert customers (only if they don't exist)
      for (const customer of customerMap.values()) {
        try {
          const { data, error } = await supabaseAdmin
            .from('customers')
            .insert(customer)
            .select()
            .single()

          if (error) {
            // If customer already exists, that's fine
            if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
              results.errors.push(`Error creating customer ${customer.email}: ${error.message}`)
            }
          } else {
            results.customersCreated++
          }
        } catch (err: any) {
          if (!err.message?.includes('duplicate') && !err.message?.includes('unique')) {
            results.errors.push(`Error creating customer ${customer.email}: ${err.message}`)
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Error extracting customers: ${error.message}`)
    }

    // Step 2: Link orders to customers
    try {
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('customers')
        .select('id, email')

      if (customersError) throw customersError

      // Manual update: link orders to customers by email
      for (const customer of customers || []) {
        const customerData = customer as any
        const { count, error: linkError } = await (supabaseAdmin as any)
          .from('orders')
          .update({ customer_id: customerData.id })
          .is('customer_id', null)
          .ilike('client_email', customerData.email)
          .select('id', { count: 'exact', head: true })

        if (linkError) {
          results.errors.push(`Error linking orders for ${customerData.email}: ${linkError.message}`)
        } else {
          results.ordersLinked += count || 0
        }
      }
      
      // Get total count of linked orders
      const { count: totalLinked } = await (supabaseAdmin as any)
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .not('customer_id', 'is', null)
      
      results.ordersLinked = totalLinked || 0
    } catch (error: any) {
      results.errors.push(`Error linking orders: ${error.message}`)
    }

    // Step 3: Create invoices for eligible orders
    try {
      const { data: eligibleOrders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id, customer_id, value, status, order_number, created_at')
        .not('customer_id', 'is', null)
        .in('status', ['completed', 'in_progress', 'confirmed'])
        .not('value', 'is', null)
        .gt('value', 0)
        .limit(50)

      if (ordersError) throw ordersError

      for (const order of eligibleOrders || []) {
        const orderData = order as any
        
        // Check if invoice already exists
        const { data: existingInvoice } = await (supabaseAdmin as any)
          .from('invoices')
          .select('id')
          .eq('order_id', orderData.id)
          .single()

        if (existingInvoice) continue

        // Calculate dates
        const issueDate = new Date(orderData.created_at)
        const dueDate = new Date(issueDate)
        dueDate.setDate(dueDate.getDate() + 30)

        // Determine status
        let invoiceStatus: 'draft' | 'sent' = 'draft'
        if (orderData.status === 'completed') {
          invoiceStatus = 'sent'
        }

        // Calculate amounts
        const subtotal = parseFloat(orderData.value) || 0
        const taxRate = 21.0
        const taxAmount = subtotal * (taxRate / 100)
        const totalAmount = subtotal + taxAmount

        try {
          const { error: invoiceError } = await (supabaseAdmin as any)
            .from('invoices')
            .insert({
              customer_id: orderData.customer_id,
              order_id: orderData.id,
              issue_date: issueDate.toISOString().split('T')[0],
              due_date: dueDate.toISOString().split('T')[0],
              status: invoiceStatus,
              subtotal: subtotal,
              tax_rate: taxRate,
              tax_amount: taxAmount,
              total_amount: totalAmount,
              currency: 'EUR',
              notes: `Facture générée automatiquement depuis la commande ${orderData.order_number}`
            })

          if (invoiceError) {
            results.errors.push(`Error creating invoice for order ${orderData.order_number}: ${invoiceError.message}`)
          } else {
            results.invoicesCreated++
          }
        } catch (err: any) {
          results.errors.push(`Error creating invoice for order ${orderData.order_number}: ${err.message}`)
        }
      }
    } catch (error: any) {
      results.errors.push(`Error creating invoices: ${error.message}`)
    }

    // Step 4: Mark some invoices as paid
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await (supabaseAdmin as any)
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'virement'
        })
        .eq('status', 'sent')
        .lt('issue_date', thirtyDaysAgo.toISOString().split('T')[0])
        .is('payment_date', null)
    } catch (error: any) {
      // Non-critical, just log
      console.log('Could not update paid invoices:', error.message)
    }

    // Step 5: Mark overdue invoices
    try {
      await (supabaseAdmin as any)
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .is('payment_date', null)
    } catch (error: any) {
      results.errors.push(`Error marking overdue invoices: ${error.message}`)
    }

    const hasErrors = results.errors.length > 0
    return NextResponse.json(
      {
        success: !hasErrors,
        results,
        message: `Seeded ${results.customersCreated} customers, linked ${results.ordersLinked} orders, created ${results.invoicesCreated} invoices`
      },
      { status: hasErrors ? 207 : 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed customers and invoices' },
      { status: 500 }
    )
  }
}

