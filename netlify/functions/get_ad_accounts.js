const fetch = require('node-fetch').default;
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get request method and body
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};
    const tableName = queryParams.table;

    // Special handling for ad_accounts table - fetch from Meta Graph API
    if (tableName === 'ad_accounts' && method === 'GET') {
      console.log('Fetching ad accounts from Meta Graph API...');
      
      // Get Meta Graph API access token from environment variables
      const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN;
      
      if (!accessToken) {
        console.error('META_GRAPH_API_ACCESS_TOKEN not found in environment variables');
        return {
          statusCode: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Configuration Error',
            message: 'Meta Graph API access token is not configured. Please set META_GRAPH_API_ACCESS_TOKEN environment variable.',
          }),
        };
      }

      try {
        // Construct Meta Graph API URL for ad accounts
        const metaApiUrl = `https://graph.facebook.com/v19.0/me/adaccounts`;
        const metaApiParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'account_id,account_status,name,currency,timezone_name,created_time',
          limit: '25'
        });
        
        const fullMetaApiUrl = `${metaApiUrl}?${metaApiParams.toString()}`;
        
        console.log('Making request to Meta Graph API:', metaApiUrl);
        
        // Make request to Meta Graph API
        const metaResponse = await fetch(fullMetaApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!metaResponse.ok) {
          const errorText = await metaResponse.text();
          console.error('Meta Graph API error response:', {
            status: metaResponse.status,
            statusText: metaResponse.statusText,
            body: errorText
          });
          
          return {
            statusCode: metaResponse.status,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: 'Meta Graph API Error',
              message: `Meta API returned ${metaResponse.status}: ${metaResponse.statusText}`,
              details: errorText,
            }),
          };
        }

        const metaData = await metaResponse.json();
        console.log('Meta Graph API response received:', {
          dataCount: metaData.data ? metaData.data.length : 0,
          hasData: !!metaData.data
        });

        // Initialize Supabase client for server-side operations
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
        
        // Process and upsert ad accounts to Supabase
        let upsertResults = {
          processed: 0,
          inserted: 0,
          updated: 0,
          errors: []
        };

        if (metaData.data && metaData.data.length > 0) {
          console.log(`Processing ${metaData.data.length} ad accounts for upsert...`);
          
          for (const adAccount of metaData.data) {
            try {
              // Transform Meta API data to match Supabase schema
              const adAccountData = {
                id: parseInt(adAccount.account_id), // Convert string ID to integer
                name: adAccount.name,
                currency: adAccount.currency,
                timezone_name: adAccount.timezone_name,
                account_status: adAccount.account_status,
                created_time: adAccount.created_time ? new Date(adAccount.created_time).toISOString() : null
              };

              console.log(`Upserting ad account: ${adAccountData.id} - ${adAccountData.name}`);

              // Perform upsert operation
              const { data, error, count } = await supabase
                .from('ad_accounts')
                .upsert(adAccountData, { 
                  onConflict: 'id',
                  count: 'exact'
                })
                .select();

              if (error) {
                console.error(`Error upserting ad account ${adAccountData.id}:`, error);
                upsertResults.errors.push({
                  adAccountId: adAccountData.id,
                  error: error.message
                });
              } else {
                upsertResults.processed++;
                // Note: Supabase doesn't directly tell us if it was an insert or update
                // We could implement additional logic to check this if needed
                console.log(`Successfully upserted ad account ${adAccountData.id}`);
              }
            } catch (processingError) {
              console.error(`Error processing ad account ${adAccount.id}:`, processingError);
              upsertResults.errors.push({
                adAccountId: adAccount.id,
                error: processingError.message
              });
            }
          }
        }

        console.log('Upsert operation completed:', upsertResults);

        // Return the Meta Graph API data
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Ad accounts fetched successfully from Meta Graph API',
            source: 'Meta Graph API',
            timestamp: new Date().toISOString(),
            data: metaData.data || [],
            paging: metaData.paging || null,
            summary: metaData.summary || null,
            totalCount: metaData.data ? metaData.data.length : 0,
            supabaseSync: {
              processed: upsertResults.processed,
              errors: upsertResults.errors.length,
              errorDetails: upsertResults.errors
            }
          }),
        };

      } catch (metaApiError) {
        console.error('Error calling Meta Graph API:', metaApiError);
        
        return {
          statusCode: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Meta Graph API Request Failed',
            message: 'Failed to fetch data from Meta Graph API',
            details: metaApiError.message,
          }),
        };
      }
    }

    // Default response for other requests (existing functionality)
    const responseData = {
      message: 'Hello from Netlify Functions!',
      method: method,
      timestamp: new Date().toISOString(),
      queryParams: queryParams,
      ...(method === 'POST' && { receivedData: body }),
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    };
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
