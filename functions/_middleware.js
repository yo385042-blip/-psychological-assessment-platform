/**
 * Cloudflare Pages Middleware for SPA routing
 * 将所有请求重定向到 index.html，让 React Router 处理路由
 */
export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 跳过静态资源和已存在的文件
  const staticExtensions = ['.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.map']
  const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext)) || 
                       pathname.startsWith('/assets/') ||
                       pathname.startsWith('/_next/')
  
  // 如果是静态文件，直接返回
  if (isStaticFile) {
    return next()
  }
  
  // 尝试获取原始响应
  let response = await next()
  
  // 如果文件不存在（404）且不是静态文件，返回 index.html
  if (response.status === 404) {
    // 重新构建请求 URL，指向 index.html
    const indexUrl = new URL(request.url)
    indexUrl.pathname = '/index.html'
    
    // 获取 index.html
    const indexRequest = new Request(indexUrl.toString(), {
      method: 'GET',
      headers: request.headers,
    })
    
    response = await fetch(indexRequest)
    
    // 如果成功获取 index.html，返回它
    if (response.ok) {
      return new Response(response.body, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  }
  
  return response
}

