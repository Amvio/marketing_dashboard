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
    console.log('Fetching campaigns from Meta Graph API...');
    
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
          message: 'Meta Graph API access token is not configured.',
        }),
      };
    }

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

    // Step 1: Get all ad account IDs from Supabase
    console.log('Fetching ad account IDs from Supabase ad_accounts table...');
    
    const { data: adAccountsData, error: adAccountsError } = await supabase
      .from('ad_accounts')
      .select('id')
      .order('id', { ascending: true });

    if (adAccountsError) {
      console.error('Error fetching ad accounts from Supabase:', adAccountsError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Supabase Error',
          message: `Failed to fetch ad accounts from Supabase: ${adAccountsError.message}`,
        }),
      };
    }

    console.log(`Found ${(adAccountsData || []).length} ad accounts in Supabase`);
    
    // Step 2: Get all campaigns for each ad account
    let campaignsData = [];
    
    for (const adAccount of adAccountsData || []) {
      const campaignsUrl = `https://graph.facebook.com/v19.0/act_${adAccount.id}/campaigns`;
      const campaignsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'account_id,daily_budget,created_time,id,name,objective,start_time,status,stop_time,updated_time',
        limit: '100'
      });
      
      try {
        console.log(`Fetching campaigns for ad account ${adAccount.id}...`);
        
        const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (campaignsResponse.ok) {
          const campaignsResult = await campaignsResponse.json();
          // Add ad_account_id to each campaign
          const campaignsWithAccount = (campaignsResult.data || []).map(campaign => ({
            ...campaign,
            ad_account_id: adAccount.id
          }));
          campaignsData.push(...campaignsWithAccount);
          console.log(`Successfully fetched ${campaignsWithAccount.length} campaigns for ad account ${adAccount.id}`);
        } else {
          console.error(`Error response from Meta API for ad account ${adAccount.id}:`, campaignsResponse.status, campaignsResponse.statusText);
        }
      } catch (error) {
        console.error(`Error fetching campaigns for ad account ${adAccount.id}:`, error);
      }
    }

    console.log(`Fetched ${campaignsData.length} campaigns from Meta Graph API`);

    // Process and upsert campaigns to Supabase
    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const campaign of campaignsData) {
      try {
        // Transform Meta API data to match Supabase schema
        const campaignData = {
          id: String(campaign.id),
          ad_account_id: String(campaign.account_id),
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget: campaign.daily_budget ? String(campaign.daily_budget) : null,
          start_time: campaign.start_time ? new Date(campaign.start_time).toISOString() : null,
          end_time: campaign.stop_time ? new Date(campaign.stop_time).toISOString() : null,
          created_time: campaign.created_time ? new Date(campaign.created_time).toISOString() : null,
          updated_time: campaign.updated_time ? new Date(campaign.updated_time).toISOString() : null
        };

        console.log(`Upserting campaign: ${campaignData.id} - ${campaignData.name}`);

        // Perform upsert operation
        const { error } = await supabase
          .from('campaigns')
          .upsert(campaignData, { 
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error upserting campaign ${campaignData.id}:`, error);
          upsertResults.errors.push({
            campaignId: campaignData.id,
            error: error.message
          });
        } else {
          upsertResults.processed++;
          console.log(`Successfully upserted campaign ${campaignData.id}`);
        }
      } catch (processingError) {
        console.error(`Error processing campaign ${campaign.id}:`, processingError);
        upsertResults.errors.push({
          campaignId: campaign.id,
          error: processingError.message
        });
      }
    }

    console.log(`Supabase Sync completed. Processed: ${upsertResults.processed}, Errors: ${upsertResults.errors.length}`);

    // Return summary response
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Campaigns fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        totalCount: campaignsData.length,
        supabaseSync: {
          processed: upsertResults.processed,
          errors: upsertResults.errors.length,
          errorDetails: upsertResults.errors
        }
      }),
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
