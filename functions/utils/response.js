/**
 * 统一封装 Cloudflare Pages API 的 JSON 响应
 */

function createResponse(success, message, data, status = 200, code = status) {
  const body = JSON.stringify({
    success,
    code,
    message,
    data,
  })

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

/**
 * 成功响应
 */
export function successResponse(data = null, message = 'success', status = 200) {
  return createResponse(true, message, data, status, status)
}

/**
 * 错误响应
 */
export function errorResponse(message = '请求失败', status = 400, code = status, data = null) {
  return createResponse(false, message, data, status, code)
}

/**
 * 未授权响应
 */
export function unauthorizedResponse(message = '未授权') {
  return errorResponse(message, 401, 401)
}

/**
 * 资源未找到响应
 */
export function notFoundResponse(message = '资源不存在') {
  return errorResponse(message, 404, 404)
}
