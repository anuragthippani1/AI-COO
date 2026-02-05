# Agent-Driven Architecture

## Overview

The AI COO system has been refactored into a fully agent-driven architecture where ALL operational actions are initiated and executed by AI agents, not by user clicks.

## Core Principle

- **Events trigger agents**
- **Agents decide actions**
- **Agents execute actions**
- **UI only displays outcomes and approvals**

## Key Components

### 1. Event System (`lib/event_system.js`)

Central event emitter/listener for all system events:

- **Email:** `NEW_EMAIL_RECEIVED`, `EMAIL_REPLY_NEEDED`
- **Tasks:** `TASK_OVERDUE`, `TASK_DUE_SOON`
- **Follow-ups:** `FOLLOWUP_DUE`, `FOLLOWUP_OVERDUE`
- **Calendar:** `CALENDAR_EVENT_SOON`, `CALENDAR_EVENT_STARTING`
- **Financial:** `INVOICE_OVERDUE`, `INVOICE_DUE_SOON`
- **Time-based:** `DAILY_SUMMARY_TIME`, `WEEKLY_PLANNING_TIME`, `END_OF_DAY`
- **CRM:** `LEAD_STALE`, `LEAD_QUALIFIED`
- **User:** `USER_APPROVAL_RECEIVED`, `USER_REJECTION_RECEIVED`

### 2. Agent Loop (`ai/agent_loop.js`)

Central continuous loop that:

- Listens to all system events
- Automatically processes emails when received
- Checks for overdue tasks, follow-ups, invoices
- Runs time-based automations (daily/weekly)
- Handles user approvals/rejections

### 3. Centralized Decision Making (`ai/agent_manager.js`)

All actions must go through `makeDecision()`:

- Evaluates confidence and risk
- Determines: auto-execute, request approval, or require approval
- Executes actions through `executeAction()`
- Logs all decisions to Activity Timeline

### 4. Autonomy Control (`lib/autonomy_control.js`)

Manages user autonomy levels:

- **FULL**: Auto-execute high confidence actions
- **MODERATE**: Require approval for medium confidence
- **CONSERVATIVE**: Require approval for most actions
- **MANUAL**: All actions require approval

Safety features:

- Automatically reduces autonomy on repeated failures
- Automatically reduces autonomy on repeated rejections
- Can pause autonomy for safety

### 5. Approval System (`lib/approval_manager.js`)

State-based approval system:

- Creates ApprovalRequest when needed
- Pauses execution until approval
- Executes action after approval
- Records rejections for autonomy adjustment

### 6. Inbox Automation (`ai/inbox_automation.js`)

Runs on `NEW_EMAIL_RECEIVED`:

- Classifies email intent (lead, task, question, urgent, noise)
- Extracts tasks and creates them (with confidence/approval flow)
- Drafts replies and sends or queues for approval
- Schedules follow-ups and updates CRM for leads
- Logs every step to Activity Timeline

### 7. Activity Logger (`lib/activity_logger.js`)

- `logActivity(userId, action, agentName, status, metadata)` writes to ActivityLog
- Used by agent_manager, inbox_automation, and agent_loop
- Dashboard briefing reads recent logs via `/api/dashboard/briefing`

## Execution Flow

1. **Event Occurs** (e.g., new email received)
2. **Event Emitted** → `eventSystem.emit(EVENTS.NEW_EMAIL_RECEIVED, userId, data)`
3. **Agent Loop Handles** → `agent_loop.handleNewEmail()`
4. **Decision Made** → `agent_manager.makeDecision()`
5. **Action Executed** → `agent_manager.executeAction()` (if auto-execute)
6. **Or Approval Requested** → `approval_manager.createApprovalRequest()`
7. **User Approves/Rejects** → Action executed or cancelled
8. **Activity Logged** → All actions logged to Activity Timeline

## Confidence & Risk

Actions are evaluated based on:

- **Confidence Score** (0-100): How certain the AI is about the action
  - High (≥85): Usually auto-executed (depends on autonomy level)
  - Medium (75-84): May require approval
  - Low (<75): Requires approval or is paused

- **Risk Level**: `low`, `medium`, `high`
  - Low risk: Routine actions (create task, schedule follow-up)
  - Medium risk: External communication (send email, WhatsApp)
  - High risk: Financial actions (create invoice, send payment)

The combination of confidence, risk, and autonomy level determines whether an action is auto-executed or requires approval.

## UI Changes

### Deprecated / De-emphasized Manual Actions

- "Create Task" → "Manual Task" (de-emphasized; AI creates most tasks)
- "Create Follow-up" → Agents create automatically
- "Send Reply" → Agents send automatically
- "Add Lead" → "Manual Lead" (AI-detected leads surfaced in CRM)

### New Actions

- **Review** - View agent-created items
- **Approve** - Approve pending agent actions
- **Undo** - Rollback agent actions

### Activity Timeline

- Source of truth for all agent actions
- Shows: what, when, why, confidence, risk
- Groups by time: Today, Yesterday, This Week, Older
- Filters: All, Handled by AI, Needs Approval, Risks / Alerts

## TODO Items

### High Priority

- [ ] Refactor `inbox_automation.js` to use `agent_manager.makeDecision()` for all actions
- [ ] Add autonomy level configuration to Settings page

### Medium Priority

- [ ] Add webhook support for external event triggers
- [ ] Create admin panel for monitoring agent loop

### Completed

- [x] Wire approval UI to `/api/ai/approve` and `/api/ai/reject`
- [x] Implement execution for action types in `executeAction()` (tasks, email, follow-ups, CRM, notifications, invoices, WhatsApp, calendar reminders)
- [x] Agent loop status indicator on Dashboard (Agents Active / Paused)
- [x] Task due soon notifications (`TASK_DUE_SOON`)
- [x] Calendar event reminder logic (`CALENDAR_EVENT_SOON`)
- [x] Invoice overdue handling with reminder throttling

## API Endpoints

### Agent Loop Control

- `POST /api/agent/loop` - Start/stop agent loop
- `GET /api/agent/loop` - Get agent loop status

### Agent Run (User-Initiated)

- `POST /api/agent/run` - Run agent for user commands, queries, or manual overrides (body: `{ type, content, metadata }`). Event-driven automation uses the agent loop instead.

### Approval Actions

- `POST /api/ai/approve` - Approve an action
- `POST /api/ai/reject` - Reject an action

### Activity

- `GET /api/activity/logs` - List activity logs (used by Activity Timeline)
- `POST /api/activity/rollback` - Rollback an agent action

### Dashboard

- `GET /api/dashboard/briefing` - Returns today’s summary, activities, pending approvals, urgent items (used by AI COO Briefing UI)

### Time-Based Automation (cron-triggered)

- `POST /api/automation/daily-summary` - Generate daily AI COO summary
- `POST /api/automation/weekly-planner` - Generate weekly planner

## Notes

- All existing functionality preserved
- System evolves incrementally
- UI components updated to show agent outcomes
- Manual actions still available but de-emphasized
- Activity Timeline is the single source of truth
- Agent loop auto-starts in production
- Dashboard briefing shows handled items, approvals needed, and urgent items

## Related

- `TESTING_GUIDE.md` - How to test the agent-driven system
