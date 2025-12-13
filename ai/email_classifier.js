import { getChatCompletion } from '@/lib/openai'

export async function classifyEmail(emailContent, subject, from) {
  try {
    const prompt = `Classify this email into one of these categories:
- task: Contains actionable tasks or requests
- followup: Needs follow-up or is a follow-up message
- inquiry: Question or information request
- complaint: Customer complaint or issue
- lead: Potential new customer or business opportunity
- general: General communication

Email:
Subject: ${subject}
From: ${from}
Content: ${emailContent}

Return ONLY a JSON object:
{
  "category": "task|followup|inquiry|complaint|lead|general",
  "confidence": 0.0-1.0,
  "urgency": "low|medium|high|urgent",
  "needsReply": true|false,
  "needsFollowUp": true|false
}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are an email classification assistant. Classify emails accurately.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        category: 'general',
        confidence: 0.5,
        urgency: 'medium',
        needsReply: false,
        needsFollowUp: false,
      }
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error classifying email:', error)
    return {
      category: 'general',
      confidence: 0.5,
      urgency: 'medium',
      needsReply: false,
      needsFollowUp: false,
    }
  }
}

