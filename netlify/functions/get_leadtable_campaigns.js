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
    console.log('Fetching Lead-Table campaigns for all customers...');

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

    // Fetch all customers with leadtable_id
    console.log('Fetching customers with leadtable_id from Kunden table...');
    const { data: customers, error: customersError } = await supabase
      .from('Kunden')
      .select('customer_id, leadtable_id, customer_name')
      .not('leadtable_id', 'is', null);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to fetch customers from Kunden table',
          details: customersError.message,
        }),
      };
    }

    if (!customers || customers.length === 0) {
      console.log('No customers with leadtable_id found');
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'No customers with Lead-Table ID found',
          customersProcessed: 0,
          totalCampaigns: 0,
          supabaseSync: {
            inserted: 0,
            updated: 0,
            errors: 0
          }
        }),
      };
    }

    console.log(`Found ${customers.length} customers with leadtable_id`);

    let syncResults = {
      customersProcessed: 0,
      customersWithCampaigns: 0,
      totalCampaignsFetched: 0,
      inserted: 0,
      updated: 0,
      errors: [],
      customerErrors: []
    };

    // Process each customer
    for (const customer of customers) {
      try {
        syncResults.customersProcessed++;

        const leadTableApiUrl = `https://api.lead-table.com/api/v3/external/campaign/all/${customer.leadtable_id}`;

        console.log(`Fetching campaigns for customer ${customer.customer_name} (${customer.leadtable_id})...`);

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
          console.error(`Lead-Table API error for customer ${customer.leadtable_id}:`, {
            status: leadTableResponse.status,
            statusText: leadTableResponse.statusText,
            body: errorText
          });

          syncResults.customerErrors.push({
            customerId: customer.customer_id,
            leadtableId: customer.leadtable_id,
            customerName: customer.customer_name,
            error: `API returned ${leadTableResponse.status}: ${leadTableResponse.statusText}`
          });
          continue;
        }

        const leadTableData = await leadTableResponse.json();
        const campaigns = leadTableData.campaigns || [];

        console.log(`Fetched ${campaigns.length} campaigns for customer ${customer.customer_name}`);

        if (campaigns.length > 0) {
          syncResults.customersWithCampaigns++;
          syncResults.totalCampaignsFetched += campaigns.length;
        }

        // Process each campaign
        for (const campaign of campaigns) {
          try {
            const campaignData = {
              campaign_id: campaign._id,
              customer_id: customer.customer_id,
              leadtable_customer_id: customer.leadtable_id,
              occupation: campaign.occupation || null,
              archived: campaign.archived || false,
              leads_count: campaign.leadsCount || 0,
              created_at: campaign.createdAt ? new Date(campaign.createdAt).toISOString() : null,
              last_change: campaign.lastChange ? new Date(campaign.lastChange).toISOString() : null,
              synced_at: new Date().toISOString()
            };

            console.log(`Upserting campaign ${campaignData.campaign_id} for customer ${customer.customer_name}`);

            const { data, error } = await supabase
              .from('leadtable_campaigns')
              .upsert(campaignData, {
                onConflict: 'campaign_id',
                ignoreDuplicates: false
              })
              .select();

            if (error) {
              console.error(`Error upserting campaign ${campaignData.campaign_id}:`, error);
              syncResults.errors.push({
                campaignId: campaignData.campaign_id,
                customerId: customer.customer_id,
                error: error.message
              });
            } else {
              // Check if it was an insert or update by checking if record existed
              const { data: existingCheck } = await supabase
                .from('leadtable_campaigns')
                .select('id')
                .eq('campaign_id', campaign._id)
                .maybeSingle();

              if (existingCheck) {
                syncResults.updated++;
              } else {
                syncResults.inserted++;
              }

              console.log(`Successfully upserted campaign ${campaignData.campaign_id}`);
            }
          } catch (campaignError) {
            console.error(`Error processing campaign ${campaign._id}:`, campaignError);
            syncResults.errors.push({
              campaignId: campaign._id,
              customerId: customer.customer_id,
              error: campaignError.message
            });
          }
        }

      } catch (customerError) {
        console.error(`Error processing customer ${customer.leadtable_id}:`, customerError);
        syncResults.customerErrors.push({
          customerId: customer.customer_id,
          leadtableId: customer.leadtable_id,
          customerName: customer.customer_name,
          error: customerError.message
        });
      }
    }

    console.log('Lead-Table campaigns sync completed');
    console.log(`Customers processed: ${syncResults.customersProcessed}`);
    console.log(`Customers with campaigns: ${syncResults.customersWithCampaigns}`);
    console.log(`Total campaigns fetched: ${syncResults.totalCampaignsFetched}`);
    console.log(`Inserted: ${syncResults.inserted}, Updated: ${syncResults.updated}`);
    console.log(`Errors: ${syncResults.errors.length}, Customer errors: ${syncResults.customerErrors.length}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Lead-Table campaigns synced successfully',
        source: 'Lead-Table API',
        timestamp: new Date().toISOString(),
        customersProcessed: syncResults.customersProcessed,
        customersWithCampaigns: syncResults.customersWithCampaigns,
        totalCampaignsFetched: syncResults.totalCampaignsFetched,
        supabaseSync: {
          inserted: syncResults.inserted,
          updated: syncResults.updated,
          errors: syncResults.errors.length,
          customerErrors: syncResults.customerErrors.length,
          errorDetails: syncResults.errors,
          customerErrorDetails: syncResults.customerErrors
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
