/**
 * Cloudflare Pages Middleware for SPA routing
 * 修复版本 - 防止JS文件请求返回HTML导致的MIME类型错误
 * 
 * 关键改进：
 * - 更严格的静态资源检测，包括所有可能的文件扩展名
 * - 先尝试获取原始响应，只有在404时才返回index.html
 * - 确保所有静态资源请求都不会被拦截
 * - 完全避免直接传递 body stream
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // 扩展的静态资源检测 - 包括所有可能的文件类型
    const isStaticFile = 
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_static/') ||
      pathname.startsWith('/node_modules/') ||
      // 所有已知的文件扩展名
      /\.(js|mjs|jsx|ts|tsx|css|scss|sass|less|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|otf|json|map|webp|mp4|mp3|pdf|zip|txt|xml|wasm|data|bin|webm|avi|mov|flv|swf|ogg|wav|aac|flac|rss|atom|yaml|yml|toml|md|markdown|gzip|bz2|7z|rar|tar|gz)$/i.test(pathname) ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname === '/manifest.json' ||
      pathname.startsWith('/src/') // 开发环境路径，也允许通过
    
    // 静态文件直接通过，不进行任何处理
    if (isStaticFile) {
      return next()
    }
    
    // index.html 本身直接通过
    if (pathname === '/index.html') {
      return next()
    }
    
    // 对于非静态资源路径，先尝试获取原始响应
    // 这样如果文件存在（比如根路径的 index.html），会直接返回
    const originalResponse = await next()
    
    // 如果原始响应是成功的（200-299），直接返回
    if (originalResponse && originalResponse.ok) {
      return originalResponse
    }
    
    // 如果原始响应是404或403，说明文件不存在，此时返回index.html用于SPA路由
    if (originalResponse && (originalResponse.status === 404 || originalResponse.status === 403)) {
      // 构建指向 index.html 的请求
      const indexUrl = new URL('/index.html', url.origin)
      const indexRequest = new Request(indexUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      })
      
      // 获取 index.html 的响应
      const indexResponse = await next(indexRequest)
      
      // 如果成功获取 index.html，克隆并返回
      if (indexResponse && indexResponse.ok) {
        const clonedResponse = indexResponse.clone()
        const body = await clonedResponse.text()
        
        return new Response(body, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      }
    }
    
    // 其他情况，返回原始响应
    return originalResponse
    
  } catch (error) {
    // 任何错误都返回原始响应，确保连接不会关闭
    return next()
  }
}
