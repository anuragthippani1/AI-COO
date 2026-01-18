# 🔍 Gmail OAuth Troubleshooting Guide

## "Access blocked: Authorization Error" - Step-by-Step Fix

If you're still getting this error after following the setup guide, follow these steps **exactly**:

---

## ✅ Step 1: Verify OAuth Credentials in .env

Open your `.env` file and make sure you have:

```bash
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
NEXTAUTH_URL=http://localhost:3000
```

**Important**: 
- No quotes around values
- No spaces before/after `=`
- Client ID should end with `.apps.googleusercontent.com`
- Restart dev server after changing `.env`

---

## ✅ Step 2: Verify Google Cloud Console Setup

### 2.1 Check OAuth Consent Screen

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to: **APIs & Services** → **OAuth consent screen**

**Verify these settings:**

- **User Type**: External (or Internal if using Google Workspace)
- **App name**: AI COO
- **User support email**: Your email
- **Developer contact**: Your email
- **App domain**: Leave blank (or add your domain)
- **Authorized domains**: Leave blank for localhost

### 2.2 Add Scopes

1. In OAuth consent screen, click **"ADD OR REMOVE SCOPES"**
2. Make sure these scopes are added:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
3. Click **UPDATE** → **SAVE AND CONTINUE**

### 2.3 Add Test Users (CRITICAL!)

1. In OAuth consent screen, scroll to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add your email: `anuragthippani998@gmail.com`
4. Click **ADD**
5. Click **SAVE AND CONTINUE**

**⚠️ IMPORTANT**: If your app is in "Testing" mode, you MUST add your email here, otherwise Google will block access!

---

## ✅ Step 3: Verify OAuth Client Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify these settings:

**Application type**: Web application

**Authorized redirect URIs** (must include):
```
http://localhost:3000/api/auth/gmail/callback
```

**Important**: 
- No trailing slash
- Exact match (case-sensitive)
- Must start with `http://` (not `https://`) for localhost

4. Click **SAVE** if you made changes

---

## ✅ Step 4: Enable APIs

1. Go to: **APIs & Services** → **Library**
2. Search and enable:
   - **Gmail API** (must be enabled)
   - **Google Calendar API** (optional but recommended)

---

## ✅ Step 5: Test OAuth Configuration

1. Go to Settings → Integrations in your app
2. Click **"Test OAuth Config"** button (if available)
3. Check the console for any errors
4. Verify that:
   - `hasClientId: true`
   - `hasClientSecret: true`
   - `redirectUri` matches exactly

---

## ✅ Step 6: Clear Browser Cache & Try Again

1. Clear browser cache and cookies for `localhost:3000`
2. Or use an incognito/private window
3. Try connecting again

---

## 🔍 Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"

**Solution**: 
- Check that redirect URI in Google Console **exactly matches** the one in your `.env`
- No trailing slashes
- Must be `http://localhost:3000/api/auth/gmail/callback` (not `https://`)

### Issue 2: "invalid_client"

**Solution**:
- Verify Client ID and Secret are correct in `.env`
- Make sure there are no extra spaces or quotes
- Restart dev server after changing `.env`

### Issue 3: "access_denied" (even after clicking Allow)

**Solution**:
- Your email MUST be added as a test user in OAuth consent screen
- App must be in "Testing" mode (or published)
- Try using a different browser or incognito mode

### Issue 4: "OAuth client was not found"

**Solution**:
- Client ID is incorrect or doesn't exist
- Check that you copied the full Client ID from Google Console
- Make sure you're using the correct project in Google Console

---

## 🧪 Debug Checklist

Before asking for help, verify:

- [ ] `.env` file has `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET`
- [ ] Client ID ends with `.apps.googleusercontent.com`
- [ ] Redirect URI in Google Console matches `.env` exactly
- [ ] Your email is added as a test user in OAuth consent screen
- [ ] Gmail API is enabled in Google Cloud Console
- [ ] OAuth consent screen has all required scopes
- [ ] Dev server was restarted after changing `.env`
- [ ] Browser cache cleared or using incognito mode

---

## 📞 Still Not Working?

If you've followed all steps and still get errors:

1. **Check browser console** (F12) for JavaScript errors
2. **Check terminal/console** for server errors
3. **Verify the OAuth URL** - it should look like:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...
   ```
4. **Try the test endpoint**: Visit `/api/auth/gmail/test` (with auth token) to see configuration

---

## 🚀 Quick Fix Script

If you want to verify everything is set up correctly, you can check:

```bash
# In your project directory
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const hasClientId = env.includes('GMAIL_CLIENT_ID=') && !env.includes('GMAIL_CLIENT_ID=your-');
const hasClientSecret = env.includes('GMAIL_CLIENT_SECRET=') && !env.includes('GMAIL_CLIENT_SECRET=your-');
console.log('Client ID configured:', hasClientId);
console.log('Client Secret configured:', hasClientSecret);
"
```

This will tell you if your `.env` file has placeholder values.

---

## ✅ Final Verification

After completing all steps:

1. Restart your dev server: `npm run dev`
2. Go to Settings → Integrations
3. Click "Connect" on Gmail
4. You should see Google's consent screen
5. Click "Allow"
6. You should be redirected back to Settings with "Gmail connected successfully!"

If you still see errors, check the error message in the Settings page - it will tell you exactly what's wrong.











