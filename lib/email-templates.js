// Email templates for transactional emails

export function getWelcomeEmailTemplate(name) {
  return {
    subject: 'Welcome to AI COO!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to AI COO!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${name || 'there'},</p>
            <p>Welcome to AI COO! Your AI-powered operations assistant is ready to help you automate your business workflows.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>Connect your Gmail to enable email automation</li>
              <li>Create tasks and let AI extract them from emails</li>
              <li>Set up automations for repetitive workflows</li>
              <li>Generate invoices and proposals</li>
              <li>Track leads in your CRM</li>
            </ul>
            <p style="margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to AI COO!\n\nHi ${name || 'there'},\n\nWelcome to AI COO! Your AI-powered operations assistant is ready to help you automate your business workflows.\n\nGet started: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
  }
}

export function getPasswordResetEmailTemplate(name, resetToken) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
  return {
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${name || 'there'},</p>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <p style="margin-top: 30px;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password\n\nHi ${name || 'there'},\n\nYou requested to reset your password. Click this link: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  }
}

export function getInvoiceEmailTemplate(clientName, invoiceNumber, total, invoiceUrl) {
  return {
    subject: `Invoice ${invoiceNumber} from AI COO`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333;">Invoice ${invoiceNumber}</h2>
            <p>Hi ${clientName},</p>
            <p>Please find attached your invoice for the amount of <strong>$${total.toFixed(2)}</strong>.</p>
            <p style="margin-top: 30px;">
              <a href="${invoiceUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Invoice</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Thank you for your business!
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Invoice ${invoiceNumber}\n\nHi ${clientName},\n\nPlease find your invoice for $${total.toFixed(2)}.\n\nView invoice: ${invoiceUrl}`,
  }
}

export function getProposalEmailTemplate(clientName, proposalTitle, proposalUrl) {
  return {
    subject: `Proposal: ${proposalTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333;">Proposal: ${proposalTitle}</h2>
            <p>Hi ${clientName},</p>
            <p>I'm excited to share a proposal for your project. Please review the details and let me know if you have any questions.</p>
            <p style="margin-top: 30px;">
              <a href="${proposalUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Proposal</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Looking forward to working with you!
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Proposal: ${proposalTitle}\n\nHi ${clientName},\n\nPlease review the proposal: ${proposalUrl}`,
  }
}

export function getTaskReminderEmailTemplate(taskTitle, dueDate) {
  return {
    subject: `Reminder: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fff3cd; padding: 30px; border-radius: 10px; border-left: 4px solid #ffc107;">
            <h2 style="color: #333;">Task Reminder</h2>
            <p><strong>${taskTitle}</strong></p>
            <p>This task is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
            <p style="margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tasks" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Task</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Task Reminder: ${taskTitle}\n\nThis task is due on ${new Date(dueDate).toLocaleDateString()}.\n\nView task: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tasks`,
  }
}




