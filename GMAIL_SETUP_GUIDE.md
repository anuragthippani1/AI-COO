# 🔧 Gmail OAuth Setup Guide

## Common Errors

### Error 1: "OAuth client was not found" / "Error 401: invalid_client"

This error means your Gmail OAuth credentials are not configured correctly. Follow these steps:

### Error 2: "Access blocked: Authorization Error"

**This is the most common error!** It means:
- Your OAuth consent screen is not properly configured, OR
- Your email is not added as a test user (if app is in testing mode)

**Quick Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Make sure you've completed all steps:
   - App name: **AI COO**
   - User support email: Your email
   - Developer contact: Your email
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
   - **Test users**: **CRITICAL** - Add your email (`anuragthippani998@gmail.com`) here!
4. Click **Save and Continue** through all steps
5. Try connecting again

**Important**: If your app is in "Testing" mode, you MUST add your email as a test user, otherwise you'll get "Access blocked" error.

---

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "AI COO" (or any name)
4. Click "Create"

---

## Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and click **Enable**
4. Also enable **Google Calendar API** (for calendar features)

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen first:
   - User Type: **External** (for personal use) or **Internal** (for Google Workspace)
   - App name: **AI COO**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Add or Remove Scopes**
     - Select: `.../auth/gmail.readonly`
     - Select: `.../auth/gmail.send`
     - Select: `.../auth/gmail.modify`
     - Select: `.../auth/calendar.readonly`
     - Select: `.../auth/calendar.events`
   - Click **Save and Continue**
   - Test users: Add your email
   - Click **Save and Continue**

4. Back to Credentials:
   - Application type: **Web application**
   - Name: **AI COO Web Client**
   - **Authorized redirect URIs**: Add these:
     ```
     http://localhost:3000/api/auth/gmail/callback
     https://yourdomain.com/api/auth/gmail/callback
     ```
   - Click **Create**

5. **Copy the Client ID and Client Secret** (you'll need these!)

---

## Step 4: Add to .env File

Add these to your `.env` file in the project root:

```bash
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Or use GOOGLE_ prefix (both work)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# App URL
NEXTAUTH_URL=http://localhost:3000
```

**Important**: 
- Replace `your_client_id_here` with your actual Client ID
- Replace `your_client_secret_here` with your actual Client Secret
- For production, update `NEXTAUTH_URL` to your domain

---

## Step 5: Restart Dev Server

After adding credentials:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## Step 6: Test Connection

1. Go to Settings → Integrations
2. Click "Connect" on Gmail
3. You should be redirected to Google sign-in
4. Authorize the app
5. You'll be redirected back to Settings

---

## Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Console **exactly matches** the one in your `.env`:
- Check for `http` vs `https`
- Check for trailing slashes
- Check port numbers (3000)

### Issue 2: "invalid_client"
**Solution**: 
- Verify Client ID and Secret are correct
- Make sure there are no extra spaces in `.env`
- Restart the dev server after changing `.env`

### Issue 3: "access_denied"
**Solution**: 
- Make sure you added your email as a test user (if app is in testing mode)
- Check OAuth consent screen is configured

### Issue 4: Credentials not loading
**Solution**:
- Make sure `.env` is in the project root (not in a subfolder)
- Restart the dev server
- Check `.env` file syntax (no quotes needed around values)

---

## Production Setup

For production:

1. Update OAuth consent screen to **Production** (after verification)
2. Add production redirect URI:
   ```
   https://yourdomain.com/api/auth/gmail/callback
   ```
3. Update `.env`:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   GMAIL_REDIRECT_URI=https://yourdomain.com/api/auth/gmail/callback
   ```

---

## Quick Checklist

- [ ] Google Cloud Project created
- [ ] Gmail API enabled
- [ ] Calendar API enabled (optional)
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI added in Google Console
- [ ] Client ID and Secret added to `.env`
- [ ] Dev server restarted
- [ ] Test connection in Settings

---

## Need Help?

If you're still having issues:

1. Check the browser console for errors
2. Check the terminal/console for server errors
3. Verify `.env` file has correct values
4. Make sure redirect URI matches exactly
5. Try creating new OAuth credentials

The error should be resolved once you add the correct Client ID and Secret to your `.env` file!

