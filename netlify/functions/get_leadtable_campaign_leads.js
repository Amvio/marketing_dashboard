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
    const customerIds = event.queryStringParameters?.customerIds
      ? event.queryStringParameters.customerIds.split(',').map(id => id.trim())
      : null;

    if (customerIds) {
      console.log(`Fetching Lead-Table leads for ${customerIds.length} selected customers...`);
    } else {
      console.log('Fetching Lead-Table leads for all campaigns...');
    }

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

    // Fetch campaigns from leadtable_campaigns table (filtered by customer_id if provided)
    console.log('Fetching campaigns from leadtable_campaigns table...');
    let campaignsQuery = supabase
      .from('leadtable_campaigns')
      .select('campaign_id, occupation, customer_id, leadtable_customer_id');

    if (customerIds && customerIds.length > 0) {
      campaignsQuery = campaignsQuery.in('customer_id', customerIds);
      console.log(`Filtering campaigns for customer_ids: ${customerIds.join(', ')}`);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to fetch campaigns from leadtable_campaigns table',
          details: campaignsError.message,
        }),
      };
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns found in leadtable_campaigns table');
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'No campaigns found',
          campaignsProcessed: 0,
          totalLeads: 0,
          supabaseSync: {
            inserted: 0,
            updated: 0,
            errors: 0
          }
        }),
      };
    }

    console.log(`Found ${campaigns.length} campaigns`);

    let syncResults = {
      campaignsProcessed: 0,
      campaignsWithLeads: 0,
      totalLeadsFetched: 0,
      inserted: 0,
      updated: 0,
      errors: [],
      campaignErrors: []
    };

    // Process each campaign
    for (const campaign of campaigns) {
      try {
        syncResults.campaignsProcessed++;

        const leadTableApiUrl = `https://api.lead-table.com/api/v3/external/lead/campaign/${campaign.campaign_id}?page=1&limit=750`;

        console.log(`Fetching leads for campaign ${campaign.campaign_id} (${campaign.occupation || 'N/A'})...`);

        const leadTableResponse = await fetch(leadTableApiUrl, {
          method: 'GET',
          headers: {
            'email': leadTableEmail,
            'x-api-key': leadTableApiKey,
            'accept': 'application/json',
          },
        });

        if (!leadTableResponse.ok) {
          const errorText = await leadTableResponse.text();
          console.error(`Lead-Table API error for campaign ${campaign.campaign_id}:`, {
            status: leadTableResponse.status,
            statusText: leadTableResponse.statusText,
            body: errorText
          });

          syncResults.campaignErrors.push({
            campaignId: campaign.campaign_id,
            occupation: campaign.occupation,
            error: `API returned ${leadTableResponse.status}: ${leadTableResponse.statusText}`
          });
          continue;
        }

        const leadTableData = await leadTableResponse.json();
        const leads = leadTableData.leads || [];

        console.log(`Fetched ${leads.length} leads for campaign ${campaign.campaign_id}`);

        if (leads.length > 0) {
          syncResults.campaignsWithLeads++;
          syncResults.totalLeadsFetched += leads.length;
        }

        // Process each lead
        for (const lead of leads) {
          try {
            // Determine qualified status by checking history
            let qualified = 'NO';
            let customer_denied = 'NO';

            if (lead.history && Array.isArray(lead.history)) {
              for (const historyEntry of lead.history) {
                if (historyEntry.newStatus === 'Potential' || historyEntry.newStatus === 'Qualifiziert') {
                  qualified = 'YES';
                }
                if (historyEntry.newStatus === 'Absage' || historyEntry.newStatus === 'Absage AMVIO') {
                  customer_denied = 'YES';
                }
              }
            }

            const leadData = {
              lead_id: lead._id,
              campaign_id: campaign.campaign_id,
              name: lead.name || null,
              status: lead.status || null,
              utm_campaign: lead.utmCampaign || null,
              utm_id: lead.utmId || null,
              owner_customer: lead.ownerCustomer || null,
              owner_table: lead.ownerTable || null,
              qualified: qualified,
              customer_denied: customer_denied,
              created_time: lead.createdAt ? new Date(lead.createdAt).toISOString() : null,
              last_change: lead.lastChange ? new Date(lead.lastChange).toISOString() : null,
              synced_at: new Date().toISOString()
            };

            console.log(`Upserting lead ${leadData.lead_id} for campaign ${campaign.campaign_id}`);

            // Check if lead exists to track insert vs update
            const { data: existingLead } = await supabase
              .from('leadtable_leads')
              .select('id')
              .eq('lead_id', lead._id)
              .maybeSingle();

            const { data, error } = await supabase
              .from('leadtable_leads')
              .upsert(leadData, {
                onConflict: 'lead_id',
                ignoreDuplicates: false
              })
              .select();

            if (error) {
              console.error(`Error upserting lead ${leadData.lead_id}:`, error);
              syncResults.errors.push({
                leadId: leadData.lead_id,
                campaignId: campaign.campaign_id,
                error: error.message
              });
            } else {
              if (existingLead) {
                syncResults.updated++;
              } else {
                syncResults.inserted++;
              }
              console.log(`Successfully upserted lead ${leadData.lead_id}`);
            }
          } catch (leadError) {
            console.error(`Error processing lead ${lead._id}:`, leadError);
            syncResults.errors.push({
              leadId: lead._id,
              campaignId: campaign.campaign_id,
              error: leadError.message
            });
          }
        }

      } catch (campaignError) {
        console.error(`Error processing campaign ${campaign.campaign_id}:`, campaignError);
        syncResults.campaignErrors.push({
          campaignId: campaign.campaign_id,
          occupation: campaign.occupation,
          error: campaignError.message
        });
      }
    }

    console.log('Lead-Table leads sync completed');
    console.log(`Campaigns processed: ${syncResults.campaignsProcessed}`);
    console.log(`Campaigns with leads: ${syncResults.campaignsWithLeads}`);
    console.log(`Total leads fetched: ${syncResults.totalLeadsFetched}`);
    console.log(`Inserted: ${syncResults.inserted}, Updated: ${syncResults.updated}`);
    console.log(`Errors: ${syncResults.errors.length}, Campaign errors: ${syncResults.campaignErrors.length}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Lead-Table leads synced successfully',
        source: 'Lead-Table API',
        timestamp: new Date().toISOString(),
        campaignsProcessed: syncResults.campaignsProcessed,
        campaignsWithLeads: syncResults.campaignsWithLeads,
        totalLeadsFetched: syncResults.totalLeadsFetched,
        supabaseSync: {
          inserted: syncResults.inserted,
          updated: syncResults.updated,
          errors: syncResults.errors.length,
          campaignErrors: syncResults.campaignErrors.length,
          errorDetails: syncResults.errors,
          campaignErrorDetails: syncResults.campaignErrors
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
