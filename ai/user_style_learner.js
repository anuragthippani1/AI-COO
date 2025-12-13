import { prisma } from '@/lib/prisma'
import { getChatCompletion } from '@/lib/openai'
import { searchDeepMemory, saveDeepMemory } from '@/lib/memory_deep'

/**
 * User Style Learner
 * Analyzes user's past emails and replies to learn their writing style
 */

/**
 * Learn user's writing style from past emails and replies
 */
export async function learnUserStyle(userId) {
  try {
    console.log(`[User Style Learner] Learning style for user ${userId}`)

    // 1. Fetch user's sent emails and replies
    const userEmails = await fetchUserEmailsAndReplies(userId)

    if (userEmails.length === 0) {
      console.log(`[User Style Learner] No emails found for user ${userId}`)
      return getDefaultStyleProfile()
    }

    // 2. Extract style features using AI
    const styleProfile = await extractStyleFeatures(userId, userEmails)

    // 3. Save to deep memory
    await saveDeepMemory(userId, {
      text: JSON.stringify(styleProfile),
      type: 'user_style_profile',
      metadata: {
        userId,
        learnedAt: new Date().toISOString(),
        sampleCount: userEmails.length,
      },
      priority: 'high',
    })

    console.log(`[User Style Learner] Style profile saved for user ${userId}`)
    return styleProfile
  } catch (error) {
    console.error('[User Style Learner] Error learning style:', error)
    return getDefaultStyleProfile()
  }
}

/**
 * Fetch user's emails and replies
 */
async function fetchUserEmailsAndReplies(userId) {
  try {
    // Fetch emails where user has sent replies (aiReply field)
    const emailsWithReplies = await prisma.email.findMany({
      where: {
        userId,
        aiReply: {
          not: null,
        },
      },
      select: {
        body: true,
        aiReply: true,
        subject: true,
        from: true,
        to: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // Also fetch from memory - user's actual sent replies
    const memoryReplies = await searchDeepMemory(userId, 'user_reply', {
      limit: 50,
      type: 'user_reply',
    })

    // Combine and format
    const userEmails = []

    // Add emails with AI replies (these were likely edited and sent)
    for (const email of emailsWithReplies) {
      if (email.aiReply) {
        userEmails.push({
          text: email.aiReply,
          subject: email.subject,
          type: 'reply',
          timestamp: email.createdAt,
        })
      }
    }

    // Add memory replies
    for (const memory of memoryReplies) {
      if (memory.text) {
        userEmails.push({
          text: typeof memory.text === 'string' ? memory.text : JSON.stringify(memory.text),
          type: 'reply',
          timestamp: memory.metadata?.sentAt ? new Date(memory.metadata.sentAt) : (memory.metadata?.timestamp ? new Date(memory.metadata.timestamp) : new Date()),
        })
      }
    }

    // Also check for emails sent via the send endpoint (stored in memory)
    const sentEmails = await searchDeepMemory(userId, 'sent_email', {
      limit: 50,
      type: 'sent_email',
    })

    for (const sent of sentEmails) {
      if (sent.text) {
        userEmails.push({
          text: typeof sent.text === 'string' ? sent.text : JSON.stringify(sent.text),
          subject: sent.metadata?.subject || '',
          type: 'sent',
          timestamp: sent.metadata?.sentAt ? new Date(sent.metadata.sentAt) : (sent.metadata?.timestamp ? new Date(sent.metadata.timestamp) : new Date()),
        })
      }
    }

    // Sort by timestamp (most recent first)
    userEmails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Return last 100
    return userEmails.slice(0, 100)
  } catch (error) {
    console.error('[User Style Learner] Error fetching emails:', error)
    return []
  }
}

/**
 * Extract style features using AI
 */
async function extractStyleFeatures(userId, userEmails) {
  try {
    // Combine all email texts
    const emailTexts = userEmails.map((e) => e.text).join('\n\n---\n\n')

    if (!emailTexts || emailTexts.trim().length < 50) {
      return getDefaultStyleProfile()
    }

    const analysisPrompt = `Analyze the following collection of emails/replies written by a user. Extract their writing style characteristics.

Emails/Replies:
${emailTexts.substring(0, 8000)} 

Analyze and extract:
1. Greeting style (e.g., "Hey", "Hi", "Hello", "Dear", "Hi there")
2. Closing style (e.g., "Thanks", "Regards", "Best", "- Name", "Cheers")
3. Formality level (formal, informal, casual, professional)
4. Average sentence length (short, medium, long)
5. Emoji usage (frequent, occasional, rare, never)
6. Punctuation style (minimal, balanced, heavy)
7. Common vocabulary/phrases (list 5-10 unique phrases they use)
8. Tone (e.g., "friendly and concise", "professional and detailed", "casual and brief")
9. Message length preference (short, medium, long)
10. Language style (direct, soft, diplomatic, assertive)

Return a JSON object with this exact structure:
{
  "greeting": "extracted greeting style",
  "closing": "extracted closing style",
  "formality": "formal/informal/casual/professional",
  "sentenceLength": "short/medium/long",
  "emojiUsage": "frequent/occasional/rare/never",
  "punctuationStyle": "minimal/balanced/heavy",
  "vocabulary": ["phrase1", "phrase2", "phrase3"],
  "tone": "description of tone",
  "messageLength": "short/medium/long",
  "languageStyle": "direct/soft/diplomatic/assertive"
}

Return ONLY the JSON object, no other text.`

    const response = await getChatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a writing style analyst. Analyze text and extract writing style characteristics. Return only valid JSON.',
        },
        { role: 'user', content: analysisPrompt },
      ],
      0.3 // Lower temperature for more consistent analysis
    )

    // Parse JSON response
    let styleProfile
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        styleProfile = JSON.parse(jsonMatch[0])
      } else {
        styleProfile = JSON.parse(response)
      }
    } catch (parseError) {
      console.error('[User Style Learner] Error parsing AI response:', parseError)
      console.error('[User Style Learner] Response was:', response)
      return getDefaultStyleProfile()
    }

    // Validate and enhance profile
    return validateAndEnhanceProfile(styleProfile, userEmails)
  } catch (error) {
    console.error('[User Style Learner] Error extracting features:', error)
    return getDefaultStyleProfile()
  }
}

/**
 * Validate and enhance style profile
 */
function validateAndEnhanceProfile(profile, userEmails) {
  // Ensure all required fields exist
  const validated = {
    greeting: profile.greeting || 'Hi',
    closing: profile.closing || 'Thanks',
    formality: profile.formality || 'professional',
    sentenceLength: profile.sentenceLength || 'medium',
    emojiUsage: profile.emojiUsage || 'rare',
    punctuationStyle: profile.punctuationStyle || 'balanced',
    vocabulary: Array.isArray(profile.vocabulary) ? profile.vocabulary : [],
    tone: profile.tone || 'professional and friendly',
    messageLength: profile.messageLength || 'medium',
    languageStyle: profile.languageStyle || 'direct',
  }

  // Add statistics
  validated.stats = {
    sampleCount: userEmails.length,
    learnedAt: new Date().toISOString(),
  }

  return validated
}

/**
 * Get default style profile (fallback)
 */
function getDefaultStyleProfile() {
  return {
    greeting: 'Hi',
    closing: 'Thanks',
    formality: 'professional',
    sentenceLength: 'medium',
    emojiUsage: 'rare',
    punctuationStyle: 'balanced',
    vocabulary: [],
    tone: 'professional and friendly',
    messageLength: 'medium',
    languageStyle: 'direct',
    stats: {
      sampleCount: 0,
      learnedAt: new Date().toISOString(),
    },
  }
}

/**
 * Get user's style profile from memory
 */
export async function getUserStyleProfile(userId) {
  try {
    // Search for style profile in deep memory
    const results = await searchDeepMemory(userId, 'user_style_profile', {
      limit: 1,
    })

    if (results.length > 0) {
      const profileData = results[0]
      let profile

      // Try to parse the text as JSON
      if (typeof profileData.text === 'string') {
        try {
          profile = JSON.parse(profileData.text)
        } catch (e) {
          // If parsing fails, try to extract JSON from the text
          const jsonMatch = profileData.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            profile = JSON.parse(jsonMatch[0])
          } else {
            return getDefaultStyleProfile()
          }
        }
      } else {
        profile = profileData.text
      }

      // Validate profile
      if (profile && typeof profile === 'object') {
        return validateAndEnhanceProfile(profile, [])
      }
    }

    // Return default if not found
    return getDefaultStyleProfile()
  } catch (error) {
    console.error('[User Style Learner] Error getting style profile:', error)
    return getDefaultStyleProfile()
  }
}

