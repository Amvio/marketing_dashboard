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

    let allCustomers = [];
    let currentPage = 1;
    const limit = 50;
    let hasMorePages = true;

    try {
      while (hasMorePages) {
        const leadTableApiUrl = `https://api.lead-table.com/api/v2/external/customer/all?page=${currentPage}&limit=${limit}`;

        console.log(`Fetching page ${currentPage} from Lead-Table API...`);

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
        console.log(`Page ${currentPage} fetched successfully from Lead-Table API`);

        if (leadTableData.data && Array.isArray(leadTableData.data) && leadTableData.data.length > 0) {
          allCustomers = allCustomers.concat(leadTableData.data);
          console.log(`Added ${leadTableData.data.length} customers from page ${currentPage}`);

          if (leadTableData.data.length < limit) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else {
          hasMorePages = false;
        }
      }

      console.log(`Total customers fetched: ${allCustomers.length}`);

      let upsertResults = {
        processed: 0,
        inserted: 0,
        updated: 0,
        errors: []
      };

      if (allCustomers.length > 0) {
        console.log(`Processing ${allCustomers.length} customers for upsert...`);

        for (const customer of allCustomers) {
          try {
            const customerData = {
              customer_id: customer.id ? String(customer.id) : null,
              name: customer.name || customer.full_name || null,
              email: customer.email || null,
              phone: customer.phone || customer.phone_number || null,
              status: customer.status || null,
              lead_source: customer.lead_source || customer.source || null,
              company: customer.company || customer.company_name || null,
              address: customer.address || null,
              city: customer.city || null,
              country: customer.country || null,
              notes: customer.notes || customer.description || null,
              tags: customer.tags ? (Array.isArray(customer.tags) ? customer.tags : [customer.tags]) : [],
              custom_fields: customer.custom_fields || customer.metadata || {},
              raw_data: customer,
              last_synced_at: new Date().toISOString(),
              api_created_at: customer.created_at ? new Date(customer.created_at).toISOString() : null,
              api_updated_at: customer.updated_at ? new Date(customer.updated_at).toISOString() : null
            };

            console.log(`Upserting customer: ${customerData.customer_id} - ${customerData.name}`);

            const { data, error } = await supabase
              .from('customers_leadtable')
              .upsert(customerData, {
                onConflict: 'customer_id',
                ignoreDuplicates: false
              })
              .select();

            if (error) {
              console.error(`Error upserting customer ${customerData.customer_id}:`, error);
              upsertResults.errors.push({
                customerId: customerData.customer_id,
                error: error.message
              });
            } else {
              upsertResults.processed++;
              console.log(`Successfully upserted customer ${customerData.customer_id}`);
            }
          } catch (processingError) {
            console.error(`Error processing customer ${customer.id}:`, processingError);
            upsertResults.errors.push({
              customerId: customer.id,
              error: processingError.message
            });
          }
        }
      }

      console.log('Supabase Sync completed. Processed: ' + upsertResults.processed + ', Errors: ' + upsertResults.errors.length);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Customers fetched successfully from Lead-Table API',
          source: 'Lead-Table API',
          timestamp: new Date().toISOString(),
          totalCustomers: allCustomers.length,
          pagesProcessed: currentPage,
          supabaseSync: {
            processed: upsertResults.processed,
            errors: upsertResults.errors.length,
            errorDetails: upsertResults.errors
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
