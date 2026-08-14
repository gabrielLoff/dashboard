# Generating a Google Calendar Refresh Token

This guide walks through creating OAuth 2.0 credentials in Google Cloud Console and obtaining a refresh token for the dashboard's Google Calendar integration.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Name it (e.g., "Dashboard Calendar") and click **Create**
4. Select the new project from the dropdown

## Step 2: Enable the Google Calendar API

1. In the sidebar, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click on it → click **Enable**

## Step 3: Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → click **Create**
3. Fill in:
   - **App name**: anything (e.g., "Dashboard")
   - **User support email**: your email
   - **Developer contact**: your email
4. Click **Save and Continue**
5. On **Scopes** page → click **Add or Remove Scopes** → search for `Google Calendar API` → select `.../auth/calendar.readonly` → click **Update** → **Save and Continue**
6. On **Test users** page → click **Add Users** → add your Google email → **Save and Continue**
7. Click **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: anything (e.g., "Dashboard")
5. **Authorized redirect URIs** → click **Add URI** → add:
   ```
   http://localhost
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 5: Get the Refresh Token

You need to complete the OAuth flow once to get a refresh token. Run this script (replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET`):

```bash
# 1. Build the authorization URL
CLIENT_ID="YOUR_CLIENT_ID"
REDIRECT_URI="http://localhost"
SCOPE="https://www.googleapis.com/auth/calendar.readonly"

echo "Open this URL in your browser:"
echo "https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent"
```

1. Open the printed URL in your browser
2. Sign in with your Google account
3. Grant calendar access
4. You'll be redirected to `http://localhost?code=...` — the page won't load, that's expected
5. Copy the `code` value from the URL bar

Now exchange the code for tokens:

```bash
# 2. Exchange the authorization code for tokens
CODE="YOUR_AUTHORIZATION_CODE"
CLIENT_ID="YOUR_CLIENT_ID"
CLIENT_SECRET="YOUR_CLIENT_SECRET"
REDIRECT_URI="http://localhost"

curl -s -X POST https://oauth2.googleapis.com/token \
  -d "code=${CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code"
```

The response will contain:
- `access_token` — short-lived (1 hour), used for API calls
- `refresh_token` — **this is what you need**, it never expires
- `expires_in` — token lifetime in seconds

Copy the `refresh_token` value.

## Step 6: Configure the Dashboard

1. Copy `packages/server/.env.example` to `packages/server/.env`
2. Fill in the values:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token_here
   MOCK=false
   ```
3. Restart the server

## Step 7: Verify

1. Start the server: `pnpm -F server dev`
2. Check the health endpoint: `curl http://localhost:3001/api/health`
3. The response should show `"calendar": "connected"` (not `"missing-refresh-token"`)
4. Open the dashboard — the Agenda widget should show your upcoming events

## Troubleshooting

### "Token has been expired or revoked"

The refresh token is no longer valid. Repeat **Step 5** to get a new one. This happens if:
- You clicked "Reset" in the OAuth consent screen
- Google revoked the token for security reasons
- You used the wrong Google account

### "Missing Google OAuth credentials"

At least one of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_CALENDAR_REFRESH_TOKEN` is missing from `.env`.

### "Google Calendar not configured: missing refresh token"

The `GOOGLE_CALENDAR_REFRESH_TOKEN` environment variable is empty or not set.

### Calendar shows "missing-refresh-token" in health check

Same as above — the refresh token is not configured. Follow Step 5 and Step 6.
