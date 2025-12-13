import { getChatCompletion } from '@/lib/openai'
import { getMemoryContext } from '@/lib/memory'
import { getWritingTone } from '@/lib/memory_enhanced'
import { prisma } from '@/lib/prisma'

export async function generateReply(userId, emailContent, metadata = {}) {
  try {
    // Get user's writing style from memory (enhanced)
    const writingTone = await getWritingTone(userId)
    const writingStyle = writingTone || await getMemoryContext(userId, 'email writing style tone', 500)
    
    // Get relevant context
    const context = await getMemoryContext(userId, emailContent, 1500)

    const prompt = `Generate a professional email reply based on this email.

Original email:
${emailContent}

${context ? `Relevant context:\n${context}` : ''}

${writingStyle ? `User's writing style:\n${writingStyle}` : ''}

Generate a concise, professional reply that:
1. Acknowledges the email
2. Addresses key points
3. Includes a clear call to action if needed
4. Matches the user's writing style

Return only the email body, no subject line.`

    const reply = await getChatCompletion([
      {
        role: 'system',
        content: 'You are an email reply assistant. Generate professional, concise email replies.',
      },
      { role: 'user', content: prompt },
    ])

    // Save reply to email record if messageId exists
    if (metadata.messageId) {
      await prisma.email.updateMany({
        where: {
          userId,
          messageId: metadata.messageId,
        },
        data: {
          aiReply: reply || '',
        },
      })
    }

    return reply || ''
  } catch (error) {
    console.error('Error generating reply:', error)
    return 'I apologize, but I encountered an error generating a reply. Please try again.'
  }
}

