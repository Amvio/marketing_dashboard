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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST method is supported for this endpoint',
      }),
    };
  }

  try {
    console.log('Starting creative images fetch process...');

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

    const body = JSON.parse(event.body);
    const adAccountId = body.adAccountId;

    if (!adAccountId) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'adAccountId is required',
        }),
      };
    }

    console.log(`Fetching creatives with missing image_url for ad account: ${adAccountId}`);

    const { data: creativesData, error: creativesError } = await supabase
      .from('ad_creatives')
      .select('id, hash, image_url')
      .is('image_url', null)
      .not('hash', 'is', null);

    if (creativesError) {
      console.error('Error fetching creatives from Supabase:', creativesError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Supabase Error',
          message: `Failed to fetch creatives: ${creativesError.message}`,
        }),
      };
    }

    console.log(`Found ${(creativesData || []).length} creatives with missing image_url`);

    if (!creativesData || creativesData.length === 0) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'No creatives with missing image_url found',
          processed: 0,
          errors: []
        }),
      };
    }

    const results = {
      processed: 0,
      errors: [],
      updated: []
    };

    const hashGroups = [];
    const batchSize = 50;

    for (let i = 0; i < creativesData.length; i += batchSize) {
      hashGroups.push(creativesData.slice(i, i + batchSize));
    }

    for (const group of hashGroups) {
      const hashes = group.map(c => c.hash);
      const hashesParam = JSON.stringify(hashes);

      const apiUrl = `https://graph.facebook.com/v19.0/act_${adAccountId}/adimages`;
      const params = new URLSearchParams({
        access_token: accessToken,
        hashes: hashesParam,
        fields: 'hash,url,permalink_url'
      });

      try {
        console.log(`Fetching images for ${hashes.length} hashes...`);

        const response = await fetch(`${apiUrl}?${params.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Meta API error for batch:`, response.status, errorText);
          results.errors.push({
            batch: hashes,
            error: `API error: ${response.status} - ${errorText}`
          });
          continue;
        }

        const result = await response.json();
        console.log(`Successfully fetched image data for batch`);

        if (result.data) {
          for (const imageData of result.data) {
            const creative = group.find(c => c.hash === imageData.hash);

            if (creative) {
              const updateData = {
                image_url: imageData.url || null,
                permalink_url: imageData.permalink_url || null
              };

              const { error: updateError } = await supabase
                .from('ad_creatives')
                .update(updateData)
                .eq('id', creative.id);

              if (updateError) {
                console.error(`Error updating creative ${creative.id}:`, updateError);
                results.errors.push({
                  creativeId: creative.id,
                  hash: imageData.hash,
                  error: updateError.message
                });
              } else {
                results.processed++;
                results.updated.push({
                  creativeId: creative.id,
                  hash: imageData.hash,
                  image_url: imageData.url,
                  permalink_url: imageData.permalink_url
                });
                console.log(`Updated creative ${creative.id} with image data`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing batch:`, error);
        results.errors.push({
          batch: hashes,
          error: error.message
        });
      }
    }

    console.log(`Creative images fetch completed. Processed: ${results.processed}, Errors: ${results.errors.length}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Creative images fetch completed',
        timestamp: new Date().toISOString(),
        adAccountId: adAccountId,
        totalFound: creativesData.length,
        processed: results.processed,
        errors: results.errors.length,
        errorDetails: results.errors,
        updated: results.updated
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
