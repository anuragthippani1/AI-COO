# AI COO - Your AI Chief Operating Officer

A full-stack SaaS application that automates business operations using AI agents, memory systems, and intelligent workflows.

## Tech Stack

- **Frontend**: Next.js 14 (JavaScript), Tailwind CSS
- **Backend**: Node.js (Serverless API routes)
- **Database**: Prisma + PostgreSQL
- **Vector Database**: Pinecone
- **Authentication**: JWT
- **Payments**: Stripe
- **AI**: OpenAI API (GPT-4, Embeddings)
- **Integrations**: Gmail API, Calendar API, WhatsApp Cloud API

## Features

### 🤖 AI Agent Manager
- Memory system with vector search (Pinecone)
- Task extraction from emails
- Email reply generation
- Follow-up scheduling
- Workflow automation

### 📧 Email Automation
- Gmail webhook integration
- Automatic task extraction
- AI-generated reply suggestions
- Email classification and processing

### 💬 Follow-up Automation
- WhatsApp Cloud API integration
- Scheduled follow-ups
- Personalized message generation
- Conversation history tracking

### 📄 Invoice Generator
- PDF invoice generation
- Client management
- Revenue tracking

### 📊 Dashboard
- Real-time statistics
- Task management
- Email overview
- Follow-up tracking
- Revenue analytics

### 💳 Subscription Billing
- Stripe integration
- Three tiers: Free, Pro, AI COO
- Webhook handling
- Paywall implementation

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Fill in all required environment variables
```

3. **Set up database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server**
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Environment Variables

See `.env.example` for all required environment variables including:
- Database URL
- OpenAI API key
- Pinecone credentials
- Stripe keys
- Gmail API credentials
- WhatsApp API credentials
- JWT secret

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── email/        # Email webhook
│   │   ├── agent/        # AI agent endpoints
│   │   ├── invoice/      # Invoice generation
│   │   ├── followup/     # Follow-up management
│   │   ├── stripe/       # Stripe webhooks
│   │   └── dashboard/    # Dashboard stats
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── dashboard/        # Dashboard page
│   └── pricing/          # Pricing page
├── ai/                    # AI agent modules
│   ├── agent_manager.js  # Main agent orchestrator
│   ├── task_extractor.js # Task extraction from emails
│   ├── reply_generator.js # Email reply generation
│   └── followup_scheduler.js # Follow-up scheduling
├── lib/                   # Utility libraries
│   ├── prisma.js         # Prisma client
│   ├── openai.js         # OpenAI client
│   ├── pinecone.js       # Pinecone client
│   ├── memory.js         # Memory system
│   ├── auth.js           # JWT authentication
│   ├── whatsapp.js       # WhatsApp API
│   └── invoice.js         # PDF generation
├── components/            # React components
│   └── Dashboard.jsx     # Dashboard component
├── scripts/               # Cron jobs
│   └── cron.js           # Daily reports & follow-ups
└── prisma/
    └── schema.prisma      # Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Email
- `POST /api/email/webhook` - Gmail webhook handler

### AI Agent
- `POST /api/agent/run` - Run AI agent with input

### Invoices
- `POST /api/invoice/create` - Create invoice

### Follow-ups
- `POST /api/followup/send` - Send scheduled follow-up

### Stripe
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Cron Jobs

Run daily cron jobs:
```bash
npm run cron
```

This processes:
- Scheduled follow-ups
- Daily AI COO reports

## Ports

- Frontend: `3000`
- Backend API: `3000` (Next.js API routes)

## License

MIT



