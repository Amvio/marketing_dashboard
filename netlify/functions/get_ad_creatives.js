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

    // Step 1: Get ad IDs and names from Supabase based on status filter
    console.log('Fetching ad IDs and names from Supabase ads table...');

    let adsQuery = supabase
      .from('ads')
      .select('id, name, creative_id')
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

    // Create a map of creative_id to ad name for later use
    const creativeToAdNameMap = new Map();
    (adsData || []).forEach(ad => {
      if (ad.creative_id) {
        creativeToAdNameMap.set(String(ad.creative_id), ad.name);
      }
    });
    console.log(`Created mapping for ${creativeToAdNameMap.size} creatives to ad names`);

    // Get unique ad IDs
    const uniqueAdIds = [...new Set((adsData || []).map(ad => ad.id).filter(Boolean))];
    console.log(`Found ${uniqueAdIds.length} unique ad IDs`);

    // Helper function to safely get nested property
    const safeGet = (obj, path, defaultValue = null) => {
      try {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
          if (result === null || result === undefined) return defaultValue;
          // Handle array access like 'images[0]'
          if (key.includes('[')) {
            const arrayMatch = key.match(/(.+)\[(\d+)\]/);
            if (arrayMatch) {
              const arrayKey = arrayMatch[1];
              const index = parseInt(arrayMatch[2]);
              result = result[arrayKey];
              if (!Array.isArray(result) || result.length <= index) return defaultValue;
              result = result[index];
            }
          } else {
            result = result[key];
          }
        }
        return result === null || result === undefined ? defaultValue : result;
      } catch (e) {
        return defaultValue;
      }
    };

    // Step 2: Get creative for each ad using Meta Graph API
    let creativesData = [];

    for (const adId of uniqueAdIds) {
      const adUrl = `https://graph.facebook.com/v19.0/${adId}`;
      const adParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'creative{id,name,object_story_spec,asset_feed_spec,created_time,updated_time}',
      });

      try {
        console.log(`Fetching creative for ad ${adId}...`);

        const adResponse = await fetch(`${adUrl}?${adParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (adResponse.ok) {
          const adResult = await adResponse.json();
          if (adResult.creative) {
            creativesData.push(adResult.creative);
            console.log(`Successfully fetched creative ${adResult.creative.id} for ad ${adId}`);
          } else {
            console.log(`No creative found for ad ${adId}`);
          }
        } else {
          console.error(`Error response from Meta API for ad ${adId}:`, adResponse.status, adResponse.statusText);
        }
      } catch (error) {
        console.error(`Error fetching creative for ad ${adId}:`, error);
      }
    }

    // Remove duplicate creatives based on ID
    const uniqueCreatives = Array.from(
      new Map(creativesData.map(creative => [creative.id, creative])).values()
    );

    console.log(`Fetched ${uniqueCreatives.length} unique ad creatives from Meta Graph API`);

    // Process and upsert ad creatives to Supabase
    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const creative of uniqueCreatives) {
      try {
        const creativeId = String(creative.id);

        // Determine which spec is present and log it
        const hasObjectStory = creative.object_story_spec && Object.keys(creative.object_story_spec).length > 0;
        const hasAssetFeed = creative.asset_feed_spec && Object.keys(creative.asset_feed_spec).length > 0;

        if (hasObjectStory) {
          console.log(`Creative ${creativeId}: Processing object_story_spec`);
        }
        if (hasAssetFeed) {
          console.log(`Creative ${creativeId}: Processing asset_feed_spec`);
        }

        // Initialize all fields
        let name = creative.name || creativeToAdNameMap.get(creativeId);
        let title = null;
        let message = null;
        let description = null;
        let url = null;
        let hash = null;
        let image_url = null;
        let video_url = null;
        let call_to_action = null;

        // Extract data from object_story_spec
        if (hasObjectStory) {
          const oss = creative.object_story_spec;

          // Extract URL
          url = safeGet(oss, 'link_data.link') || safeGet(oss, 'video_data.call_to_action.value.link');

          // Extract title
          title = safeGet(oss, 'link_data.name') || safeGet(oss, 'video_data.title');

          // Extract message
          message = safeGet(oss, 'link_data.message') || safeGet(oss, 'video_data.message');

          // Extract description
          description = safeGet(oss, 'link_data.description') || safeGet(oss, 'video_data.description');

          // Extract hash
          hash = safeGet(oss, 'video_data.image_hash');

          // Extract image_url
          image_url = safeGet(oss, 'link_data.picture') || safeGet(oss, 'video_data.image_url');

          // Extract video_url (video_id needs to be converted)
          const videoId = safeGet(oss, 'video_data.video_id');
          if (videoId) {
            video_url = `https://www.facebook.com/video.php?v=${videoId}`;
          }

          // Extract call_to_action
          call_to_action = safeGet(oss, 'link_data.call_to_action.type') ||
                          safeGet(oss, 'video_data.call_to_action.type');

          // If name not found, use title from object_story_spec
          if (!name && title) {
            name = title;
          }
        }

        // Extract data from asset_feed_spec (prioritize/override with asset_feed_spec data)
        if (hasAssetFeed) {
          const afs = creative.asset_feed_spec;

          // Extract hash from images array
          const imageHash = safeGet(afs, 'images[0].hash');
          if (imageHash) hash = imageHash;

          // Extract image_url from images array
          const imageUrl = safeGet(afs, 'images[0].url');
          if (imageUrl) image_url = imageUrl;

          // Extract video information
          const videoId = safeGet(afs, 'videos[0].video_id');
          if (videoId) {
            video_url = `https://www.facebook.com/video.php?v=${videoId}`;
          }

          // Extract title from titles array
          const titleText = safeGet(afs, 'titles[0].text');
          if (titleText) title = titleText;

          // Extract message from bodies array
          const bodyText = safeGet(afs, 'bodies[0].text');
          if (bodyText) message = bodyText;

          // Extract description from descriptions array
          const descText = safeGet(afs, 'descriptions[0].text');
          if (descText) description = descText;

          // Extract URL from link_urls array
          const linkUrl = safeGet(afs, 'link_urls[0].website_url');
          if (linkUrl) url = linkUrl;

          // Extract call_to_action from call_to_action_types array
          const ctaType = safeGet(afs, 'call_to_action_types[0]');
          if (ctaType) call_to_action = ctaType;

          // If name not found, use title from asset_feed_spec
          if (!name && titleText) {
            name = titleText;
          }
        }

        // Transform Meta API data to match Supabase schema
        const creativeData = {
          id: creativeId,
          name: name,
          title: title,
          message: message,
          description: description,
          url: url,
          hash: hash,
          image_url: image_url,
          video_url: video_url,
          call_to_action: call_to_action,
          created_time: creative.created_time ? new Date(creative.created_time).toISOString() : null
        };

        console.log(`Upserting ad creative: ${creativeData.id} - ${creativeData.name || 'unnamed'}`);
        console.log(`  - Title: ${creativeData.title ? 'Yes' : 'No'}`);
        console.log(`  - Message: ${creativeData.message ? 'Yes' : 'No'}`);
        console.log(`  - Description: ${creativeData.description ? 'Yes' : 'No'}`);
        console.log(`  - URL: ${creativeData.url ? 'Yes' : 'No'}`);
        console.log(`  - Hash: ${creativeData.hash || 'none'}`);
        console.log(`  - Image URL: ${creativeData.image_url ? 'Yes' : 'No'}`);
        console.log(`  - Video URL: ${creativeData.video_url ? 'Yes' : 'No'}`);
        console.log(`  - CTA: ${creativeData.call_to_action || 'none'}`);

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
        totalCount: uniqueCreatives.length,
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