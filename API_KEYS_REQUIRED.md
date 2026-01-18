# 🔑 API Keys Required for AI COO

## Required vs Optional API Keys

### ✅ **REQUIRED** (Core Functionality)

These are **essential** for the app to work:

#### 1. **Database** (REQUIRED)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/ai_coo"
```
- **What it's for**: PostgreSQL database connection
- **How to get**: Set up PostgreSQL locally or use a cloud service (Supabase, Neon, etc.)
- **Status**: ✅ Already configured (you have this)

#### 2. **JWT Secret** (REQUIRED)
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```
- **What it's for**: User authentication token signing
- **How to get**: Generate any random string (at least 32 characters)
- **Status**: ✅ Already configured (you have this)

---

### ⚠️ **HIGHLY RECOMMENDED** (Core AI Features)

These are needed for the main AI features to work:

#### 3. **OpenAI API Key** (HIGHLY RECOMMENDED)
```bash
OPENAI_API_KEY="sk-..."
```
- **What it's for**: 
  - AI task extraction from emails
  - Email reply generation
  - Follow-up message generation
  - Proposal generation
  - Business insights
  - All AI agent features
- **How to get**: 
  1. Go to https://platform.openai.com/api-keys
  2. Sign up/Login
  3. Create a new API key
  4. Copy and add to `.env`
- **Cost**: Pay-as-you-go (starts at ~$0.002 per 1K tokens)
- **Status**: ❌ You need to add this

#### 4. **Pinecone API Key** (HIGHLY RECOMMENDED)
```bash
PINECONE_API_KEY="..."
PINECONE_INDEX_NAME="ai-coo-memory"
```
- **What it's for**: 
  - Memory system (stores user preferences, writing style, past tasks)
  - Vector search for context
  - Learning user patterns
- **How to get**: 
  1. Go to https://www.pinecone.io/
  2. Sign up (free tier available)
  3. Create an index (name it `ai-coo-memory`)
  4. Get API key from dashboard
  5. Add to `.env`
- **Cost**: Free tier available (100K vectors)
- **Status**: ❌ You need to add this

---

### 🔧 **OPTIONAL** (Feature-Specific)

These enable specific features but the app works without them:

#### 5. **Google OAuth** (OPTIONAL - For Gmail & Calendar)
```bash
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GMAIL_REDIRECT_URI="http://localhost:3000/api/gmail/oauth2callback"
```
- **What it's for**: 
  - Gmail integration (read/send emails)
  - Google Calendar sync
  - Email automation
- **How to get**: 
  1. Go to https://console.cloud.google.com/
  2. Create project
  3. Enable Gmail API & Calendar API
  4. Create OAuth 2.0 credentials
  5. Add redirect URI
- **Cost**: Free
- **Status**: ⚠️ You're setting this up now

#### 6. **Stripe** (OPTIONAL - For Billing)
```bash
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_AI_COO_PRICE_ID="price_..."
```
- **What it's for**: 
  - Subscription billing
  - Payment processing
  - Plan upgrades
- **How to get**: 
  1. Go to https://dashboard.stripe.com/
  2. Get API keys from Developers > API keys
  3. Create products/prices for Pro and AI COO plans
  4. Set up webhook endpoint
- **Cost**: Free to set up, 2.9% + $0.30 per transaction
- **Status**: ❌ Optional (only if you want billing)

#### 7. **WhatsApp Business API** (OPTIONAL - For Follow-ups)
```bash
WHATSAPP_ACCESS_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
```
- **What it's for**: 
  - Automated WhatsApp follow-ups
  - Multi-channel messaging
- **How to get**: 
  1. Set up WhatsApp Business API via Meta
  2. Get access token and phone number ID
- **Cost**: Varies (Meta pricing)
- **Status**: ❌ Optional (only if you want WhatsApp)

#### 8. **Twilio** (OPTIONAL - For SMS)
```bash
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
```
- **What it's for**: 
  - SMS notifications
  - SMS follow-ups
- **How to get**: 
  1. Go to https://www.twilio.com/
  2. Sign up
  3. Get Account SID and Auth Token
  4. Get a phone number
- **Cost**: Pay-as-you-go (~$0.0075 per SMS)
- **Status**: ❌ Optional (only if you want SMS)

---

## 📋 Quick Setup Checklist

### Minimum to Run (Basic App):
- [x] `DATABASE_URL` ✅ (You have this)
- [x] `JWT_SECRET` ✅ (You have this)

### To Use AI Features:
- [ ] `OPENAI_API_KEY` ❌ (Get from https://platform.openai.com/api-keys)
- [ ] `PINECONE_API_KEY` ❌ (Get from https://www.pinecone.io/)
- [ ] `PINECONE_INDEX_NAME` ❌ (Create index named `ai-coo-memory`)

### To Use Email/Calendar:
- [ ] `GOOGLE_CLIENT_ID` ⚠️ (Setting up now)
- [ ] `GOOGLE_CLIENT_SECRET` ⚠️ (Setting up now)
- [ ] `GMAIL_REDIRECT_URI` ⚠️ (Set to: `http://localhost:3000/api/gmail/oauth2callback`)

### Optional Features:
- [ ] `STRIPE_SECRET_KEY` (Only if you want billing)
- [ ] `WHATSAPP_ACCESS_TOKEN` (Only if you want WhatsApp)
- [ ] `TWILIO_ACCOUNT_SID` (Only if you want SMS)

---

## 🚀 Getting Started Priority

### Priority 1: Get the App Running
1. ✅ Database - Already done
2. ✅ JWT Secret - Already done
3. ❌ **OpenAI API Key** - Get this next (enables all AI features)

### Priority 2: Enable Core AI Features
4. ❌ **Pinecone API Key** - Get this to enable memory system

### Priority 3: Enable Integrations
5. ⚠️ **Google OAuth** - You're setting this up now

### Priority 4: Optional Features
6. Stripe (if you want billing)
7. WhatsApp (if you want WhatsApp follow-ups)
8. Twilio (if you want SMS)

---

## 💰 Cost Estimate

### Free Tier Available:
- ✅ Database (PostgreSQL) - Free on Supabase/Neon
- ✅ Pinecone - Free tier (100K vectors)
- ✅ Google OAuth - Free
- ✅ Stripe - Free to set up (only pay per transaction)

### Paid Services:
- ⚠️ OpenAI - Pay-as-you-go (~$0.002 per 1K tokens)
  - Typical usage: $5-20/month for moderate use
- ⚠️ Twilio - Pay-as-you-go (~$0.0075 per SMS)
  - Typical usage: $5-10/month for moderate use
- ⚠️ WhatsApp Business API - Varies by Meta pricing

---

## 📝 Your Current Status

Based on your setup:

✅ **Already Configured:**
- Database (PostgreSQL)
- JWT Secret

⚠️ **In Progress:**
- Google OAuth (Gmail/Calendar)

❌ **Still Needed for Full Functionality:**
- OpenAI API Key (for AI features)
- Pinecone API Key (for memory system)

❌ **Optional (Not Required):**
- Stripe (billing)
- WhatsApp (follow-ups)
- Twilio (SMS)

---

## 🎯 Next Steps

1. **Complete Google OAuth setup** (you're doing this now)
2. **Get OpenAI API Key** - This is the most important one for AI features
3. **Get Pinecone API Key** - For memory system
4. **Test the app** - See what works and what doesn't
5. **Add optional features** as needed

---

## ❓ FAQ

**Q: Can I run the app without OpenAI?**
A: Yes, but AI features won't work (no task extraction, no reply generation, etc.)

**Q: Can I run the app without Pinecone?**
A: Yes, but memory system won't work (no learning user preferences, etc.)

**Q: Do I need all API keys?**
A: No! Only Database and JWT are required. Others are for specific features.

**Q: What's the minimum to test?**
A: Database + JWT + OpenAI (to test AI features)

**Q: How much will it cost?**
A: ~$5-20/month for OpenAI (moderate use), everything else can be free tier.

---

## 🔗 Quick Links

- OpenAI: https://platform.openai.com/api-keys
- Pinecone: https://www.pinecone.io/
- Google Cloud: https://console.cloud.google.com/
- Stripe: https://dashboard.stripe.com/
- Twilio: https://www.twilio.com/











