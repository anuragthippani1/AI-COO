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
- `NEW_EMAIL_RECEIVED` - New email detected
- `TASK_OVERDUE` - Task past due date
- `FOLLOWUP_DUE` - Follow-up scheduled time reached
- `INVOICE_OVERDUE` - Invoice past due
- `DAILY_SUMMARY_TIME` - Daily summary generation time
- `WEEKLY_PLANNING_TIME` - Weekly planner generation time
- `USER_APPROVAL_RECEIVED` - User approved an action
- `USER_REJECTION_RECEIVED` - User rejected an action

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

## Execution Flow

1. **Event Occurs** (e.g., new email received)
2. **Event Emitted** → `eventSystem.emit(EVENTS.NEW_EMAIL_RECEIVED, userId, data)`
3. **Agent Loop Handles** → `agent_loop.handleNewEmail()`
4. **Decision Made** → `agent_manager.makeDecision()`
5. **Action Executed** → `agent_manager.executeAction()` (if auto-execute)
6. **Or Approval Requested** → `approval_manager.createApprovalRequest()`
7. **User Approves/Rejects** → Action executed or cancelled
8. **Activity Logged** → All actions logged to Activity Timeline

## UI Changes

### Deprecated Manual Actions
- "Create Task" → Changed to "Manual Override" (de-emphasized)
- "Create Follow-up" → Removed (agents create automatically)
- "Send Reply" → Removed (agents send automatically)

### New Actions
- **Review** - View agent-created items
- **Approve** - Approve pending agent actions
- **Undo** - Rollback agent actions

### Activity Timeline
- Source of truth for all agent actions
- Shows: what, when, why, confidence, risk
- Groups by time (Today, Yesterday, This Week)
- Filters: All, Handled by AI, Needs Approval, Risks

## TODO Items

### High Priority
- [ ] Refactor `inbox_automation.js` to use `agent_manager.makeDecision()` for all actions
- [ ] Wire approval UI buttons to `/api/ai/approve` and `/api/ai/reject`
- [ ] Add autonomy level configuration to Settings page
- [ ] Implement execution for all action types in `executeAction()`

### Medium Priority
- [ ] Add webhook support for external event triggers
- [ ] Implement calendar event reminder logic
- [ ] Complete invoice overdue handling
- [ ] Add task due soon notifications

### Low Priority
- [ ] Add agent loop status indicator to Dashboard
- [ ] Create admin panel for monitoring agent loop
- [ ] Add agent performance metrics

## API Endpoints

### Agent Loop Control
- `POST /api/agent/loop` - Start/stop agent loop
- `GET /api/agent/loop` - Get agent loop status

### Approval Actions
- `POST /api/ai/approve` - Approve an action
- `POST /api/ai/reject` - Reject an action

## Notes

- All existing functionality preserved
- System evolves incrementally
- UI components updated to show agent outcomes
- Manual actions still available but de-emphasized
- Activity Timeline is the single source of truth




