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

    // Step 1: Delete all existing data
    console.log('Deleting existing data...');
    
    // Delete orders first (due to foreign key constraints)
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (ordersError) {
      console.error('Error deleting orders:', ordersError);
    }

    // Delete customers
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (customersError) {
      console.error('Error deleting customers:', customersError);
    }

    // Delete containers
    const { error: containersError } = await supabase
      .from('containers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (containersError) {
      console.error('Error deleting containers:', containersError);
    }

    console.log('Data deleted successfully');

    // Step 2: Create 3 containers
    console.log('Creating containers...');
    const containers = [
      {
        code: 'MSKU1234567',
        vessel: 'MSC OSCAR',
        departure_port: 'Port d\'Anvers, Belgique',
        arrival_port: 'Port de Douala, Cameroun',
        etd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned',
      },
      {
        code: 'TCLU7654321',
        vessel: 'CMA CGM MARCO POLO',
        departure_port: 'Port de Rotterdam, Pays-Bas',
        arrival_port: 'Port de Lagos, Nigeria',
        etd: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'departed',
      },
      {
        code: 'GESU9876543',
        vessel: 'EVERGREEN EVER ACE',
        departure_port: 'Port du Havre, France',
        arrival_port: 'Port d\'Abidjan, Côte d\'Ivoire',
        etd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
      },
    ];

    const { data: createdContainers, error: containersInsertError } = await supabase
      .from('containers')
      .insert(containers)
      .select();

    if (containersInsertError) {
      console.error('Error creating containers:', containersInsertError);
      return NextResponse.json(
        { error: 'Failed to create containers', details: containersInsertError.message },
        { status: 500 }
      );
    }

    console.log(`Created ${createdContainers?.length || 0} containers`);

    // Step 3: Create 15 customers
    console.log('Creating customers...');
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
      {
        name: 'Amadou Traoré',
        email: 'amadou.traore@example.com',
        phone: '+223 20 12 34 56',
        address: '34 Rue de Bamako',
        city: 'Bamako',
        postal_code: 'BP 123',
        country: 'Mali',
        company: 'Traoré Transport',
        status: 'active',
      },
      {
        name: 'Zainab Ibrahim',
        email: 'zainab.ibrahim@example.com',
        phone: '+234 802 234 5678',
        address: '56 Wuse 2',
        city: 'Abuja',
        postal_code: '900001',
        country: 'Nigeria',
        company: 'Ibrahim Freight',
        status: 'active',
      },
      {
        name: 'Mohamed Diop',
        email: 'mohamed.diop@example.com',
        phone: '+221 77 123 4567',
        address: '12 Avenue Léopold Sédar Senghor',
        city: 'Dakar',
        postal_code: '10000',
        country: 'Sénégal',
        company: 'Diop Shipping',
        status: 'active',
      },
      {
        name: 'Aissatou Ba',
        email: 'aissatou.ba@example.com',
        phone: '+221 78 234 5678',
        address: '45 Corniche Ouest',
        city: 'Dakar',
        postal_code: '10000',
        country: 'Sénégal',
        company: null,
        status: 'active',
      },
      {
        name: 'Ibrahim Sall',
        email: 'ibrahim.sall@example.com',
        phone: '+221 76 345 6789',
        address: '78 Route de l\'Aéroport',
        city: 'Dakar',
        postal_code: '10000',
        country: 'Sénégal',
        company: 'Sall Logistics',
        status: 'active',
      },
    ];

    const { data: createdCustomers, error: customersInsertError } = await supabase
      .from('customers')
      .insert(customers)
      .select();

    if (customersInsertError) {
      console.error('Error creating customers:', customersInsertError);
      return NextResponse.json(
        { error: 'Failed to create customers', details: customersInsertError.message },
        { status: 500 }
      );
    }

    console.log(`Created ${createdCustomers?.length || 0} customers`);

    // Step 4: Create orders for each customer (1-5 orders per customer)
    console.log('Creating orders...');
    const serviceTypes = ['fret_maritime', 'fret_aerien', 'demenagement', 'colis'];
    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const destinations = [
      'Paris, France',
      'Lagos, Nigeria',
      'Dakar, Sénégal',
      'Abidjan, Côte d\'Ivoire',
      'Douala, Cameroun',
    ];

    const orders: any[] = [];
    let orderNum = 1;
    const currentYear = new Date().getFullYear();

    if (!createdCustomers || !createdContainers) {
      return NextResponse.json(
        { error: 'Failed to get created customers or containers' },
        { status: 500 }
      );
    }

    for (const customer of createdCustomers) {
      // Random number of orders between 1 and 5
      const numOrders = 1 + Math.floor(Math.random() * 5);

      for (let i = 0; i < numOrders; i++) {
        // 70% chance of having a container
        const hasContainer = Math.random() > 0.3;
        const containerId = hasContainer
          ? createdContainers[Math.floor(Math.random() * createdContainers.length)].id
          : null;

        const order = {
          order_number: `ORD-${currentYear}-${String(orderNum).padStart(6, '0')}`,
          client_name: customer.name,
          client_email: customer.email,
          client_phone: customer.phone,
          service_type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
          origin: `${customer.city}, ${customer.country}`,
          destination: destinations[Math.floor(Math.random() * destinations.length)],
          weight: (1000 + Math.random() * 4000).toFixed(2),
          value: (5000 + Math.random() * 30000).toFixed(2),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          estimated_delivery: new Date(
            Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          customer_id: customer.id,
          container_id: containerId,
        };

        orders.push(order);
        orderNum++;
      }
    }

    const { data: createdOrders, error: ordersInsertError } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (ordersInsertError) {
      console.error('Error creating orders:', ordersInsertError);
      return NextResponse.json(
        { error: 'Failed to create orders', details: ordersInsertError.message },
        { status: 500 }
      );
    }

    console.log(`Created ${createdOrders?.length || 0} orders`);

    // Calculate summary
    const ordersPerCustomer = createdCustomers.map((customer: any) => {
      const customerOrders = createdOrders?.filter((o: any) => o.customer_id === customer.id) || [];
      return {
        customer: customer.name,
        orderCount: customerOrders.length,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        customers: createdCustomers.length,
        containers: createdContainers.length,
        orders: createdOrders?.length || 0,
        ordersPerCustomer,
      },
    });
  } catch (error: any) {
    console.error('Error reseeding data:', error);
    return NextResponse.json(
      { error: 'Failed to reseed data', details: error.message },
      { status: 500 }
    );
  }
}

