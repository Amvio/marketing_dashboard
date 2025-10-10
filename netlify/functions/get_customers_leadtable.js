const fetch = require('node-fetch').default;
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only GET method is supported for this endpoint',
      }),
    };
  }

  try {
    console.log('Fetching customers from Lead-Table API...');

    const leadTableApiKey = process.env.LEADTABLE_API_KEY;
    const leadTableEmail = process.env.LEADTABLE_EMAIL;

    if (!leadTableApiKey) {
      console.error('LEADTABLE_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Configuration Error',
          message: 'Lead-Table API key is not configured. Please set LEADTABLE_API_KEY environment variable in Netlify.',
        }),
      };
    }

    if (!leadTableEmail) {
      console.error('LEADTABLE_EMAIL not found in environment variables');
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Configuration Error',
          message: 'Lead-Table email is not configured. Please set LEADTABLE_EMAIL environment variable in Netlify.',
        }),
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase configuration missing');
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Configuration Error',
          message: 'Supabase URL or Service Role Key is not configured.',
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Supabase client created successfully');

    try {
      const leadTableApiUrl = 'https://api.lead-table.com/api/v3/external/customer/all';

      console.log('Fetching all customers from Lead-Table API...');

      const leadTableResponse = await fetch(leadTableApiUrl, {
        method: 'GET',
        headers: {
          'email': leadTableEmail,
          'Authorization': `Bearer ${leadTableApiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!leadTableResponse.ok) {
        const errorText = await leadTableResponse.text();
        console.error('Lead-Table API error response:', {
          status: leadTableResponse.status,
          statusText: leadTableResponse.statusText,
          body: errorText
        });

        return {
          statusCode: leadTableResponse.status,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Lead-Table API Error',
            message: `Lead-Table API returned ${leadTableResponse.status}: ${leadTableResponse.statusText}`,
            details: errorText,
          }),
        };
      }

      const leadTableData = await leadTableResponse.json();
      console.log('Lead-Table API response received successfully');

      const allCustomers = leadTableData.customers || [];
      console.log(`Total customers fetched: ${allCustomers.length}`);

      let insertResults = {
        processed: 0,
        inserted: 0,
        skipped: 0,
        errors: []
      };

      if (allCustomers.length > 0) {
        console.log(`Fetching existing leadtable_id values from Kunden table...`);

        const { data: existingCustomers, error: fetchError } = await supabase
          .from('Kunden')
          .select('leadtable_id')
          .not('leadtable_id', 'is', null);

        if (fetchError) {
          console.error('Error fetching existing customers:', fetchError);
          return {
            statusCode: 500,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: 'Database Error',
              message: 'Failed to fetch existing customers from Kunden table',
              details: fetchError.message,
            }),
          };
        }

        const existingLeadTableIds = new Set(
          (existingCustomers || []).map(c => c.leadtable_id).filter(id => id !== null)
        );
        console.log(`Found ${existingLeadTableIds.size} existing customers with leadtable_id`);

        console.log(`Processing ${allCustomers.length} customers for insert...`);

        for (const customer of allCustomers) {
          try {
            insertResults.processed++;

            const leadTableId = customer._id;

            if (!leadTableId) {
              console.log('Skipping customer without _id');
              insertResults.skipped++;
              continue;
            }

            if (existingLeadTableIds.has(leadTableId)) {
              console.log(`Skipping existing customer with leadtable_id: ${leadTableId}`);
              insertResults.skipped++;
              continue;
            }

            const customerData = {
              customer_name: customer.name || null,
              customer_created_at: customer.createdAt ? new Date(customer.createdAt).toISOString() : null,
              leadtable_id: leadTableId,
              source: 'Leadtable'
            };

            console.log(`Inserting new customer: ${customerData.leadtable_id} - ${customerData.customer_name}`);

            const { data, error } = await supabase
              .from('Kunden')
              .insert(customerData)
              .select();

            if (error) {
              console.error(`Error inserting customer ${customerData.leadtable_id}:`, error);
              insertResults.errors.push({
                leadtableId: customerData.leadtable_id,
                name: customerData.customer_name,
                error: error.message
              });
            } else {
              insertResults.inserted++;
              console.log(`Successfully inserted customer ${customerData.leadtable_id}`);
            }
          } catch (processingError) {
            console.error(`Error processing customer ${customer._id}:`, processingError);
            insertResults.errors.push({
              leadtableId: customer._id,
              name: customer.name,
              error: processingError.message
            });
          }
        }
      }

      console.log('Supabase Sync completed. Processed: ' + insertResults.processed + ', Inserted: ' + insertResults.inserted + ', Skipped: ' + insertResults.skipped + ', Errors: ' + insertResults.errors.length);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Customers synced successfully from Lead-Table API to Kunden table',
          source: 'Lead-Table API',
          timestamp: new Date().toISOString(),
          totalCustomersFetched: allCustomers.length,
          supabaseSync: {
            processed: insertResults.processed,
            inserted: insertResults.inserted,
            skipped: insertResults.skipped,
            errors: insertResults.errors.length,
            errorDetails: insertResults.errors
          }
        }),
      };

    } catch (apiError) {
      console.error('Error calling Lead-Table API:', apiError);

      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Lead-Table API Request Failed',
          message: 'Failed to fetch data from Lead-Table API',
          details: apiError.message,
        }),
      };
    }

  } catch (error) {
    console.error('Function error:', error);

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
