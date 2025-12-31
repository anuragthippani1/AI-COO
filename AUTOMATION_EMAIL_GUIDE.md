# 📧 Automation Email Action - How It Works

## ✅ Yes, It Actually Sends Emails!

When you create an automation with "Send Email" action, **it will actually send emails** via Gmail API when the trigger fires.

---

## How It Works

### 1. **Workflow Trigger**
When an event occurs (e.g., email received, task created), the system:
- Finds all active automations with matching trigger
- Executes each automation's actions

### 2. **Send Email Action**
When the "send_email" action executes:
- ✅ Uses your connected Gmail account
- ✅ Sends email via Gmail API
- ✅ Replaces template variables (e.g., `{{emailFrom}}`)
- ✅ Logs the result

---

## Requirements

For email sending to work:

1. **Gmail Must Be Connected**
   - Go to Settings → Integrations
   - Connect your Gmail account
   - Status should show "✓ Connected"

2. **Automation Must Be Active**
   - Toggle must be "Active" (green badge)
   - Inactive automations won't execute

3. **Trigger Must Fire**
   - The event must occur (email received, task created, etc.)
   - Automation only runs when trigger matches

4. **Valid Email Address**
   - "To" field must have a valid email
   - Can use variables like `{{emailFrom}}`

---

## Template Variables

You can use these variables in your email fields:

### In "To" Field:
- `{{emailFrom}}` - Email address of the sender (from trigger data)
- `{{leadEmail}}` - Lead's email address

### In "Subject" Field:
- `{{emailSubject}}` - Subject of the received email
- `{{taskTitle}}` - Title of the task

### In "Body" Field:
- `{{emailContent}}` - Content of the received email
- `{{taskTitle}}` - Title of the task
- `{{contactName}}` - Name of the contact

---

## Example Automations

### Example 1: Auto-Reply to Emails
**Trigger**: Email Received  
**Action**: Send Email
- **To**: `{{emailFrom}}`
- **Subject**: `Re: {{emailSubject}}`
- **Body**: `Thank you for your email. We'll get back to you soon!`

**Result**: When you receive an email, it automatically replies to the sender.

### Example 2: Task Reminder
**Trigger**: Task Overdue  
**Action**: Send Email
- **To**: `client@example.com`
- **Subject**: `Reminder: {{taskTitle}}`
- **Body**: `This is a reminder that {{taskTitle}} is overdue.`

**Result**: Sends reminder email when a task becomes overdue.

---

## Testing Your Automation

### Method 1: Wait for Trigger
1. Create automation with "Send Email" action
2. Make sure it's **Active**
3. Wait for the trigger event (e.g., receive an email)
4. Check your Gmail Sent folder - email should be there!

### Method 2: Manual Test (Coming Soon)
- We can add a "Test" button to manually trigger workflows
- For now, you need to wait for the actual trigger event

---

## Troubleshooting

### Email Not Sending?

1. **Check Gmail Connection**
   - Settings → Integrations → Gmail should show "✓ Connected"
   - If not, reconnect Gmail

2. **Check Automation Status**
   - Automation must be "Active" (green badge)
   - Inactive automations don't run

3. **Check Email Address**
   - "To" field must have a valid email
   - Variables like `{{emailFrom}}` will be replaced automatically
   - If variable doesn't exist, email won't send

4. **Check Server Logs**
   - Look for `[Workflow] Sending email...` messages
   - Check for error messages

5. **Check Gmail Sent Folder**
   - Emails are sent from your Gmail account
   - Check your Gmail Sent folder to verify

---

## How to Verify It's Working

1. **Create a Test Automation**:
   - Trigger: Email Received
   - Action: Send Email
   - To: `{{emailFrom}}`
   - Subject: `Auto-reply: {{emailSubject}}`
   - Body: `This is an automated reply.`

2. **Send Yourself an Email**:
   - Send an email to your Gmail account
   - The automation should trigger

3. **Check Results**:
   - Check your Gmail Sent folder
   - You should see the automated reply
   - Check server logs for confirmation

---

## Important Notes

- ✅ **Emails are sent immediately** when trigger fires
- ✅ **Uses your Gmail account** (sent from your email)
- ✅ **Requires Gmail connection** (OAuth)
- ✅ **Works automatically** (no manual intervention needed)
- ⚠️ **Be careful** - emails send automatically, test first!

---

## Security

- Emails are sent from **your connected Gmail account**
- Only **you** can create automations for your account
- Automation actions are **logged** for debugging
- You can **disable** automations anytime

---

## Next Steps

1. ✅ Connect Gmail (if not done)
2. ✅ Create automation with "Send Email" action
3. ✅ Make sure automation is **Active**
4. ✅ Test by triggering the event
5. ✅ Check Gmail Sent folder to verify

**Yes, it really sends emails!** 🚀










