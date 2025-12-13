import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { saveMemory } from '@/lib/memory'

export async function extractTasksFromEmail(userId, emailContent, metadata = {}) {
  try {
    const prompt = `Extract actionable tasks from this email. Return ONLY a valid JSON array of tasks, no other text.

Email content:
${emailContent}

For each task, extract:
- title: Brief task description
- description: Detailed description (optional)
- priority: LOW, MEDIUM, HIGH, or URGENT
- dueDate: ISO date string if mentioned (optional)
- assignee: Person name if mentioned (optional)

Return format:
[
  {
    "title": "Task title",
    "description": "Task details",
    "priority": "HIGH",
    "dueDate": "2024-01-15T00:00:00Z",
    "assignee": "John Doe"
  }
]`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a task extraction assistant. Extract tasks from emails and return them as JSON.',
      },
      { role: 'user', content: prompt },
    ])

    // Parse JSON response
    const jsonMatch = response?.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    const tasks = JSON.parse(jsonMatch[0])

    // Save tasks to database
    const createdTasks = []
    for (const task of tasks) {
      const created = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          source: 'email',
          sourceId: metadata.messageId,
          metadata: {
            assignee: task.assignee,
            ...metadata,
          },
        },
      })
      createdTasks.push(created)

      // Save to memory
      await saveMemory(userId, `Task: ${task.title} - ${task.description || ''}`, {
        type: 'task',
        source: 'email',
        priority: task.priority,
      })
    }

    return tasks
  } catch (error) {
    console.error('Error extracting tasks:', error)
    return []
  }
}

