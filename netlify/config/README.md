# API Configuration

This directory contains configuration files for API tokens and keys.

## Setup Instructions

1. **Copy the template**: Copy `api-tokens.js` and replace `YOUR_META_ACCESS_TOKEN_HERE` with your actual Meta Graph API access token.

2. **Get Meta Graph API Token**:
   - Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Select your app
   - Generate an access token with required permissions:
     - `ads_read` - To read ad account data
     - `ads_management` - If you need to manage ads (optional)
   - Copy the generated token

3. **Update the config file**:
   ```javascript
   META_GRAPH_API_ACCESS_TOKEN: 'EAABwzLixnjYBO...' // Your actual token here
   ```

4. **Security Note**: 
   - This file is automatically added to `.gitignore`
   - NEVER commit this file to version control
   - Use environment variables in production

## Token Hierarchy

The function will use tokens in this order:
1. Environment variables (production)
2. Local config file (development/testing)

## Example Token Format

Meta Graph API tokens typically look like:
```
EAABwzLixnjYBO1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

They are long strings starting with "EAA" followed by alphanumeric characters.