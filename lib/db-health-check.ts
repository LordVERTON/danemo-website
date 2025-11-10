import { supabase, supabaseAdmin } from './supabase'

export interface DatabaseHealth {
  isConnected: boolean
  tables: {
    inventory: boolean
    orders: boolean
    employees: boolean
    employee_activities: boolean
  }
  auth: boolean
  errors: string[]
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const health: DatabaseHealth = {
    isConnected: false,
    tables: {
      inventory: false,
      orders: false,
      employees: false,
      employee_activities: false
    },
    auth: false,
    errors: []
  }

  try {
    // Test de connexion de base
    const { data: testData, error: testError } = await supabase
      .from('inventory')
      .select('count')
      .limit(1)

    if (testError) {
      health.errors.push(`Database connection failed: ${testError.message}`)
      return health
    }

    health.isConnected = true

    // Test des tables
    const tables = ['inventory', 'orders', 'employees', 'employee_activities'] as const
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          health.errors.push(`Table ${table} not accessible: ${error.message}`)
        } else {
          health.tables[table] = true
        }
      } catch (err) {
        health.errors.push(`Error checking table ${table}: ${err}`)
      }
    }

    // Test de l'authentification
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        health.errors.push(`Auth check failed: ${authError.message}`)
      } else {
        health.auth = true
      }
    } catch (err) {
      health.errors.push(`Auth error: ${err}`)
    }

  } catch (error) {
    health.errors.push(`Critical database error: ${error}`)
  }

  return health
}

export async function testDatabaseOperations(): Promise<{
  read: boolean
  write: boolean
  delete: boolean
  errors: string[]
}> {
  const results = {
    read: false,
    write: false,
    delete: false,
    errors: [] as string[]
  }

  try {
    // Test de lecture
    const { data: readData, error: readError } = await supabase
      .from('inventory')
      .select('id')
      .limit(1)
    
    if (readError) {
      results.errors.push(`Read test failed: ${readError.message}`)
    } else {
      results.read = true
    }

    // Test d'écriture (avec rollback)
    const testItem = {
      type: 'test' as const,
      reference: `TEST-${Date.now()}`,
      description: 'Test item for health check',
      client: 'Health Check',
      status: 'en_stock' as const,
      location: 'Test Location',
      poids: '1kg',
      dimensions: '10x10x10cm',
      valeur: '1'
    }

    const { data: writeData, error: writeError } = await (supabaseAdmin as any)
      .from('inventory')
      .insert(testItem)
      .select()
      .single()

    if (writeError) {
      results.errors.push(`Write test failed: ${writeError.message}`)
    } else {
      results.write = true

      // Test de suppression (nettoyage)
      const { error: deleteError } = await (supabaseAdmin as any)
        .from('inventory')
        .delete()
        .eq('id', writeData.id)

      if (deleteError) {
        results.errors.push(`Delete test failed: ${deleteError.message}`)
      } else {
        results.delete = true
      }
    }

  } catch (error) {
    results.errors.push(`Database operations test failed: ${error}`)
  }

  return results
}
