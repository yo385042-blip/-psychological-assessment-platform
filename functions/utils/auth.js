/**
 * 认证中间件和工具函数
 */

import { extractToken, verifyToken } from './jwt.js'
import { unauthorizedResponse } from './response.js'

/**
 * 验证请求的认证状态
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @param {Object} db - 数据库实例（可选，用于会话验证）
 */
export async function verifyAuth(request, env = {}, db = null) {
  const token = extractToken(request)
  if (!token) {
    return { valid: false, error: unauthorizedResponse('缺少认证 Token') }
  }

  const payload = verifyToken(token, env)
  if (!payload) {
    return { valid: false, error: unauthorizedResponse('Token 无效或已过期') }
  }

  // 如果提供了数据库实例，验证会话（单设备登录控制）
  if (db && db.sessions && payload.sessionId) {
    const isValid = await db.sessions.validateSession(payload.sessionId, token)
    if (!isValid) {
      return { valid: false, error: unauthorizedResponse('会话已失效，请重新登录') }
    }
  }

  return { valid: true, userId: payload.userId, userRole: payload.role, sessionId: payload.sessionId }
}

/**
 * 检查是否为管理员
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @param {Object} db - 数据库实例（可选，用于会话验证）
 */
export async function requireAdmin(request, env = {}, db = null) {
  const authResult = await verifyAuth(request, env, db)
  if (!authResult.valid) {
    return authResult
  }

  if (authResult.userRole !== 'admin') {
    return {
      valid: false,
      error: unauthorizedResponse('需要管理员权限'),
    }
  }

  return authResult
}

/**
 * 密码哈希（简化版，生产环境应使用更安全的方法）
 */
export function hashPassword(password) {
  // 简单的哈希（实际应使用 bcrypt 或类似库）
  // 这里仅作为示例，生产环境需要更安全的实现
  return btoa(password).replace(/=/g, '')
}

/**
 * 验证密码
 */
export function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword
}




















