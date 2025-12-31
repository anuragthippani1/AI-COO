# AI COO - Project Overview

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Production-Ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Authentication & User Flow](#4-authentication--user-flow)
5. [Dashboard & UI Pages](#5-dashboard--ui-pages)
6. [AI Agents](#6-ai-agents)
7. [Memory System](#7-memory-system)
8. [Integrations](#8-integrations)
9. [Database Schema](#9-database-schema)
10. [Automation & Workflows](#10-automation--workflows)
11. [Environment Variables](#11-environment-variables)
12. [Setup Instructions](#12-setup-instructions)
13. [Current Limitations](#13-current-limitations)
14. [Future Improvements](#14-future-improvements)

---

## 1. Project Overview

### What is AI COO?

AI COO (AI Chief Operating Officer) is a comprehensive SaaS platform that acts as an intelligent operations assistant for businesses. It automates routine business tasks, manages communications, handles follow-ups, generates proposals and invoices, and provides AI-powered insights to help businesses operate more efficiently.

### What Problem It Solves

- **Email Overload:** Automatically processes emails, extracts tasks, and generates contextual replies
- **Task Management:** Intelligently extracts and prioritizes tasks from various sources
- **Follow-up Automation:** Schedules and sends follow-ups via email, WhatsApp, or SMS
- **Document Generation:** Creates professional proposals and invoices automatically
- **Business Intelligence:** Provides insights and recommendations based on business data
- **Workflow Automation:** Allows users to create custom automation workflows
- **Memory & Context:** Maintains long-term memory of user preferences, style, and business context

### Who It Is For

- **Small to Medium Businesses:** Need operational automation without hiring a full-time COO
- **Solo Entrepreneurs:** Want to scale operations without proportional overhead
- **Service Providers:** Require automated follow-ups, proposals, and invoicing
- **Busy Professionals:** Need intelligent task extraction and prioritization from communications

---

## 2. High-Level Architecture

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  Next.js 14 (React) + Tailwind CSS + Lucide Icons       │
│  - Dashboard, Pages, Components                          │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)        │
│  - Authentication, Agents, Workflows, Integrations     │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    AI/Agents Layer                       │
│  - Agent Manager, Orchestrator, Specialized Agents       │
│  - Confidence Engine, Safety Guard, Model Router        │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Memory Layer                          │
│  - Short-term (PostgreSQL), Long-term (Pinecone)        │
│  - User Style Learning, Enhanced Memory                  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  - PostgreSQL (Prisma ORM)                              │
│  - Pinecone (Vector Database)                           │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    External Services                     │
│  - OpenAI (LLM), Gmail API, Calendar API               │
│  - WhatsApp Cloud API, Stripe, Sentry, PostHog         │
└─────────────────────────────────────────────────────────┘
```

### Component Breakdown

**Frontend:**
- Next.js 14 App Router
- React 18 with Client Components
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization

**Backend:**
- Next.js API Routes (serverless functions)
- Prisma ORM for database access
- JWT-based authentication
- Middleware for request tracking

**AI/Agents:**
- Modular agent system
- Specialized agents for different tasks
- Confidence scoring and risk assessment
- Human approval workflows
- Simulation/dry-run mode

**Memory:**
- PostgreSQL for structured data
- Pinecone for vector embeddings
- Multi-layer memory system (short-term, long-term, deep)

**Integrations:**
- Gmail OAuth2 integration
- Google Calendar API
- WhatsApp Cloud API
- Stripe for payments
- Sentry for error tracking
- PostHog for analytics

---

## 3. Tech Stack

### Frontend Technologies

- **Next.js 14.0.4** - React framework with App Router
- **React 18.2.0** - UI library
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Lucide React 0.303.0** - Icon library
- **Recharts 2.10.3** - Chart library
- **React Hook Form 7.49.2** - Form management
- **Zod 3.22.4** - Schema validation
- **date-fns 3.0.6** - Date utilities
- **clsx & tailwind-merge** - Conditional styling

### Backend Technologies

- **Next.js API Routes** - Serverless API endpoints
- **Prisma 5.7.1** - Database ORM
- **PostgreSQL** - Primary database
- **bcryptjs 2.4.3** - Password hashing
- **jsonwebtoken 9.0.2** - JWT authentication
- **axios 1.6.2** - HTTP client

### AI/LLM Providers

- **OpenAI 4.20.1** - Primary LLM provider
  - GPT-4 Turbo (default)
  - GPT-3.5 Turbo (fallback via model router)
  - text-embedding-3-small (embeddings)
- **Model Router** - Intelligent model selection based on confidence/risk

### Databases

- **PostgreSQL** - Structured data storage
- **Pinecone** - Vector database for embeddings
  - Index: `ai-coo-memory` (configurable)

### Third-Party APIs

- **Google APIs (googleapis 128.0.0)**
  - Gmail API (read, send, modify)
  - Calendar API (read, create events)
- **WhatsApp Cloud API** - Messaging via Facebook Graph API
- **Stripe 14.7.0** - Payment processing
- **Sentry (@sentry/nextjs 10.32.1)** - Error tracking
- **PostHog (posthog-js 1.310.1)** - Product analytics

### Development Tools

- **ESLint** - Code linting
- **PostCSS & Autoprefixer** - CSS processing
- **Docker** - Containerization
- **Vercel** - Deployment platform

---

## 4. Authentication & User Flow

### Signup/Login

**Registration Flow:**
1. User provides email, name, and password
2. Password is hashed using bcryptjs
3. User account created in PostgreSQL
4. Default FREE subscription tier assigned
5. JWT token generated and returned
6. Token stored in localStorage (client-side)

**Login Flow:**
1. User provides email and password
2. Password verified against hash
3. JWT token generated and returned
4. Token stored in localStorage
5. Protected routes check token validity

**API Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Google OAuth (Gmail + Calendar)

**OAuth Flow:**
1. User clicks "Connect Gmail" in settings
2. Redirected to Google OAuth consent screen
3. User grants permissions:
   - Gmail: read, send, modify
   - Calendar: read, create events
4. OAuth callback receives authorization code
5. Access token and refresh token stored in `Account` table
6. Tokens used for subsequent API calls

**API Endpoints:**
- `GET /api/auth/gmail/connect` - Initiate OAuth flow
- `GET /api/auth/gmail/callback` - OAuth callback handler
- `GET /api/gmail/oauth2callback` - Alternative callback route
- `GET /api/auth/calendar/callback` - Calendar OAuth callback

**Token Management:**
- Refresh tokens stored securely in database
- Automatic token refresh when expired
- Tokens scoped per user

### Dashboard Flow

1. **Onboarding Check:**
   - First-time users see onboarding stepper
   - Guides through key features
   - Can be skipped or completed

2. **Dashboard Access:**
   - Protected route (requires authentication)
   - Displays real-time stats:
     - Total tasks (pending/completed)
     - Unread emails
     - Pending follow-ups
     - Revenue (from invoices)
   - Shows recent tasks and upcoming follow-ups
   - AI usage statistics
   - Quick action buttons

3. **Navigation:**
   - Sidebar navigation with active state indicators
   - All pages accessible via sidebar
   - Responsive design for mobile

---

## 5. Dashboard & UI Pages

### Dashboard (`/dashboard`)

**Purpose:** Central hub showing overview of business operations

**Features:**
- Real-time statistics cards (Tasks, Emails, Follow-ups, Revenue)
- AI usage metrics with progress bars
- Recent tasks list (last 5)
- Upcoming follow-ups list (last 5)
- Quick action buttons
- Refresh functionality
- Empty states with helpful CTAs

**Data Sources:**
- `/api/dashboard/stats` - Aggregated statistics
- `/api/usage/stats` - AI usage metrics

### Inbox (`/inbox`)

**Purpose:** Email management and processing

**Features:**
- List of emails from Gmail
- Email status (unread, read, replied, archived)
- Email classification (task, followup, inquiry, etc.)
- Reply generation
- Task extraction from emails
- Filter by status
- Refresh emails from Gmail

**API Endpoints:**
- `GET /api/emails/list` - Fetch emails
- `POST /api/emails/fetch` - Sync from Gmail
- `POST /api/emails/send` - Send email
- `PUT /api/emails/update` - Update email status

### Tasks (`/tasks`)

**Purpose:** Task management and tracking

**Features:**
- Create, read, update, delete tasks
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Status tracking (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- Due date management
- Filter by status and priority
- Source tracking (email, manual, ai_generated)

**API Endpoints:**
- `GET /api/tasks/list` - List tasks
- `POST /api/tasks/create` - Create task
- `PUT /api/tasks/update` - Update task
- `DELETE /api/tasks/delete` - Delete task

### CRM / Leads (`/crm`)

**Purpose:** Lead management and pipeline tracking

**Features:**
- Lead list view
- Kanban board view (stages)
- Lead details (name, email, phone)
- Follow-up scheduling
- Status tracking

**Data Model:**
- Stored in `FollowUp` table
- Status: pending, sent, replied, converted

### WhatsApp (`/whatsapp`)

**Purpose:** WhatsApp messaging interface

**Features:**
- Send WhatsApp messages
- Conversation history
- Chat interface
- Phone number formatting

**API Endpoints:**
- `POST /api/whatsapp/send` - Send message

**Integration:**
- WhatsApp Cloud API (Facebook Graph API)
- Requires `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`

### Proposals (`/proposals`)

**Purpose:** Proposal creation and management

**Features:**
- Create proposals
- AI-generated proposal content
- Send proposals via email
- Proposal status tracking

**API Endpoints:**
- `POST /api/proposal/create` - Create proposal

**AI Agent:**
- `ai/proposal_generator.js` - Generates proposal content

### Invoices (`/invoices`)

**Purpose:** Invoice creation and management

**Features:**
- Create invoices
- Invoice items (name, quantity, price)
- Tax calculation
- PDF generation (via pdfkit)
- Status tracking (draft, sent, paid, overdue)
- Download PDF

**API Endpoints:**
- `GET /api/invoices/list` - List invoices
- `POST /api/invoice/create` - Create invoice
- `PUT /api/invoices/update` - Update invoice

**Library:**
- `lib/invoice.js` - Invoice generation logic
- PDFKit for PDF creation

### Planner (`/planner`)

**Purpose:** AI-generated weekly schedule

**Features:**
- Weekly schedule view
- AI-generated schedule suggestions
- Task scheduling
- Calendar integration

**API Endpoints:**
- `GET /api/business/weekly-schedule` - Get weekly schedule

**AI Agent:**
- `ai/scheduling_agent.js` - Generates schedule

### Agents (`/agents`)

**Purpose:** AI agent management and monitoring

**Features:**
- List of available agents
- Agent status (active, idle, error)
- Agent capabilities
- Run agents manually
- Agent performance metrics

**API Endpoints:**
- `GET /api/agents/status` - Get agent statuses
- `POST /api/agent/run` - Run specific agent
- `POST /api/agent/autonomy` - Run autonomy loop
- `POST /api/agent/command` - Send command to agent

### Automations (`/automations`)

**Purpose:** Workflow automation creation and management

**Features:**
- Create workflows
- Define triggers (email_received, task_created, time_based)
- Define actions (create_task, send_email, etc.)
- Enable/disable workflows
- Test workflows
- Workflow templates

**API Endpoints:**
- `GET /api/workflows/list` - List workflows
- `POST /api/workflows/create` - Create workflow
- `PUT /api/workflows/update` - Update workflow
- `DELETE /api/workflows/delete` - Delete workflow
- `POST /api/workflows/execute` - Execute workflow
- `POST /api/workflows/test` - Test workflow

**Engine:**
- `lib/workflow_engine.js` - Workflow execution engine

### Reports (`/reports`)

**Purpose:** Business analytics and reporting

**Features:**
- Daily reports
- Revenue charts
- Task completion metrics
- Email statistics
- Business insights

**API Endpoints:**
- `GET /api/reports/daily` - Daily report data

**Visualization:**
- Recharts for charts and graphs

### Settings (`/settings`)

**Purpose:** User settings and configuration

**Features:**
- Profile management
- Integrations (Gmail, Calendar, WhatsApp)
- Billing and subscription
- Notification preferences
- AI Controls (simulation mode toggle)

**Tabs:**
1. **Profile** - Name, email, password
2. **Integrations** - Connect/disconnect services
3. **Billing** - Subscription management, Stripe checkout
4. **Notifications** - Notification preferences
5. **AI Controls** - Simulation mode, approval settings

**API Endpoints:**
- `PUT /api/settings/profile` - Update profile
- `GET /api/settings/integrations` - Get integrations
- `POST /api/settings/integrations/disconnect` - Disconnect integration
- `GET /api/settings/billing` - Get billing info
- `PUT /api/settings/notifications` - Update notifications

### Activity (`/activity`)

**Purpose:** Activity log and audit trail

**Features:**
- List of all AI actions
- Filter by action type, status, date
- Confidence scores and risk levels
- Explanations for each action
- Rollback functionality
- Approval/rejection history

**API Endpoints:**
- `GET /api/activity/logs` - Get activity logs
- `POST /api/activity/rollback` - Rollback action

**Data Model:**
- `ActivityLog` table stores all AI actions

---

## 6. AI Agents

### Agent Architecture

The AI agent system is modular and extensible. Each agent is a specialized function that handles a specific task.

**Core Components:**
- `ai/agent_manager.js` - Main agent orchestrator
- `ai/agent_orchestrator.js` - Pipeline orchestration
- `ai/autonomy_loop.js` - Autonomous operation loop
- `ai/autonomy_engine.js` - Autonomy decision engine

### Specialized Agents

#### 1. Email Classifier (`ai/email_classifier.js`)

**Purpose:** Classify incoming emails into categories

**Inputs:**
- Email content (subject, body)
- Email metadata

**Outputs:**
- Category: task, followup, inquiry, complaint, lead, general
- Urgency level: low, medium, high
- Reply needed: boolean

**Usage:**
- Automatically called when emails are fetched
- Used to route emails to appropriate handlers

#### 2. Task Extractor (`ai/task_extractor.js`)

**Purpose:** Extract actionable tasks from emails and text

**Inputs:**
- Email content or text
- User ID
- Metadata

**Outputs:**
- Array of tasks with:
  - title
  - description
  - priority (LOW, MEDIUM, HIGH, URGENT)
  - dueDate (if mentioned)
  - assignee (if mentioned)

**Features:**
- Confidence scoring
- Activity logging
- Automatic task creation in database

**API Integration:**
- Called automatically when processing emails
- Can be called manually via agent API

#### 3. Reply Generator (`ai/reply_generator.js`)

**Purpose:** Generate contextual email replies

**Inputs:**
- Email content
- User ID
- Metadata (thread context, etc.)

**Outputs:**
- Generated reply text
- Confidence score
- Explanation

**Features:**
- User style learning (matches user's writing style)
- Memory context integration
- Confidence evaluation
- Approval workflow (if confidence < threshold)
- Activity logging

**Style Matching:**
- Uses `ai/user_style_learner.js` to learn user's writing style
- Analyzes past emails to extract style patterns
- Generates replies that match user's tone and style

#### 4. Follow-up Scheduler (`ai/followup_scheduler.js`)

**Purpose:** Schedule and send follow-up messages

**Inputs:**
- Lead information (name, email, phone)
- Context (previous conversation, etc.)
- Channel preference (whatsapp, email, sms)

**Outputs:**
- Scheduled follow-up
- Message content
- Confidence score

**Features:**
- Multi-channel support (WhatsApp, Email, SMS)
- Conversation history tracking
- Automatic scheduling
- Confidence scoring
- Approval workflow

**API Endpoints:**
- `POST /api/followup/send` - Send follow-up

#### 5. Proposal Generator (`ai/proposal_generator.js`)

**Purpose:** Generate business proposals

**Inputs:**
- Client information
- Project details
- Requirements

**Outputs:**
- Proposal content
- Sections (introduction, scope, pricing, timeline)
- Professional formatting

**Features:**
- Confidence scoring
- Activity logging
- Approval workflow

#### 6. Scheduling Agent (`ai/scheduling_agent.js`)

**Purpose:** Generate weekly schedules and optimize time allocation

**Inputs:**
- User's tasks
- Calendar events
- Preferences

**Outputs:**
- Weekly schedule
- Time blocks
- Task assignments

**API Endpoints:**
- `GET /api/business/weekly-schedule` - Get schedule

#### 7. Business Operations (`ai/business_operations.js`)

**Purpose:** Analyze business data and provide insights

**Inputs:**
- Business data (tasks, emails, invoices, expenses)

**Outputs:**
- Business insights
- Recommendations
- Risk assessments
- Opportunities

**API Endpoints:**
- `GET /api/business/analyze` - Get business analysis

#### 8. Auto Response (`ai/auto_response.js`)

**Purpose:** Generate automatic responses based on patterns

**Inputs:**
- Email content
- Trigger patterns
- User-defined responses

**Outputs:**
- Auto-generated response
- Match confidence

**Features:**
- Keyword matching
- Question type detection
- Pattern-based triggers

### Supporting AI Systems

#### Confidence Engine (`ai/confidence_engine.js`)

**Purpose:** Evaluate confidence and risk for AI actions

**Outputs:**
- Confidence score (0-100)
- Risk level (low, medium, high)

**Factors:**
- Ambiguity in input
- Missing information
- Thread length
- Keyword matching

#### Safety Guard (`ai/safety_guard.js`)

**Purpose:** Implement safety logic for autonomy

**Features:**
- Pause on repeated failures
- Pause on user rejections
- Force approval below confidence threshold
- Rate limiting

#### Model Router (`ai/model_router.js`)

**Purpose:** Intelligent model selection with fallback

**Logic:**
- Default: Cheaper model (GPT-3.5)
- Fallback: Premium model (GPT-4) if:
  - Confidence is low
  - Error occurs
  - High-risk action

#### Preview Engine (`ai/preview_engine.js`)

**Purpose:** Generate preview text for AI actions

**Outputs:**
- What will happen
- Why (explanation)
- Confidence score
- Risk level

**API Endpoints:**
- `POST /api/ai/preview` - Get action preview

#### Explainability Engine (`ai/explainability_engine.js`)

**Purpose:** Generate explanations for AI decisions

**Outputs:**
- Short explanation
- Signals used
- Memory references
- Past patterns
- Urgency triggers

#### Simulation Engine (`ai/simulation_engine.js`)

**Purpose:** Dry-run mode for AI actions

**Features:**
- Runs full reasoning
- No real execution
- Returns preview of what would happen
- Toggle in settings

**API Endpoints:**
- `POST /api/ai/simulate` - Simulate action

#### Priority Engine (`ai/priority_engine.js`)

**Purpose:** Compute priority for tasks and emails

**Factors:**
- Keywords
- Urgency indicators
- Due dates
- Sender importance

#### Email Thread Analyzer (`ai/email_thread_analyzer.js`)

**Purpose:** Analyze email threads for context

**Outputs:**
- Thread summary
- Key points
- Action items
- Sentiment

#### User Style Learner (`ai/user_style_learner.js`)

**Purpose:** Learn and apply user's writing style

**Features:**
- Analyzes past emails
- Extracts style patterns
- Generates style profile
- Applies to reply generation

**API Endpoints:**
- `POST /api/user/style/retrain` - Retrain style model

### Autonomy System

#### Autonomy Loop (`ai/autonomy_loop.js`)

**Purpose:** Autonomous observation, analysis, decision, and action cycle

**Flow:**
1. **Observe:** Check for new emails, tasks, events
2. **Analyze:** Evaluate what needs attention
3. **Decide:** Determine actions to take
4. **Act:** Execute actions (with approval if needed)
5. **Learn:** Record outcomes and adjust

**Features:**
- Configurable interval (default: 5 minutes)
- Max actions per cycle
- Safety guard integration
- Rate limiting
- Feature flag check

**API Endpoints:**
- `POST /api/autonomy/run` - Run autonomy loop
- `POST /api/agent/autonomy` - Trigger autonomy

#### Autonomy Engine (`ai/autonomy_engine.js`)

**Purpose:** Core autonomy decision logic

**Features:**
- Priority-based action selection
- Resource allocation
- Conflict resolution

---

## 7. Memory System

### Memory Architecture

The system uses a multi-layer memory approach:

1. **Short-term Memory (PostgreSQL)**
   - Structured data (tasks, emails, invoices, etc.)
   - Fast retrieval
   - Relational queries

2. **Long-term Memory (Pinecone)**
   - Vector embeddings
   - Semantic search
   - Context retrieval

3. **Deep Memory (`lib/memory_deep.js`)**
   - Enhanced memory with deeper context
   - Pattern recognition
   - Relationship mapping

### Memory Components

#### Basic Memory (`lib/memory.js`)

**Functions:**
- `saveMemory(userId, text, metadata)` - Save to both PostgreSQL and Pinecone
- `searchMemory(userId, query, topK, filter)` - Semantic search
- `getMemoryContext(userId, query, maxTokens)` - Get relevant context

**Storage:**
- PostgreSQL: Full text, metadata, embedding (JSON string)
- Pinecone: Vector embedding, metadata (first 1000 chars)

#### Enhanced Memory (`lib/memory_enhanced.js`)

**Features:**
- Writing tone extraction
- Style pattern recognition
- Contextual memory retrieval

**Functions:**
- `getWritingTone(userId)` - Extract writing style
- Enhanced context retrieval

#### Deep Memory (`lib/memory_deep.js`)

**Features:**
- Deeper context analysis
- Pattern matching
- Relationship extraction

**Functions:**
- `searchDeepMemory(userId, query)` - Deep semantic search
- `saveDeepMemory(userId, text, metadata)` - Save with deep analysis

### Memory Usage

**When Memory is Saved:**
- Email interactions
- Task creation
- User conversations
- Business insights
- Style learning

**When Memory is Retrieved:**
- Generating replies (for context)
- Task extraction (for patterns)
- Proposal generation (for client history)
- Business analysis (for trends)

**Vector Embeddings:**
- Model: `text-embedding-3-small` (OpenAI)
- Dimension: 1536 (default)
- Index: `ai-coo-memory` (configurable)

---

## 8. Integrations

### Gmail API

**Purpose:** Email management and sending

**Capabilities:**
- Read emails
- Send emails
- Modify emails (mark as read, archive, etc.)
- Thread management

**OAuth Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`

**Implementation:**
- `lib/gmail.js` - Gmail API wrapper
- OAuth2 authentication
- Token refresh handling

**API Endpoints:**
- `GET /api/emails/fetch` - Fetch emails from Gmail
- `POST /api/emails/send` - Send email via Gmail
- `GET /api/auth/gmail/connect` - Initiate OAuth
- `GET /api/auth/gmail/callback` - OAuth callback

### Google Calendar API

**Purpose:** Calendar event management

**Capabilities:**
- Read calendar events
- Create events
- Find free time slots
- Event scheduling

**OAuth Scopes:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

**Implementation:**
- `lib/calendar.js` - Calendar API wrapper
- Integrated with Gmail OAuth flow

**API Endpoints:**
- `GET /api/calendar/events` - List events
- `POST /api/calendar/create-event` - Create event
- `GET /api/calendar/free-slots` - Find free slots
- `GET /api/auth/calendar/callback` - OAuth callback

### WhatsApp Cloud API

**Purpose:** WhatsApp messaging

**Capabilities:**
- Send text messages
- Send media (future)
- Conversation management

**Implementation:**
- `lib/whatsapp.js` - WhatsApp API wrapper
- Facebook Graph API v18.0

**API Endpoints:**
- `POST /api/whatsapp/send` - Send message

**Required Environment Variables:**
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

### OpenAI

**Purpose:** LLM and embeddings

**Models Used:**
- GPT-4 Turbo (primary)
- GPT-3.5 Turbo (fallback)
- text-embedding-3-small (embeddings)

**Implementation:**
- `lib/openai.js` - OpenAI client
- `ai/model_router.js` - Intelligent model selection

**Features:**
- Chat completions
- Embeddings generation
- Model routing with fallback

### Stripe

**Purpose:** Payment processing and subscriptions

**Capabilities:**
- Create checkout sessions
- Handle webhooks
- Subscription management
- Customer management

**Implementation:**
- Integrated in billing API routes

**API Endpoints:**
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle webhook events

**Subscription Tiers:**
- FREE
- PRO
- AI_COO

### Sentry

**Purpose:** Error tracking and monitoring

**Implementation:**
- `@sentry/nextjs` integration
- Client, server, and edge configs
- Automatic error capture

**Configuration:**
- `sentry.client.config.js`
- `sentry.server.config.js`
- `sentry.edge.config.js`

### PostHog

**Purpose:** Product analytics

**Implementation:**
- `lib/analytics.js` - PostHog wrapper
- `components/AnalyticsProvider.jsx` - React provider

**Features:**
- Event tracking
- User analytics
- Feature usage

---

## 9. Database Schema

### Core Models

#### User
- **Purpose:** User accounts and authentication
- **Fields:**
  - id, email, name, passwordHash, image
  - onboardingCompleted
  - createdAt, updatedAt
- **Relationships:**
  - One-to-many: tasks, emails, memories, invoices, etc.
  - One-to-one: subscription
  - One-to-many: accounts (OAuth), sessions

#### Account
- **Purpose:** OAuth account connections
- **Fields:**
  - id, userId, type, provider, providerAccountId
  - refresh_token, access_token, expires_at
  - token_type, scope, id_token, session_state
- **Relationships:**
  - Many-to-one: User

#### Session
- **Purpose:** User sessions
- **Fields:**
  - id, sessionToken, userId, expires
- **Relationships:**
  - Many-to-one: User

#### Subscription
- **Purpose:** User subscription tiers
- **Fields:**
  - id, userId, tier (FREE, PRO, AI_COO)
  - stripeCustomerId, stripeSubscriptionId, stripePriceId
  - status, currentPeriodEnd
- **Relationships:**
  - One-to-one: User

#### Task
- **Purpose:** Task management
- **Fields:**
  - id, userId, title, description
  - status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  - priority (LOW, MEDIUM, HIGH, URGENT)
  - dueDate, completedAt
  - source, sourceId, metadata
- **Relationships:**
  - Many-to-one: User

#### Email
- **Purpose:** Email storage and management
- **Fields:**
  - id, userId, messageId, threadId
  - from, to, subject, body, htmlBody
  - status (UNREAD, READ, REPLIED, ARCHIVED)
  - isProcessed, extractedTasks, aiReply
  - metadata, receivedAt
- **Relationships:**
  - Many-to-one: User

#### Memory
- **Purpose:** Long-term memory storage
- **Fields:**
  - id, userId, text, embedding (JSON string)
  - metadata, pineconeId
- **Relationships:**
  - Many-to-one: User

#### Invoice
- **Purpose:** Invoice management
- **Fields:**
  - id, userId, invoiceNumber, clientName, clientEmail
  - items (JSON), subtotal, tax, total
  - status (draft, sent, paid, overdue)
  - pdfUrl, dueDate, paidAt, metadata
- **Relationships:**
  - Many-to-one: User

#### FollowUp
- **Purpose:** Follow-up message scheduling
- **Fields:**
  - id, userId, leadName, leadPhone, leadEmail
  - message, status (pending, sent, replied, converted)
  - scheduledFor, sentAt
  - channel (whatsapp, email, sms)
  - conversationHistory (JSON), metadata
- **Relationships:**
  - Many-to-one: User

#### Workflow
- **Purpose:** Automation workflows
- **Fields:**
  - id, userId, name, description
  - trigger (email_received, task_created, time_based)
  - actions (JSON array)
  - isActive, metadata
- **Relationships:**
  - Many-to-one: User

#### Notification
- **Purpose:** User notifications
- **Fields:**
  - id, userId, type, title, message
  - link, read, readAt, metadata
- **Relationships:**
  - Many-to-one: User

#### Expense
- **Purpose:** Expense tracking
- **Fields:**
  - id, userId, category, description
  - amount, date, receiptUrl, metadata
- **Relationships:**
  - Many-to-one: User

#### BusinessInsight
- **Purpose:** AI-generated business insights
- **Fields:**
  - id, userId, type, title, description
  - priority (low, medium, high)
  - actionItems (JSON), metadata
- **Relationships:**
  - Many-to-one: User

#### AutoResponse
- **Purpose:** Automatic response rules
- **Fields:**
  - id, userId, trigger, pattern
  - response, channel, isActive, metadata
- **Relationships:**
  - Many-to-one: User

#### ActivityLog
- **Purpose:** Audit log of AI actions
- **Fields:**
  - id, userId, actionType, agentName
  - status (pending, completed, failed, rejected)
  - confidenceScore, riskLevel, explanation
  - inputData (JSON), outputData (JSON), metadata
- **Relationships:**
  - Many-to-one: User

### Indexes

All models have appropriate indexes for:
- User ID lookups
- Status filtering
- Date range queries
- Foreign key relationships

---

## 10. Automation & Workflows

### Workflow System

**Purpose:** Allow users to create custom automation rules

**Components:**
- `lib/workflow_engine.js` - Execution engine
- Workflow API routes - CRUD operations

### Triggers

**Available Triggers:**
1. **email_received** - When a new email arrives
2. **task_created** - When a task is created
3. **time_based** - Scheduled (cron-like)

### Actions

**Available Actions:**
1. **create_task** - Create a new task
2. **send_email** - Send an email
3. **send_whatsapp** - Send WhatsApp message
4. **create_followup** - Schedule a follow-up
5. **update_email_status** - Mark email as read/archived
6. **create_notification** - Create user notification

### Workflow Execution

**Process:**
1. Event occurs (trigger)
2. `processWorkflowTrigger()` called
3. Find active workflows matching trigger
4. Execute each workflow's actions
5. Log results

**Error Handling:**
- Workflow errors don't block other workflows
- Errors logged for debugging

### Workflow API

**Endpoints:**
- `GET /api/workflows/list` - List all workflows
- `POST /api/workflows/create` - Create workflow
- `PUT /api/workflows/update` - Update workflow
- `DELETE /api/workflows/delete` - Delete workflow
- `POST /api/workflows/execute` - Manually execute
- `POST /api/workflows/test` - Test workflow

### Workflow Structure

```json
{
  "name": "Auto-reply to inquiries",
  "trigger": "email_received",
  "actions": [
    {
      "type": "send_email",
      "payload": {
        "to": "{{email.from}}",
        "subject": "Re: {{email.subject}}",
        "body": "Thank you for your inquiry..."
      }
    }
  ],
  "isActive": true
}
```

---

## 11. Environment Variables

### Required Variables

**Database:**
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`

**Authentication:**
- `JWT_SECRET` - Secret key for JWT token signing
  - Should be a long, random string

### Recommended Variables

**AI/LLM:**
- `OPENAI_API_KEY` - OpenAI API key
  - Required for AI features

**Vector Database:**
- `PINECONE_API_KEY` - Pinecone API key
  - Required for memory/embeddings
- `PINECONE_INDEX_NAME` - Pinecone index name (optional)
  - Default: `ai-coo-memory`

**Gmail/Google:**
- `GOOGLE_CLIENT_ID` or `GMAIL_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` or `GMAIL_CLIENT_SECRET` - Google OAuth secret
- `GMAIL_REDIRECT_URI` or `GOOGLE_REDIRECT_URI` - OAuth redirect URI
  - Default: `http://localhost:3000/api/gmail/oauth2callback`

**WhatsApp:**
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp phone number ID

**Stripe:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (client-side)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**Error Tracking:**
- `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN
- `SENTRY_ORG` - Sentry organization (optional)
- `SENTRY_PROJECT` - Sentry project (optional)

**Analytics:**
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host (optional)
  - Default: `https://app.posthog.com`

**Deployment:**
- `NEXTAUTH_URL` - Base URL for OAuth callbacks
  - Production: `https://yourdomain.com`
  - Development: `http://localhost:3000`

**Node Environment:**
- `NODE_ENV` - Environment (development, production, test)

### Environment Validation

**File:** `lib/env-validator.js`

**Validation:**
- Required variables checked on startup
- Missing required vars throw error in production
- Missing recommended vars show warnings

---

## 12. Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- Pinecone account (for memory features)
- Google Cloud project (for Gmail/Calendar)
- WhatsApp Business API (optional)
- Stripe account (optional, for payments)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ai-coo
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set Up Database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open `http://localhost:3000`
   - Register a new account
   - Complete onboarding

### Docker Setup

1. **Build Docker Image**
   ```bash
   npm run docker:build
   ```

2. **Run with Docker Compose**
   ```bash
   npm run docker:run
   ```

### Production Deployment

**Vercel:**
- Connect GitHub repository
- Set environment variables in Vercel dashboard
- Deploy automatically on push

**Docker:**
- Build standalone image
- Deploy to any container platform
- Set environment variables

### Google OAuth Setup

1. Create Google Cloud project
2. Enable Gmail API and Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Pinecone Setup

1. Create Pinecone account
2. Create index (dimension: 1536)
3. Get API key
4. Set `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`

---

## 13. Current Limitations

### Known Limitations

1. **Email Processing**
   - Gmail OAuth required for email features
   - No support for other email providers (Outlook, etc.)
   - Email attachments not fully processed

2. **WhatsApp Integration**
   - Requires WhatsApp Business API setup
   - Limited to text messages (media support planned)
   - No two-way conversation handling

3. **Memory System**
   - Pinecone required for full memory features
   - Embedding generation adds latency
   - Memory size limited by Pinecone plan

4. **AI Model Costs**
   - GPT-4 usage can be expensive
   - No built-in cost optimization beyond model router
   - Rate limits depend on OpenAI plan

5. **Workflow System**
   - Limited trigger types
   - No visual workflow builder
   - Error handling could be improved

6. **Multi-user Support**
   - Designed for single-user per account
   - No team/organization features
   - No role-based access control (beyond basic permissions)

7. **Calendar Integration**
   - Google Calendar only
   - No support for other calendar providers
   - Limited event management features

8. **Invoice/Proposal**
   - PDF generation basic
   - No template customization UI
   - Limited formatting options

9. **Analytics**
   - Basic analytics only
   - No custom dashboards
   - Limited reporting features

10. **Mobile Support**
    - Responsive design but not mobile-optimized
    - No native mobile apps
    - Limited touch interactions

---

## 14. Future Improvements

### Planned Features

1. **Enhanced Email Support**
   - Multiple email provider support
   - Attachment processing
   - Email templates

2. **Advanced Workflows**
   - Visual workflow builder
   - More trigger types
   - Conditional logic
   - Loops and iterations

3. **Team Features**
   - Multi-user accounts
   - Role-based permissions
   - Team collaboration
   - Shared workflows

4. **Mobile Apps**
   - Native iOS app
   - Native Android app
   - Push notifications

5. **Advanced Analytics**
   - Custom dashboards
   - Export reports
   - Data visualization improvements

6. **Integration Expansion**
   - Slack integration
   - Microsoft Teams
   - CRM integrations (Salesforce, HubSpot)
   - Accounting software (QuickBooks, Xero)

7. **AI Improvements**
   - Fine-tuned models
   - Custom AI training
   - Multi-model support
   - Cost optimization

8. **Document Management**
   - Document storage
   - Version control
   - Collaboration features

9. **Advanced Scheduling**
   - Meeting scheduling
   - Time zone handling
   - Recurring events

10. **Security Enhancements**
    - Two-factor authentication
    - SSO support
    - Audit logs
    - Data encryption at rest

---

## Additional Resources

### Key Files Reference

**Core AI Agents:**
- `ai/agent_manager.js` - Main agent orchestrator
- `ai/reply_generator.js` - Email reply generation
- `ai/task_extractor.js` - Task extraction
- `ai/followup_scheduler.js` - Follow-up scheduling
- `ai/proposal_generator.js` - Proposal generation

**Memory System:**
- `lib/memory.js` - Basic memory operations
- `lib/memory_enhanced.js` - Enhanced memory
- `lib/memory_deep.js` - Deep memory
- `lib/pinecone.js` - Pinecone client

**Integrations:**
- `lib/gmail.js` - Gmail API
- `lib/calendar.js` - Calendar API
- `lib/whatsapp.js` - WhatsApp API

**Workflows:**
- `lib/workflow_engine.js` - Workflow execution

**Foundational Systems:**
- `ai/confidence_engine.js` - Confidence scoring
- `ai/safety_guard.js` - Safety logic
- `ai/model_router.js` - Model selection
- `lib/approval_manager.js` - Approval workflows
- `lib/activity_logger.js` - Activity logging
- `lib/rollback_manager.js` - Rollback system
- `ai/simulation_engine.js` - Simulation mode
- `lib/feature_flags.js` - Feature flags
- `lib/permissions.js` - Permissions
- `lib/cost_guard.js` - Cost/rate limiting

### API Documentation

All API endpoints follow RESTful conventions:
- `GET` - Retrieve data
- `POST` - Create/execute
- `PUT` - Update
- `DELETE` - Delete

Authentication: Bearer token in `Authorization` header

### Support

For issues, questions, or contributions, please refer to the project repository.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained By:** AI COO Development Team




