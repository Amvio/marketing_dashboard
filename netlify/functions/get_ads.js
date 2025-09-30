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
    console.log('Fetching ads from Meta Graph API...');
    
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

    // Get status filter from query parameters
    const queryParams = event.queryStringParameters || {};
    const statusFilter = queryParams.statusFilter; // 'active' or null for all

    // Step 1: Get adset IDs from Supabase based on status filter
    console.log('Fetching adset IDs from Supabase ad_sets table...');
    
    let adsetsQuery = supabase
      .from('ad_sets')
      .select('id')
      .order('id', { ascending: true });

    // Apply status filter if specified
    if (statusFilter === 'active') {
      adsetsQuery = adsetsQuery.eq('status', 'ACTIVE');
    }

    const { data: adsetsData, error: adsetsError } = await adsetsQuery;

    if (adsetsError) {
      console.error('Error fetching adsets from Supabase:', adsetsError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Supabase Error',
          message: `Failed to fetch adsets from Supabase: ${adsetsError.message}`,
        }),
      };
    }

    console.log(`Found ${(adsetsData || []).length} adsets in Supabase${statusFilter === 'active' ? ' (active only)' : ''}`);
    
    // Step 2: Get all ads for each adset
    let adsData = [];
    
    for (const adset of adsetsData || []) {
      const adsUrl = `https://graph.facebook.com/v19.0/${adset.id}/ads`;
      const adsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'ad_set_id,created_time,id,name,status,creative{id},effective_status,updated_time',
        limit: '100'
      });
      
      try {
        console.log(`Fetching ads for adset ${adset.id}...`);
        
        const adsResponse = await fetch(`${adsUrl}?${adsParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (adsResponse.ok) {
          const adsResult = await adsResponse.json();
          const adsWithAdset = (adsResult.data || []).map(ad => ({
            ...ad,
            ad_set_id: adset.id,
            creative_id: ad.creative ? ad.creative.id : null
          }));
          adsData.push(...adsWithAdset);
          console.log(`Successfully fetched ${adsWithAdset.length} ads for adset ${adset.id}`);
        } else {
          console.error(`Error response from Meta API for adset ${adset.id}:`, adsResponse.status, adsResponse.statusText);
        }
      } catch (error) {
        console.error(`Error fetching ads for adset ${adset.id}:`, error);
      }
    }

    console.log(`Fetched ${adsData.length} ads from Meta Graph API`);

    // Process and upsert ads to Supabase
    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const ad of adsData) {
      try {
        // Transform Meta API data to match Supabase schema
        const adData = {
          id: parseInt(ad.id),
          ad_set_id: parseInt(ad.ad_set_id),
          name: ad.name,
          status: ad.status,
          creative_id: ad.creative_id ? parseInt(ad.creative_id) : null,
          effective_status: ad.effective_status,
          created_time: ad.created_time ? new Date(ad.created_time).toISOString() : null,
          updated_time: ad.updated_time ? new Date(ad.updated_time).toISOString() : null
        };

        console.log(`Upserting ad: ${adData.id} - ${adData.name}`);

        // Perform upsert operation
        const { error } = await supabase
          .from('ads')
          .upsert(adData, { 
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error upserting ad ${adData.id}:`, error);
          upsertResults.errors.push({
            adId: adData.id,
            error: error.message
          });
        } else {
          upsertResults.processed++;
          console.log(`Successfully upserted ad ${adData.id}`);
        }
      } catch (processingError) {
        console.error(`Error processing ad ${ad.id}:`, processingError);
        upsertResults.errors.push({
          adId: ad.id,
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
        message: 'Ads fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        statusFilter: statusFilter || 'all',
        totalCount: adsData.length,
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