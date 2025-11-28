/**
 * Cloudflare Pages Middleware for SPA routing
 * 简化版本 - 确保所有路由都能正确处理
 */
export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 静态资源列表 - 这些直接通过，不经过中间件处理
  const staticExtensions = [
    '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.json', '.map', '.webp',
    '.mp4', '.mp3', '.pdf', '.zip', '.webm', '.avif'
  ]
  
  // 检查是否是静态资源
  const isStaticResource = 
    staticExtensions.some(ext => pathname.endsWith(ext)) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_static/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/index.html'
  
  // 静态资源直接返回
  if (isStaticResource) {
    return next()
  }
  
  // 对于所有其他路径（如 /dashboard, /login 等），返回 index.html
  // 这样 React Router 可以在客户端处理路由
  try {
    // 获取 index.html
    const indexRequest = new Request(new URL('/index.html', url.origin).toString(), {
      method: 'GET',
      headers: request.headers,
    })
    
    const response = await next(indexRequest)
    
    // 如果成功获取 index.html
    if (response.ok) {
      return new Response(response.body, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }
  } catch (error) {
    console.error('[Middleware] Error fetching index.html:', error)
  }
  
  // 如果出错，尝试直接返回原始响应
  return next()
}
