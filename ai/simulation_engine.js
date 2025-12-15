import { runAgent } from './agent_manager'
import { evaluateConfidence } from './confidence_engine'
import { explainDecision } from './explainability_engine'
import { generatePreview } from './preview_engine'

/**
 * Dry-Run / Simulation Mode
 * Runs AI reasoning without executing actions
 */

/**
 * Simulate an AI action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action to simulate
 * @param {object} input - Input context
 * @returns {Promise<{simulation: object, report: object}>}
 */
export async function simulateAction(userId, actionType, input) {
  try {
    const simulation = {
      userId,
      actionType,
      input,
      mode: 'simulation',
      timestamp: new Date().toISOString(),
      steps: [],
      proposedActions: [],
      confidenceScores: [],
      explanations: [],
    }

    // Step 1: Run agent reasoning (without execution)
    const agentResponse = await runAgent({
      userId,
      type: actionType,
      content: typeof input === 'string' ? input : JSON.stringify(input),
      metadata: {
        ...input,
        simulation: true, // Flag to prevent actual execution
      },
    })

    simulation.steps.push({
      step: 'agent_reasoning',
      result: agentResponse,
    })

    // Step 2: Generate proposed actions
    const proposedActions = extractProposedActions(agentResponse, actionType)
    simulation.proposedActions = proposedActions

    // Step 3: Evaluate each proposed action
    for (const action of proposedActions) {
      const confidence = await evaluateConfidence(input, action)
      const explanation = await explainDecision(
        { userId, actionType, input },
        action
      )

      simulation.confidenceScores.push(confidence)
      simulation.explanations.push(explanation)
    }

    // Step 4: Generate preview for each action
    const previews = []
    for (let i = 0; i < proposedActions.length; i++) {
      const preview = await generatePreview(
        userId,
        actionType,
        input,
        proposedActions[i]
      )
      previews.push(preview)
    }

    // Generate simulation report
    const report = generateSimulationReport(simulation, previews)

    return {
      simulation,
      report,
    }
  } catch (error) {
    console.error('[SimulationEngine] Error simulating action:', error)
    return {
      simulation: {
        userId,
        actionType,
        input,
        mode: 'simulation',
        error: error.message,
      },
      report: {
        summary: 'Simulation failed',
        error: error.message,
      },
    }
  }
}

/**
 * Extract proposed actions from agent response
 */
function extractProposedActions(agentResponse, actionType) {
  const actions = []

  if (agentResponse.data) {
    // Extract actions based on response structure
    if (agentResponse.data.tasks && Array.isArray(agentResponse.data.tasks)) {
      agentResponse.data.tasks.forEach(task => {
        actions.push({
          type: 'create_task',
          data: task,
        })
      })
    }

    if (agentResponse.data.reply) {
      actions.push({
        type: 'send_email',
        data: {
          reply: agentResponse.data.reply,
        },
      })
    }

    if (agentResponse.data.followUp) {
      actions.push({
        type: 'schedule_followup',
        data: agentResponse.data.followUp,
      })
    }
  }

  // If no actions extracted, create a generic one
  if (actions.length === 0) {
    actions.push({
      type: actionType,
      data: agentResponse.data || {},
    })
  }

  return actions
}

/**
 * Generate simulation report
 */
function generateSimulationReport(simulation, previews) {
  const totalActions = simulation.proposedActions.length
  const avgConfidence = simulation.confidenceScores.length > 0
    ? Math.round(
        simulation.confidenceScores.reduce((sum, c) => sum + c.confidenceScore, 0) /
        simulation.confidenceScores.length
      )
    : 0

  const highRiskActions = simulation.confidenceScores.filter(
    c => c.riskLevel === 'high'
  ).length

  const report = {
    summary: `Simulation completed: ${totalActions} action(s) would be executed`,
    totalActions,
    averageConfidence: avgConfidence,
    highRiskActions,
    actions: simulation.proposedActions.map((action, index) => ({
      actionType: action.type,
      preview: previews[index]?.preview,
      confidence: simulation.confidenceScores[index],
      explanation: simulation.explanations[index],
    })),
    recommendations: generateRecommendations(simulation, avgConfidence, highRiskActions),
    timestamp: simulation.timestamp,
  }

  return report
}

/**
 * Generate recommendations based on simulation
 */
function generateRecommendations(simulation, avgConfidence, highRiskActions) {
  const recommendations = []

  if (avgConfidence < 50) {
    recommendations.push({
      level: 'warning',
      message: 'Low average confidence. Consider reviewing actions before execution.',
    })
  }

  if (highRiskActions > 0) {
    recommendations.push({
      level: 'error',
      message: `${highRiskActions} high-risk action(s) detected. Manual approval recommended.`,
    })
  }

  if (simulation.proposedActions.length > 5) {
    recommendations.push({
      level: 'info',
      message: 'Large number of actions proposed. Consider batching or prioritizing.',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      level: 'success',
      message: 'Simulation looks good. Actions can proceed with standard approval.',
    })
  }

  return recommendations
}

/**
 * Run full simulation mode for user
 * @param {string} userId - User ID
 * @param {boolean} enabled - Enable/disable simulation mode
 */
export async function setSimulationMode(userId, enabled) {
  try {
    // TODO: Store simulation mode preference in user settings
    // For now, using metadata in User model
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Note: This requires adding a metadata field to User model
        // For now, we'll use a separate approach
      },
    })

    return { success: true, simulationMode: enabled }
  } catch (error) {
    console.error('[SimulationEngine] Error setting simulation mode:', error)
    return { success: false, error: error.message }
  }
}


