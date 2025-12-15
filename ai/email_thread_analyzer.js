import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

/**
 * Advanced Email Thread Analyzer
 * Analyzes entire email threads to extract context, commitments, and tasks
 */
export async function analyzeEmailThread(userId, threadId) {
  try {
    // Fetch all emails from the thread
    const threadEmails = await prisma.email.findMany({
      where: {
        userId,
        threadId,
      },
      orderBy: {
        receivedAt: 'asc',
      },
    })

    if (threadEmails.length === 0) {
      return {
        success: false,
        error: 'No emails found in thread',
      }
    }

    // Merge emails into structured format
    const mergedThread = mergeThreadEmails(threadEmails)

    // Analyze with AI
    const analysis = await analyzeThreadWithAI(mergedThread)

    // Extract structured insights
    const insights = {
      threadId,
      emailCount: threadEmails.length,
      participants: extractParticipants(threadEmails),
      timeline: buildTimeline(threadEmails),
      ...analysis,
    }

    return {
      success: true,
      insights,
    }
  } catch (error) {
    console.error('Error analyzing email thread:', error)
    throw error
  }
}

/**
 * Merge emails into structured format
 */
function mergeThreadEmails(emails) {
  return emails.map((email, index) => ({
    index,
    from: email.from,
    to: email.to,
    subject: email.subject,
    body: email.body,
    receivedAt: email.receivedAt,
    status: email.status,
    metadata: email.metadata || {},
  }))
}

/**
 * Analyze thread with AI
 */
async function analyzeThreadWithAI(mergedThread) {
  const threadText = mergedThread
    .map(
      (email, idx) =>
        `[Email ${idx + 1} - ${new Date(email.receivedAt).toLocaleDateString()}]\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body}\n\n---\n`
    )
    .join('\n')

  const prompt = `Analyze this email thread and extract:

1. **Unfinished Questions**: Questions asked but not answered
2. **Commitments**: Statements like "I will send...", "I'll get back to you...", promises made
3. **Follow-up Needs**: What needs to be followed up on
4. **Hidden Tasks**: Tasks mentioned but not explicitly stated
5. **Conversation Stage**: Where in the sales/business process (lead → negotiation → post-sale)
6. **Sentiment**: Overall tone (positive, neutral, negative, urgent)
7. **Key Topics**: Main topics discussed
8. **Action Items**: Clear action items for both parties

Thread:
${threadText}

Return ONLY valid JSON:
{
  "unfinishedQuestions": ["question 1", "question 2"],
  "commitments": [
    {
      "who": "sender name",
      "what": "commitment text",
      "deadline": "ISO date if mentioned"
    }
  ],
  "followUpNeeds": [
    {
      "what": "what needs follow-up",
      "priority": "high|medium|low",
      "suggestedDate": "ISO date"
    }
  ],
  "hiddenTasks": [
    {
      "title": "task title",
      "description": "task description",
      "priority": "high|medium|low",
      "dueDate": "ISO date if mentioned"
    }
  ],
  "conversationStage": "lead|contacted|qualified|proposal_sent|negotiation|post_sale|support",
  "sentiment": "positive|neutral|negative|urgent",
  "keyTopics": ["topic 1", "topic 2"],
  "actionItems": [
    {
      "action": "action description",
      "assignee": "who should do it",
      "priority": "high|medium|low"
    }
  ],
  "summary": "Brief summary of the entire thread"
}`

  try {
    const response = await getChatCompletion([
      {
        role: 'system',
        content:
          'You are an expert email thread analyzer. Extract structured insights from email conversations.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getDefaultAnalysis()
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error in AI thread analysis:', error)
    return getDefaultAnalysis()
  }
}

/**
 * Extract participants from thread
 */
function extractParticipants(emails) {
  const participants = new Set()
  emails.forEach((email) => {
    participants.add(email.from)
    participants.add(email.to)
  })
  return Array.from(participants)
}

/**
 * Build timeline of thread
 */
function buildTimeline(emails) {
  return emails.map((email) => ({
    date: email.receivedAt,
    from: email.from,
    subject: email.subject,
    status: email.status,
  }))
}

/**
 * Default analysis if AI fails
 */
function getDefaultAnalysis() {
  return {
    unfinishedQuestions: [],
    commitments: [],
    followUpNeeds: [],
    hiddenTasks: [],
    conversationStage: 'lead',
    sentiment: 'neutral',
    keyTopics: [],
    actionItems: [],
    summary: 'Thread analysis unavailable',
  }
}

/**
 * Get thread analysis for a specific email
 */
export async function getThreadAnalysisForEmail(userId, emailId) {
  try {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    })

    if (!email || !email.threadId) {
      return null
    }

    return await analyzeEmailThread(userId, email.threadId)
  } catch (error) {
    console.error('Error getting thread analysis:', error)
    return null
  }
}


