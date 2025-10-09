const fetch = require('node-fetch').default;
const { createClient } = require('@supabase/supabase-js');
const { TimeoutMonitor } = require('./utils/timeoutMonitor');

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

  const timeoutMonitor = new TimeoutMonitor(5500);

  try {
    console.log('Fetching ad insights from Meta Graph API...');

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
      .select('id')
      .order('id', { ascending: true });

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
          totalCount: 0,
          supabaseSync: {
            processed: 0,
            errors: 0,
            errorDetails: []
          },
          timeout: {
            occurred: false,
            lastProcessedId: null
          }
        }),
      };
    }

    console.log('Step 2: Fetching insights for each ad from Meta Graph API...');

    let allInsightsData = [];
    let apiErrors = [];
    let timedOut = false;
    let adsProcessed = 0;

    for (const ad of adsData) {
      if (!timeoutMonitor.hasTimeRemaining()) {
        console.log(`Timeout approaching. Stopping at ad ${ad.id}. Processed ${adsProcessed} of ${adsData.length} ads.`);
        timedOut = true;
        timeoutMonitor.setLastProcessedId(ad.id);
        break;
      }

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
          adsProcessed++;
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
      if (!timeoutMonitor.hasTimeRemaining()) {
        console.log(`Timeout approaching during upsert. Stopping.`);
        timedOut = true;
        break;
      }

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

    console.log(`Supabase Sync completed. Processed: ${upsertResults.processed}, Errors: ${upsertResults.errors.length}`);

    if (jobId && timedOut) {
      const { error: jobUpdateError } = await supabase
        .from('sync_jobs')
        .update({
          status: 'failed',
          error_message: `Function timed out after processing ${adsProcessed} of ${adsData.length} ads`,
          last_processed_id: timeoutMonitor.lastProcessedId,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (jobUpdateError) {
        console.error('Error updating job status:', jobUpdateError);
      }
    }

    const statusCode = timedOut ? 206 : 200;

    return {
      statusCode,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: timedOut
          ? 'Ad insights fetch timed out - partial results returned'
          : 'Ad insights fetched successfully from Meta Graph API',
        source: 'Meta Graph API',
        timestamp: new Date().toISOString(),
        dateRange: { startDate, endDate },
        totalCount: allInsightsData.length,
        adsQueried: adsProcessed,
        totalAds: adsData.length,
        apiErrors: apiErrors.length > 0 ? apiErrors : undefined,
        supabaseSync: {
          processed: upsertResults.processed,
          errors: upsertResults.errors.length,
          errorDetails: upsertResults.errors
        },
        timeout: {
          occurred: timedOut,
          lastProcessedId: timeoutMonitor.lastProcessedId,
          elapsedMs: timeoutMonitor.getElapsedTime(),
          adsProcessed,
          adsRemaining: adsData.length - adsProcessed
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
        timeout: {
          occurred: false,
          lastProcessedId: timeoutMonitor.lastProcessedId
        }
      }),
    };
  }
};
