import { errorResponse, unauthorizedResponse } from './response.js'
import { verifyToken } from './jwt.js'

/**
 * 简单密码哈希（示例版）
 * 线上建议使用更安全的算法，这里为了兼容之前逻辑，保持简单实现。
 */
export function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + data[i]) >>> 0
  }
  return `h${hash.toString(16)}`
}

export function verifyPassword(rawPassword, hashed) {
  if (!hashed) return false
  return hashPassword(rawPassword) === hashed
}

/**
 * 校验 JWT
 * - 从 Authorization: Bearer xxx 中解析
 * - 使用 verifyToken 校验签名
 */
export async function verifyAuth(request, env) {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return {
      valid: false,
      error: unauthorizedResponse('未登录或登录已过期'),
    }
  }

  const token = auth.slice(7).trim()
  try {
    const payload = verifyToken(token, env)
    if (!payload || !payload.userId) {
      return {
        valid: false,
        error: unauthorizedResponse('无效的令牌'),
      }
    }

    return {
      valid: true,
      userId: payload.userId,
      userRole: payload.role || 'user',
      tokenPayload: payload,
    }
  } catch (e) {
    console.error('verifyAuth error:', e)
    return {
      valid: false,
      error: unauthorizedResponse('令牌校验失败'),
    }
  }
}

/**
 * 管理员权限校验装饰器（当前 API 中未直接使用，预留）
 */
export function requireAdmin(handler) {
  return async (request, db, env) => {
    const authResult = await verifyAuth(request, env)
    if (!authResult.valid) {
      return authResult.error
    }

    if (authResult.userRole !== 'admin') {
      return unauthorizedResponse('需要管理员权限')
    }

    return handler(request, db, env, authResult.userId)
  }
}

