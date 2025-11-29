/**
 * Cloudflare Pages Middleware for SPA routing
 * 最简化版本 - 绝对安全，避免任何可能导致连接关闭的操作
 * 
 * 关键改进：
 * - 使用 clone() 方法安全地复制响应
 * - 简化逻辑，减少出错可能
 * - 完全避免直接传递 body stream
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // 静态资源检测 - 简化版本
    const isStaticFile = 
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_static/') ||
      /\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|json|map|webp|mp4|mp3|pdf|zip|txt|xml|wasm)$/i.test(pathname) ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    
    // 静态文件直接通过
    if (isStaticFile) {
      return next()
    }
    
    // index.html 本身直接通过
    if (pathname === '/index.html') {
      return next()
    }
    
    // 对于所有其他路径，获取 index.html
    // 使用最简单的方式：直接请求 index.html
    const indexUrl = new URL('/index.html', url.origin)
    const indexRequest = new Request(indexUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    })
    
    // 获取 index.html 的响应
    const indexResponse = await next(indexRequest)
    
    // 如果成功获取，克隆响应并修改状态码
    if (indexResponse && indexResponse.ok) {
      // 使用 clone() 安全地复制响应
      const clonedResponse = indexResponse.clone()
      
      // 读取响应体内容
      const body = await clonedResponse.text()
      
      // 创建新的响应，避免直接传递 stream
      return new Response(body, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
    
    // 如果获取失败，返回原始响应
    return next()
    
  } catch (error) {
    // 任何错误都返回原始响应，确保连接不会关闭
    return next()
  }
}
