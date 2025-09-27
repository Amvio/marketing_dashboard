const fetch = require('node-fetch').default;

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

  try {
    // Get request method and body
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};
    const tableName = queryParams.table;

    // Special handling for ad_accounts table - fetch from Meta Graph API
    if (tableName === 'ad_accounts' && method === 'GET') {
      console.log('Fetching ad accounts from Meta Graph API...');
      
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
            message: 'Meta Graph API access token is not configured. Please set META_GRAPH_API_ACCESS_TOKEN environment variable.',
          }),
        };
      }

      try {
        // Construct Meta Graph API URL for ad accounts
        const metaApiUrl = `https://graph.facebook.com/v19.0/me/adaccounts`;
        const metaApiParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status,created_time',
          limit: '25'
        });
        
        const fullMetaApiUrl = `${metaApiUrl}?${metaApiParams.toString()}`;
        
        console.log('Making request to Meta Graph API:', metaApiUrl);
        
        // Make request to Meta Graph API
        const metaResponse = await fetch(fullMetaApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!metaResponse.ok) {
          const errorText = await metaResponse.text();
          console.error('Meta Graph API error response:', {
            status: metaResponse.status,
            statusText: metaResponse.statusText,
            body: errorText
          });
          
          return {
            statusCode: metaResponse.status,
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: 'Meta Graph API Error',
              message: `Meta API returned ${metaResponse.status}: ${metaResponse.statusText}`,
              details: errorText,
            }),
          };
        }

        const metaData = await metaResponse.json();
        console.log('Meta Graph API response received:', {
          dataCount: metaData.data ? metaData.data.length : 0,
          hasData: !!metaData.data
        });

        // Return the Meta Graph API data
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Ad accounts fetched successfully from Meta Graph API',
            source: 'Meta Graph API',
            timestamp: new Date().toISOString(),
            data: metaData.data || [],
            paging: metaData.paging || null,
            summary: metaData.summary || null,
            totalCount: metaData.data ? metaData.data.length : 0,
          }),
        };

      } catch (metaApiError) {
        console.error('Error calling Meta Graph API:', metaApiError);
        
        return {
          statusCode: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Meta Graph API Request Failed',
            message: 'Failed to fetch data from Meta Graph API',
            details: metaApiError.message,
          }),
        };
      }
    }

    // Default response for other requests (existing functionality)
    const responseData = {
      message: 'Hello from Netlify Functions!',
      method: method,
      timestamp: new Date().toISOString(),
      queryParams: queryParams,
      ...(method === 'POST' && { receivedData: body }),
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
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
