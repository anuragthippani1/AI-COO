import { prisma } from './prisma'

/**
 * Feature Flags System
 * Enable/disable features per user or globally
 */

const DEFAULT_FEATURES = {
  email_automation: true,
  task_extraction: true,
  ai_replies: true,
  follow_up_automation: true,
  proposal_generation: true,
  invoice_generation: true,
  whatsapp_messaging: true,
  crm_integration: true,
  autonomy_mode: false, // Default: disabled for safety
  simulation_mode: true,
  approval_required: true,
}

/**
 * Check if a feature is enabled for a user
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name
 * @returns {Promise<boolean>}
 */
export async function isFeatureEnabled(userId, featureName) {
  try {
    // TODO: Create FeatureFlag model in Prisma schema
    // For now, using subscription tier as feature gate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      return false
    }

    // Check default features
    if (DEFAULT_FEATURES[featureName] === false) {
      return false
    }

    // Check subscription-based features
    const tier = user.subscription?.tier || 'FREE'
    
    const tierFeatures = {
      FREE: ['email_automation', 'task_extraction', 'simulation_mode'],
      PRO: ['email_automation', 'task_extraction', 'ai_replies', 'follow_up_automation', 'proposal_generation', 'invoice_generation', 'simulation_mode'],
      AI_COO: Object.keys(DEFAULT_FEATURES), // All features
    }

    return tierFeatures[tier]?.includes(featureName) || false
  } catch (error) {
    console.error('[FeatureFlags] Error checking feature:', error)
    return false // Default to disabled on error
  }
}

/**
 * Get all enabled features for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>}
 */
export async function getEnabledFeatures(userId) {
  try {
    const allFeatures = Object.keys(DEFAULT_FEATURES)
    const enabledFeatures = []

    for (const feature of allFeatures) {
      if (await isFeatureEnabled(userId, feature)) {
        enabledFeatures.push(feature)
      }
    }

    return enabledFeatures
  } catch (error) {
    console.error('[FeatureFlags] Error getting enabled features:', error)
    return []
  }
}

/**
 * Enable a feature for a user (admin function)
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name
 * @returns {Promise<{success: boolean}>}
 */
export async function enableFeature(userId, featureName) {
  try {
    // TODO: Implement when FeatureFlag model is created
    return { success: true }
  } catch (error) {
    console.error('[FeatureFlags] Error enabling feature:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Disable a feature for a user (admin function)
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name
 * @returns {Promise<{success: boolean}>}
 */
export async function disableFeature(userId, featureName) {
  try {
    // TODO: Implement when FeatureFlag model is created
    return { success: true }
  } catch (error) {
    console.error('[FeatureFlags] Error disabling feature:', error)
    return { success: false, error: error.message }
  }
}








