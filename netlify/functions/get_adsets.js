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
    console.log('Fetching adsets from Meta Graph API...');
    
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

    // Step 1: Get all campaigns from Supabase to fetch adsets for each campaign
    console.log('Fetching campaign IDs from Supabase campaigns table...');
    
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id')
      .order('id', { ascending: true });

    if (campaignsError) {
      console.error('Error fetching campaigns from Supabase:', campaignsError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Supabase Error',
          message: `Failed to fetch campaigns from Supabase: ${campaignsError.message}`,
        }),
      };
    }

    console.log(`Found ${(campaignsData || []).length} campaigns in Supabase`);
    
    // Step 2: Get all adsets for each campaign
    let adsetsData = [];
    
    for (const campaign of campaignsData || []) {
      const adsetsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/adsets`;
      const adsetsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'campaign_id,created_time,end_time,id,name,optimization_goal,status,start_time,updated_time,bid_strategy',
        limit: '100'
      });
      
      try {
        console.log(`Fetching adsets for campaign ${campaign.id}...`);
        
        const adsetsResponse = await fetch(`${adsetsUrl}?${adsetsParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (adsetsResponse.ok) {
          const adsetsResult = await adsetsResponse.json();
          const adsetsWithCampaign = (adsetsResult.data || []).map(adset => ({
            ...adset,
            campaign_id: campaign.id
          }));
          adsetsData.push(...adsetsWithCampaign);
          console.log(`Successfully fetched ${adsetsWithCampaign.length} adsets for campaign ${campaign.id}`);
        } else {
          console.error(`Error response from Meta API for campaign ${campaign.id}:`, adsetsResponse.status, adsetsResponse.statusText);
        }
      } catch (error) {
        console.error(`Error fetching adsets for campaign ${campaign.id}:`, error);
      }
    }

    console.log(`Fetched ${adsetsData.length} adsets from Meta Graph API`);

    // Process and upsert adsets to Supabase
    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const adset of adsetsData) {
      try {
        // Transform Meta API data to match Supabase schema
        const adsetData = {
          id: String(adset.id),
          campaign_id: String(adset.campaign_id),
          name: adset.name,
          status: adset.status,
          optimization_goal: adset.optimization_goal,
          bid_strategy: adset.bid_strategy,
          start_time: adset.start_time ? new Date(adset.start_time).toISOString() : null,
          end_time: adset.end_time ? new Date(adset.end_time).toISOString() : null,
          created_time: adset.created_time ? new Date(adset.created_time).toISOString() : null,
          updated_time: adset.updated_time ? new Date(adset.updated_time).toISOString() : null
        };


        console.log(`Upserting adset: ${adsetData.id} - ${adsetData.name}`);

        // Perform upsert operation
        const { error } = await supabase
          .from('ad_sets')
          .upsert(adsetData, { 
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error upserting adset ${adsetData.id}:`, error);
          upsertResults.errors.push({
            adsetId: adsetData.id,
            error: error.message
          });
        } else {
          upsertResults.processed++;
          console.log(`Successfully upserted adset ${adsetData.id}`);
        }
      } catch (processingError) {
        console.error(`Error processing adset ${adset.id}:`, processingError);
        upsertResults.errors.push({
          adsetId: adset.id,
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
        message: 'Adsets fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        totalCount: adsetsData.length,
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
