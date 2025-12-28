import { prisma } from './prisma'

/**
 * Permissions System
 * Control what actions users can perform based on roles
 */

const ROLE_PERMISSIONS = {
  user: [
    'view_dashboard',
    'view_tasks',
    'view_emails',
    'create_tasks',
    'send_emails',
    'view_reports',
    'manage_workflows',
  ],
  admin: [
    'view_dashboard',
    'view_tasks',
    'view_emails',
    'create_tasks',
    'send_emails',
    'view_reports',
    'manage_workflows',
    'manage_users',
    'manage_settings',
    'view_activity_logs',
    'manage_feature_flags',
  ],
}

/**
 * Check if user has permission
 * @param {string} userId - User ID
 * @param {string} permission - Permission name
 * @returns {Promise<boolean>}
 */
export async function hasPermission(userId, permission) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return false
    }

    // TODO: Add role field to User model
    // For now, all users have 'user' role
    const role = 'user' // Default role

    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
  } catch (error) {
    console.error('[Permissions] Error checking permission:', error)
    return false
  }
}

/**
 * Check if user can perform an action
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export async function canPerformAction(userId, actionType) {
  try {
    const actionPermissions = {
      send_email: 'send_emails',
      create_task: 'create_tasks',
      view_dashboard: 'view_dashboard',
      manage_workflow: 'manage_workflows',
      view_reports: 'view_reports',
      manage_users: 'manage_users',
      view_activity_logs: 'view_activity_logs',
    }

    const requiredPermission = actionPermissions[actionType]
    if (!requiredPermission) {
      return { allowed: true } // No specific permission required
    }

    const hasPerm = await hasPermission(userId, requiredPermission)
    if (!hasPerm) {
      return {
        allowed: false,
        reason: `Permission "${requiredPermission}" required for action "${actionType}"`,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('[Permissions] Error checking action permission:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

/**
 * Get user role
 * @param {string} userId - User ID
 * @returns {Promise<string>}
 */
export async function getUserRole(userId) {
  try {
    // TODO: Add role field to User model
    // For now, return default role
    return 'user'
  } catch (error) {
    console.error('[Permissions] Error getting user role:', error)
    return 'user'
  }
}








