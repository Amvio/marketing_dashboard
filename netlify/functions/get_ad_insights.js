const fetch = require('node-fetch').default;
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const functionStartTime = Date.now();
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
    console.log('Fetching ad insights from Meta Graph API - Function started at', new Date().toISOString());

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

    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    const statusFilter = queryParams.statusFilter;
    const jobId = queryParams.jobId;
    const adsetIds = queryParams.adsetIds
      ? queryParams.adsetIds.split(',').map(id => id.trim())
      : null;

    if (!startDate || !endDate) {
      console.error('Missing required date parameters');
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Both startDate and endDate query parameters are required (format: YYYY-MM-DD).',
        }),
      };
    }

    console.log(`Date range: ${startDate} to ${endDate}`);

    if (new Date(startDate) > new Date(endDate)) {
      console.log('Start date is after end date');
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Start date cannot be after end date.',
          dateRange: { startDate, endDate }
        }),
      };
    }

    console.log('Step 1: Fetching ad IDs from Supabase ads table...');

    let adsQuery = supabase
      .from('ads')
      .select('id, ad_set_id')
      .order('id', { ascending: true });

    if (adsetIds && adsetIds.length > 0) {
      console.log(`Filtering ads for ${adsetIds.length} selected adsets...`);
      adsQuery = adsQuery.in('ad_set_id', adsetIds);
    }

    if (statusFilter === 'active') {
      adsQuery = adsQuery.eq('effective_status', 'ACTIVE');
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

    const filterDescription = [];
    if (adsetIds && adsetIds.length > 0) {
      filterDescription.push(`${adsetIds.length} selected adsets`);
    }
    if (statusFilter === 'active') {
      filterDescription.push('active only');
    }
    const filterText = filterDescription.length > 0 ? ` (${filterDescription.join(', ')})` : '';

    console.log(`Found ${(adsData || []).length} ads in Supabase${filterText}`);

    if (!adsData || adsData.length === 0) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'No ads found in database to fetch insights for',
          source: 'Meta Graph API',
          timestamp: new Date().toISOString(),
          dateRange: { startDate, endDate },
          adsetIds: adsetIds || 'all',
          selectedAdsetCount: adsetIds ? adsetIds.length : 'all',
          totalCount: 0,
          supabaseSync: {
            processed: 0,
            errors: 0,
            errorDetails: []
          }
        }),
      };
    }

    console.log('Step 2: Fetching insights for each ad from Meta Graph API...');

    let allInsightsData = [];
    let apiErrors = [];

    for (const ad of adsData) {
      const insightsUrl = `https://graph.facebook.com/v19.0/${ad.id}/insights`;
      const insightsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'ad_name,clicks,conversions,cpc,cpm,cpp,ctr,frequency,impressions,reach,spend,attribution_setting,adset_id,campaign_id,ad_id',
        time_increment: '1',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        limit: '100'
      });

      try {
        console.log(`Fetching insights for ad ${ad.id}...`);

        const insightsResponse = await fetch(`${insightsUrl}?${insightsParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (insightsResponse.ok) {
          const insightsResult = await insightsResponse.json();
          const insights = insightsResult.data || [];

          for (const insight of insights) {
            allInsightsData.push({
              ...insight,
              ad_id: ad.id
            });
          }

          console.log(`Successfully fetched ${insights.length} insight records for ad ${ad.id}`);
        } else {
          const errorText = await insightsResponse.text();
          console.error(`Error response from Meta API for ad ${ad.id}:`, insightsResponse.status, errorText);
          apiErrors.push({
            adId: ad.id,
            status: insightsResponse.status,
            error: errorText
          });
        }
      } catch (error) {
        console.error(`Error fetching insights for ad ${ad.id}:`, error);
        apiErrors.push({
          adId: ad.id,
          error: error.message
        });
      }
    }

    console.log(`Fetched ${allInsightsData.length} total insight records from Meta Graph API`);

    console.log('Step 3: Upserting insights to Supabase...');

    let upsertResults = {
      processed: 0,
      errors: []
    };

    for (const insight of allInsightsData) {
      try {
        const insightData = {
          ad_id: insight.ad_id ? String(insight.ad_id) : null,
          ad_set_id: insight.adset_id ? String(insight.adset_id) : null,
          campaign_id: insight.campaign_id ? String(insight.campaign_id) : null,
          date: insight.date_start || insight.date_stop,
          ad_name: insight.ad_name || null,
          impressions: insight.impressions ? parseInt(insight.impressions) : null,
          clicks: insight.clicks ? parseInt(insight.clicks) : null,
          spend: insight.spend ? parseFloat(insight.spend) : null,
          reach: insight.reach ? parseInt(insight.reach) : null,
          frequency: insight.frequency ? parseFloat(insight.frequency) : null,
          ctr: insight.ctr ? parseFloat(insight.ctr) : null,
          cpm: insight.cpm ? parseFloat(insight.cpm) : null,
          cpc: insight.cpc ? parseFloat(insight.cpc) : null,
          cpp: insight.cpp ? parseFloat(insight.cpp) : null,
          conversions: insight.conversions ? parseFloat(insight.conversions) : null,
          attribution_setting: insight.attribution_setting ? JSON.stringify(insight.attribution_setting) : null
        };

        console.log(`Upserting insight for ad ${insightData.ad_id} on ${insightData.date}`);

        const { error } = await supabase
          .from('ad_insights')
          .upsert(insightData, {
            onConflict: 'ad_id,date',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error upserting insight for ad ${insightData.ad_id} on ${insightData.date}:`, error);
          upsertResults.errors.push({
            adId: insightData.ad_id,
            date: insightData.date,
            error: error.message
          });
        } else {
          upsertResults.processed++;
          console.log(`Successfully upserted insight for ad ${insightData.ad_id} on ${insightData.date}`);
        }
      } catch (processingError) {
        console.error(`Error processing insight:`, processingError);
        upsertResults.errors.push({
          adId: insight.ad_id,
          error: processingError.message
        });
      }
    }

    const functionEndTime = Date.now();
    const totalElapsedMs = functionEndTime - functionStartTime;

    console.log(`Supabase Sync completed. Processed: ${upsertResults.processed}, Errors: ${upsertResults.errors.length}`);
    console.log(`Function completed successfully in ${totalElapsedMs}ms`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Ad insights fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        dateRange: { startDate, endDate },
        adsetIds: adsetIds || 'all',
        selectedAdsetCount: adsetIds ? adsetIds.length : 'all',
        totalCount: allInsightsData.length,
        apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
        supabaseSync: {
          processed: upsertResults.processed,
          errors: upsertResults.errors.length,
          errorDetails: upsertResults.errors
        }
      }),
    };

  } catch (error) {
    const functionEndTime = Date.now();
    const totalElapsedMs = functionEndTime - functionStartTime;

    const isTimeout = error.name === 'TimeoutError' ||
                      error.code === 'ETIMEDOUT' ||
                      error.message?.includes('timeout') ||
                      error.message?.includes('timed out');

    if (isTimeout) {
      console.error(`Function timed out after ${totalElapsedMs}ms:`, error);
    } else {
      console.error(`Function error after ${totalElapsedMs}ms:`, error);
    }

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: isTimeout ? 'Function timeout' : 'Internal server error',
        message: error.message,
        elapsedMs: totalElapsedMs
      }),
    };
  }
};
