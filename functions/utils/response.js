/**
 * 统一封装 API 响应格式，方便在 Cloudflare Pages Functions 中复用
 */

export function successResponse(data = null, message = 'ok', status = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  )
}

export function errorResponse(message = 'error', status = 400, code = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      code,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  )
}

export function unauthorizedResponse(message = '未授权', status = 401) {
  return errorResponse(message, status, status)
}

export function notFoundResponse(message = '资源不存在', status = 404) {
  return errorResponse(message, status, status)
}

