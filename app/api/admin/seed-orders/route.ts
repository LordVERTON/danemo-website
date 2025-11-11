import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_SEED_KEY = process.env.ADMIN_SEED_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Verify admin seed key
    const authHeader = request.headers.get('x-admin-seed-key');
    if (!authHeader || authHeader !== ADMIN_SEED_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin as any;

    const results = {
      customers: { created: 0, errors: [] as string[] },
      containers: { created: 0, errors: [] as string[] },
      orders: { created: 0, errors: [] as string[] },
    };

    // Step 1: Create sample customers
    const customers = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33 6 12 34 56 78',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postal_code: '75001',
        country: 'France',
        company: 'Dupont & Co',
        status: 'active',
      },
      {
        name: 'Marie Martin',
        email: 'marie.martin@example.com',
        phone: '+33 6 23 45 67 89',
        address: '456 Avenue des Champs',
        city: 'Lyon',
        postal_code: '69001',
        country: 'France',
        company: 'Martin Transport',
        status: 'active',
      },
      {
        name: 'Pierre Dubois',
        email: 'pierre.dubois@example.com',
        phone: '+33 6 34 56 78 90',
        address: '789 Boulevard Saint-Michel',
        city: 'Marseille',
        postal_code: '13001',
        country: 'France',
        company: null,
        status: 'active',
      },
      {
        name: 'Sophie Bernard',
        email: 'sophie.bernard@example.com',
        phone: '+33 6 45 67 89 01',
        address: '321 Rue de la République',
        city: 'Toulouse',
        postal_code: '31000',
        country: 'France',
        company: 'Bernard Logistics',
        status: 'active',
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+212 6 12 34 56 78',
        address: '15 Avenue Mohammed V',
        city: 'Casablanca',
        postal_code: '20000',
        country: 'Maroc',
        company: 'Hassan Import Export',
        status: 'active',
      },
      {
        name: 'Fatou Diallo',
        email: 'fatou.diallo@example.com',
        phone: '+221 7 12 34 56 78',
        address: '22 Rue de la Corniche',
        city: 'Dakar',
        postal_code: '10000',
        country: 'Sénégal',
        company: 'Diallo Trading',
        status: 'active',
      },
      {
        name: 'Koffi Kouassi',
        email: 'koffi.kouassi@example.com',
        phone: '+225 07 12 34 56 78',
        address: '45 Boulevard de la République',
        city: 'Abidjan',
        postal_code: '01 BP 1234',
        country: 'Côte d\'Ivoire',
        company: 'Kouassi Group',
        status: 'active',
      },
      {
        name: 'Amina Ouedraogo',
        email: 'amina.ouedraogo@example.com',
        phone: '+226 70 12 34 56',
        address: '78 Avenue Kwame Nkrumah',
        city: 'Ouagadougou',
        postal_code: '01 BP 5432',
        country: 'Burkina Faso',
        company: null,
        status: 'active',
      },
      {
        name: 'Youssef Benali',
        email: 'youssef.benali@example.com',
        phone: '+213 5 12 34 56 78',
        address: '12 Rue Didouche Mourad',
        city: 'Alger',
        postal_code: '16000',
        country: 'Algérie',
        company: 'Benali Shipping',
        status: 'active',
      },
      {
        name: 'Chinwe Okonkwo',
        email: 'chinwe.okonkwo@example.com',
        phone: '+234 803 123 4567',
        address: '89 Victoria Island',
        city: 'Lagos',
        postal_code: '101001',
        country: 'Nigeria',
        company: 'Okonkwo Logistics Ltd',
        status: 'active',
      },
    ];

    for (const customer of customers) {
      try {
        const { error } = await supabase
          .from('customers')
          .upsert(customer, { onConflict: 'email' });
        
        if (error) {
          results.customers.errors.push(`${customer.email}: ${error.message}`);
        } else {
          results.customers.created++;
        }
      } catch (err: any) {
        results.customers.errors.push(`${customer.email}: ${err.message}`);
      }
    }

    // Step 2: Create containers
    const containers = [
      {
        code: 'MSKU9876543',
        vessel: 'MSC OSCAR',
        departure_port: 'Port d\'Anvers, Belgique',
        arrival_port: 'Port de Douala, Cameroun',
        etd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned',
      },
      {
        code: 'TCLU1112223',
        vessel: 'CMA CGM MARCO POLO',
        departure_port: 'Port de Rotterdam, Pays-Bas',
        arrival_port: 'Port de Lagos, Nigeria',
        etd: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned',
      },
      {
        code: 'GESU4445556',
        vessel: 'EVERGREEN EVER ACE',
        departure_port: 'Port du Havre, France',
        arrival_port: 'Port d\'Abidjan, Côte d\'Ivoire',
        etd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned',
      },
      {
        code: 'APLU7778889',
        vessel: 'COSCO SHIPPING UNIVERSE',
        departure_port: 'Port d\'Hambourg, Allemagne',
        arrival_port: 'Port de Tema, Ghana',
        etd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'departed',
      },
      {
        code: 'OOCU2223334',
        vessel: 'OOCL HONG KONG',
        departure_port: 'Port de Felixstowe, Royaume-Uni',
        arrival_port: 'Port de Dakar, Sénégal',
        etd: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
      },
    ];

    for (const container of containers) {
      try {
        const { error } = await supabase
          .from('containers')
          .upsert(container, { onConflict: 'code' });
        
        if (error) {
          results.containers.errors.push(`${container.code}: ${error.message}`);
        } else {
          results.containers.created++;
        }
      } catch (err: any) {
        results.containers.errors.push(`${container.code}: ${err.message}`);
      }
    }

    // Step 3: Get customer and container IDs
    const { data: customersData } = await supabase
      .from('customers')
      .select('id, email');
    
    const { data: containersData } = await supabase
      .from('containers')
      .select('id, code');

    const customerMap = new Map(
      (customersData || []).map((c: any) => [c.email, c.id])
    );
    const containerMap = new Map(
      (containersData || []).map((c: any) => [c.code, c.id])
    );

    // Step 4: Create orders
    const currentYear = new Date().getFullYear();
    const orders = [
      {
        order_number: `ORD-${currentYear}-000001`,
        client_name: 'Jean Dupont',
        client_email: 'jean.dupont@example.com',
        client_phone: '+33 6 12 34 56 78',
        service_type: 'fret_maritime',
        origin: 'Paris, France',
        destination: 'Douala, Cameroun',
        weight: 2500.00,
        value: 15000.00,
        status: 'in_progress',
        estimated_delivery: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('jean.dupont@example.com'),
        container_id: containerMap.get('MSKU9876543'),
      },
      {
        order_number: `ORD-${currentYear}-000002`,
        client_name: 'Marie Martin',
        client_email: 'marie.martin@example.com',
        client_phone: '+33 6 23 45 67 89',
        service_type: 'fret_maritime',
        origin: 'Lyon, France',
        destination: 'Lagos, Nigeria',
        weight: 3200.00,
        value: 22000.00,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('marie.martin@example.com'),
        container_id: containerMap.get('TCLU1112223'),
      },
      {
        order_number: `ORD-${currentYear}-000003`,
        client_name: 'Marie Martin',
        client_email: 'marie.martin@example.com',
        client_phone: '+33 6 23 45 67 89',
        service_type: 'demenagement',
        origin: 'Lyon, France',
        destination: 'Dakar, Sénégal',
        weight: 1800.00,
        value: 12000.00,
        status: 'pending',
        estimated_delivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('marie.martin@example.com'),
        container_id: containerMap.get('OOCU2223334'),
      },
      {
        order_number: `ORD-${currentYear}-000004`,
        client_name: 'Pierre Dubois',
        client_email: 'pierre.dubois@example.com',
        client_phone: '+33 6 34 56 78 90',
        service_type: 'fret_maritime',
        origin: 'Marseille, France',
        destination: 'Abidjan, Côte d\'Ivoire',
        weight: 2800.00,
        value: 18000.00,
        status: 'in_progress',
        estimated_delivery: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('pierre.dubois@example.com'),
        container_id: containerMap.get('GESU4445556'),
      },
      {
        order_number: `ORD-${currentYear}-000005`,
        client_name: 'Sophie Bernard',
        client_email: 'sophie.bernard@example.com',
        client_phone: '+33 6 45 67 89 01',
        service_type: 'fret_maritime',
        origin: 'Toulouse, France',
        destination: 'Tema, Ghana',
        weight: 3500.00,
        value: 25000.00,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('sophie.bernard@example.com'),
        container_id: containerMap.get('APLU7778889'),
      },
      {
        order_number: `ORD-${currentYear}-000006`,
        client_name: 'Sophie Bernard',
        client_email: 'sophie.bernard@example.com',
        client_phone: '+33 6 45 67 89 01',
        service_type: 'colis',
        origin: 'Toulouse, France',
        destination: 'Casablanca, Maroc',
        weight: 150.00,
        value: 800.00,
        status: 'completed',
        estimated_delivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('sophie.bernard@example.com'),
        container_id: null,
      },
      {
        order_number: `ORD-${currentYear}-000007`,
        client_name: 'Ahmed Hassan',
        client_email: 'ahmed.hassan@example.com',
        client_phone: '+212 6 12 34 56 78',
        service_type: 'fret_maritime',
        origin: 'Casablanca, Maroc',
        destination: 'Lagos, Nigeria',
        weight: 4200.00,
        value: 30000.00,
        status: 'in_progress',
        estimated_delivery: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('ahmed.hassan@example.com'),
        container_id: containerMap.get('TCLU1112223'),
      },
      {
        order_number: `ORD-${currentYear}-000008`,
        client_name: 'Fatou Diallo',
        client_email: 'fatou.diallo@example.com',
        client_phone: '+221 7 12 34 56 78',
        service_type: 'demenagement',
        origin: 'Dakar, Sénégal',
        destination: 'Paris, France',
        weight: 2000.00,
        value: 15000.00,
        status: 'pending',
        estimated_delivery: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('fatou.diallo@example.com'),
        container_id: containerMap.get('OOCU2223334'),
      },
      {
        order_number: `ORD-${currentYear}-000009`,
        client_name: 'Koffi Kouassi',
        client_email: 'koffi.kouassi@example.com',
        client_phone: '+225 07 12 34 56 78',
        service_type: 'fret_maritime',
        origin: 'Abidjan, Côte d\'Ivoire',
        destination: 'Marseille, France',
        weight: 3800.00,
        value: 28000.00,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('koffi.kouassi@example.com'),
        container_id: containerMap.get('GESU4445556'),
      },
      {
        order_number: `ORD-${currentYear}-000010`,
        client_name: 'Koffi Kouassi',
        client_email: 'koffi.kouassi@example.com',
        client_phone: '+225 07 12 34 56 78',
        service_type: 'fret_aerien',
        origin: 'Abidjan, Côte d\'Ivoire',
        destination: 'Paris, France',
        weight: 500.00,
        value: 3500.00,
        status: 'completed',
        estimated_delivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('koffi.kouassi@example.com'),
        container_id: null,
      },
      {
        order_number: `ORD-${currentYear}-000011`,
        client_name: 'Amina Ouedraogo',
        client_email: 'amina.ouedraogo@example.com',
        client_phone: '+226 70 12 34 56',
        service_type: 'fret_maritime',
        origin: 'Ouagadougou, Burkina Faso',
        destination: 'Rotterdam, Pays-Bas',
        weight: 2900.00,
        value: 20000.00,
        status: 'in_progress',
        estimated_delivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('amina.ouedraogo@example.com'),
        container_id: containerMap.get('APLU7778889'),
      },
      {
        order_number: `ORD-${currentYear}-000012`,
        client_name: 'Youssef Benali',
        client_email: 'youssef.benali@example.com',
        client_phone: '+213 5 12 34 56 78',
        service_type: 'fret_maritime',
        origin: 'Alger, Algérie',
        destination: 'Anvers, Belgique',
        weight: 4100.00,
        value: 32000.00,
        status: 'confirmed',
        estimated_delivery: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('youssef.benali@example.com'),
        container_id: containerMap.get('MSKU9876543'),
      },
      {
        order_number: `ORD-${currentYear}-000013`,
        client_name: 'Chinwe Okonkwo',
        client_email: 'chinwe.okonkwo@example.com',
        client_phone: '+234 803 123 4567',
        service_type: 'fret_maritime',
        origin: 'Lagos, Nigeria',
        destination: 'Hambourg, Allemagne',
        weight: 4500.00,
        value: 35000.00,
        status: 'in_progress',
        estimated_delivery: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('chinwe.okonkwo@example.com'),
        container_id: containerMap.get('TCLU1112223'),
      },
      {
        order_number: `ORD-${currentYear}-000014`,
        client_name: 'Chinwe Okonkwo',
        client_email: 'chinwe.okonkwo@example.com',
        client_phone: '+234 803 123 4567',
        service_type: 'demenagement',
        origin: 'Lagos, Nigeria',
        destination: 'Lyon, France',
        weight: 2200.00,
        value: 18000.00,
        status: 'pending',
        estimated_delivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: customerMap.get('chinwe.okonkwo@example.com'),
        container_id: null,
      },
    ];

    for (const order of orders) {
      try {
        const { error } = await supabase
          .from('orders')
          .upsert(order, { onConflict: 'order_number' });
        
        if (error) {
          results.orders.errors.push(`${order.order_number}: ${error.message}`);
        } else {
          results.orders.created++;
        }
      } catch (err: any) {
        results.orders.errors.push(`${order.order_number}: ${err.message}`);
      }
    }

    // Get final counts
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const { count: containerCount } = await supabase
      .from('containers')
      .select('*', { count: 'exact', head: true });
    
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: linkedOrderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('customer_id', 'is', null)
      .not('container_id', 'is', null);

    return NextResponse.json({
      success: true,
      message: 'Orders, customers, and containers seeded successfully',
      results,
      summary: {
        total_customers: customerCount || 0,
        total_containers: containerCount || 0,
        total_orders: orderCount || 0,
        linked_orders: linkedOrderCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Error seeding orders:', error);
    return NextResponse.json(
      { error: 'Failed to seed orders', details: error.message },
      { status: 500 }
    );
  }
}

