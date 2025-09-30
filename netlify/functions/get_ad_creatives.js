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
    console.log('Fetching ad creatives from Meta Graph API...');
    
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

    // Step 1: Get ad IDs from Supabase based on status filter
    console.log('Fetching ad IDs from Supabase ads table...');
    
    let adsQuery = supabase
      .from('ads')
      .select('id, creative_id')
      .not('creative_id', 'is', null)
      .order('id', { ascending: true });

    // Apply status filter if specified
    if (statusFilter === 'active') {
      adsQuery = adsQuery.eq('status', 'ACTIVE');
    }

    const { data: adsData, error: adsError } = await adsQuery;

    if (adsError) {
      console.error('Error fetching ads from Supabase:', adsError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Supabase Error',
          message: `Failed to fetch ads from Supabase: ${adsError.message}`,
        }),
      };
    }

    console.log(`Found ${(adsData || []).length} ads in Supabase${statusFilter === 'active' ? ' (active only)' : ''}`);
    
    // Get unique creative IDs
    const uniqueCreativeIds = [...new Set((adsData || []).map(ad => ad.creative_id).filter(Boolean))];
    console.log(`Found ${uniqueCreativeIds.length} unique creative IDs`);
    
    // Step 2: Get all ad creatives for each creative ID
    let creativesData = [];
    
    for (const creativeId of uniqueCreativeIds) {
      const creativesUrl = `https://graph.facebook.com/v19.0/${creativeId}`;
      const creativesParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name,title,body,image_url,video_id,thumbnail_url,url_tags,call_to_action_type,object_story_spec,asset_feed_spec,created_time,updated_time',
        limit: '100'
      });
      
      try {
        console.log(`Fetching creative ${creativeId}...`);
        
        const creativesResponse = await fetch(`${creativesUrl}?${creativesParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (creativesResponse.ok) {
          const creativesResult = await creativesResponse.json();
          creativesData.push(creativesResult);
          console.log(`Successfully fetched creative ${creativeId}`);
        } else {
          console.error(`Error response from Meta API for creative ${creativeId}:`, creativesResponse.status, creativesResponse.statusText);
        }
      } catch (error) {
        console.error(`Error fetching creative ${creativeId}:`, error);
      }
    }

    console.log(`Fetched ${creativesData.length} ad creatives from Meta Graph API`);

    // Process and upsert ad creatives to Supabase
    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const creative of creativesData) {
      try {
        // Transform Meta API data to match Supabase schema
        const creativeData = {
          id: String(creative.id),
          name: creative.name,
          title: creative.title,
          body: creative.body,
          image_url: creative.image_url,
          video_id: creative.video_id,
          thumbnail_url: creative.thumbnail_url,
          url_tags: creative.url_tags,
          call_to_action_type: creative.call_to_action_type,
          object_story_spec: creative.object_story_spec ? JSON.stringify(creative.object_story_spec) : null,
          asset_feed_spec: creative.asset_feed_spec ? JSON.stringify(creative.asset_feed_spec) : null,
          created_time: creative.created_time ? new Date(creative.created_time).toISOString() : null,
          updated_time: creative.updated_time ? new Date(creative.updated_time).toISOString() : null
        };

        console.log(`Upserting ad creative: ${creativeData.id} - ${creativeData.name}`);

        // Perform upsert operation
        const { error } = await supabase
          .from('ad_creatives')
          .upsert(creativeData, { 
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error upserting ad creative ${creativeData.id}:`, error);
          upsertResults.errors.push({
            creativeId: creativeData.id,
            error: error.message
          });
        } else {
          upsertResults.processed++;
          console.log(`Successfully upserted ad creative ${creativeData.id}`);
        }
      } catch (processingError) {
        console.error(`Error processing ad creative ${creative.id}:`, processingError);
        upsertResults.errors.push({
          creativeId: creative.id,
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
        message: 'Ad creatives fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        statusFilter: statusFilter || 'all',
        totalCount: creativesData.length,
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