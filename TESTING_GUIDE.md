# Agent-Driven Architecture Testing Guide

## Quick Test Checklist

### 1. Agent Loop Status ✅
- [ ] Open Dashboard (`http://localhost:3000/dashboard`)
- [ ] Check for "Agents Active" badge in header
- [ ] Verify green pulsing dot indicates active status

### 2. Event System Test
- [ ] Check browser console for `[AgentLoop] Started` message
- [ ] Verify no errors in console

### 3. Email Processing Test
- [ ] Send a test email to your connected Gmail account
- [ ] Or manually trigger: `POST /api/emails/fetch`
- [ ] Check Activity Timeline (`/activity`) for new entries
- [ ] Verify email processing appears in timeline

### 4. Approval Flow Test
- [ ] Find an activity with "Needs Approval" status
- [ ] Click "Approve" button
- [ ] Verify action executes and status updates
- [ ] Check Activity Timeline refreshes

### 5. Agent Decision Test
- [ ] Check Activity Timeline for confidence scores
- [ ] Verify risk levels displayed
- [ ] Check explanations are shown

## Manual API Tests

### Test Agent Loop Control
```bash
# Check status
curl -X GET http://localhost:3000/api/agent/loop \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start loop
curl -X POST http://localhost:3000/api/agent/loop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### Test Approval
```bash
# Approve action (replace APPROVAL_ID)
curl -X POST http://localhost:3000/api/ai/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approvalRequestId": "APPROVAL_ID"}'
```

### Test Event Emission
```bash
# Trigger new email event (replace USER_ID)
# This would normally be done automatically, but you can test manually
```

## Expected Behavior

### ✅ Working Correctly
- Agent loop starts automatically on Dashboard load
- Status indicator shows "Agents Active"
- Emails trigger `NEW_EMAIL_RECEIVED` event
- Activities appear in Activity Timeline
- Approve buttons execute actions
- Confidence scores and risk levels displayed

### ⚠️ Known Issues / TODOs
- `inbox_automation.js` still uses its own decision logic (needs refactor)
- Some action types may not be fully implemented in `executeAction()`
- Calendar events not yet implemented
- Invoice overdue handling incomplete

## Debugging

### Check Agent Loop
1. Open browser console
2. Look for `[AgentLoop]` log messages
3. Check for errors

### Check Events
1. Monitor network tab for API calls
2. Check `/api/activity/logs` for new entries
3. Verify events are being emitted

### Check Database
```bash
# View activity logs
npx prisma studio
# Navigate to ActivityLog table
```

## Common Issues

### Agent Loop Not Starting
- Check browser console for errors
- Verify authentication token exists
- Check `/api/agent/loop` endpoint responds

### No Activities Showing
- Verify emails are being fetched
- Check ActivityLog table in database
- Ensure events are being emitted

### Approve Button Not Working
- Check network tab for API errors
- Verify approvalRequestId exists in log metadata
- Check `/api/ai/approve` endpoint


