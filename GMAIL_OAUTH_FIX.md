# ✅ Gmail OAuth Fix - Complete Setup Guide

## What Was Fixed

1. ✅ Updated redirect URI to: `http://localhost:3000/api/gmail/oauth2callback`
2. ✅ Created new callback route at `/api/gmail/oauth2callback/route.js`
3. ✅ Added comprehensive error logging throughout OAuth flow
4. ✅ Updated all files to use `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (with fallback to `GMAIL_*`)
5. ✅ Enhanced error messages with specific troubleshooting steps

---

## Step-by-Step Setup

### STEP 1: Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### STEP 2: Create OAuth Client ID
1. Navigate: **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth Client ID**
3. If prompted, configure OAuth consent screen first (see below)
4. Choose:
   - **Application Type**: Web Application
   - **Name**: AI COO Gmail OAuth

### STEP 3: Configure OAuth Consent Screen (if not done)
1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (or Internal for Google Workspace)
3. App name: **AI COO**
4. User support email: Your email
5. Developer contact: Your email
6. Click **Save and Continue**
7. **Scopes**: Add these:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click **Save and Continue**
9. **Test users**: Add your email (e.g., `anuragthippani998@gmail.com`)
10. Click **Save and Continue**

### STEP 4: Add Authorized Redirect URIs
In the OAuth Client ID settings, under **"Authorized redirect URIs"**, add:
```
http://localhost:3000/api/gmail/oauth2callback
```

**⚠️ IMPORTANT**: 
- Must be EXACTLY this (no trailing slash)
- Must start with `http://` (not `https://`) for localhost
- Case-sensitive

### STEP 5: Add Authorized JavaScript Origins
Under **"Authorized JavaScript origins"**, add:
```
http://localhost:3000
```

### STEP 6: Copy Credentials
After creating the client, Google will show:
- **Client ID** (ends with `.apps.googleusercontent.com`)
- **Client Secret**

### STEP 7: Add to .env File
Add these to your `.env` file in the project root:

```bash
# Gmail/Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/oauth2callback

# App URL
NEXTAUTH_URL=http://localhost:3000
```

**Important**: 
- Use `GOOGLE_CLIENT_ID` (not `GMAIL_CLIENT_ID`) - the code supports both but prefers `GOOGLE_*`
- No quotes around values
- No spaces before/after `=`
- Client ID should end with `.apps.googleusercontent.com`

### STEP 8: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### STEP 9: Test Connection
1. Go to Settings → Integrations
2. Click "Connect" on Gmail
3. You should be redirected to Google sign-in
4. Authorize the app
5. You'll be redirected back to Settings with success message

---

## What Changed in the Code

### New Files Created:
- `/app/api/gmail/oauth2callback/route.js` - New callback endpoint with full error logging

### Files Updated:
- `/lib/gmail.js` - Updated redirect URI and added error logging
- `/app/api/auth/gmail/connect/route.js` - Enhanced error messages and logging
- `/app/api/auth/gmail/test/route.js` - Updated redirect URI check

### Key Changes:
1. **Redirect URI**: Changed from `/api/auth/gmail/callback` to `/api/gmail/oauth2callback`
2. **Environment Variables**: Prefer `GOOGLE_CLIENT_ID` over `GMAIL_CLIENT_ID`
3. **Error Logging**: Added comprehensive console logging at every step
4. **Error Messages**: More specific error messages with troubleshooting steps

---

## Troubleshooting

### Error: "invalid_client"
**Solution**:
1. Verify Client ID and Secret are correct in `.env`
2. Make sure there are no extra spaces or quotes
3. Check that the OAuth client exists in Google Cloud Console
4. Restart dev server after changing `.env`

### Error: "redirect_uri_mismatch"
**Solution**:
1. Check redirect URI in Google Console **exactly matches**: `http://localhost:3000/api/gmail/oauth2callback`
2. Check for:
   - Missing `http://`
   - Extra slashes
   - Wrong port number (must be 3000)
   - Case sensitivity
3. Make sure you added it under "Authorized redirect URIs" (not JavaScript origins)

### Error: "access_denied"
**Solution**:
1. Make sure you clicked "Allow" on the consent screen
2. Add your email as a test user in OAuth consent screen
3. Check OAuth consent screen is properly configured

### Error: "Token exchange failed"
**Solution**:
1. Check server logs for detailed error
2. Verify the authorization code was received
3. Make sure redirect URI matches exactly

---

## Verification Checklist

Before testing, verify:

- [ ] OAuth Client ID created in Google Cloud Console
- [ ] Redirect URI added: `http://localhost:3000/api/gmail/oauth2callback`
- [ ] JavaScript Origin added: `http://localhost:3000`
- [ ] OAuth consent screen configured
- [ ] Test user added (your email)
- [ ] Gmail API enabled
- [ ] Calendar API enabled (optional)
- [ ] `GOOGLE_CLIENT_ID` in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` in `.env`
- [ ] `GMAIL_REDIRECT_URI` in `.env`
- [ ] Dev server restarted
- [ ] No syntax errors in `.env` file

---

## Debugging

The code now includes comprehensive logging. Check your terminal/console for:

- `[Gmail OAuth]` - OAuth flow logs
- `[Gmail Connect]` - Connection attempt logs
- Error details with stack traces

If you see errors, the logs will tell you exactly what's wrong!

---

## Success!

Once connected, you should see:
- ✅ "Gmail connected successfully!" message
- ✅ Green checkmark in Settings → Integrations
- ✅ Gmail integration shows as "Connected"

The integration is now ready to use for email automation!










