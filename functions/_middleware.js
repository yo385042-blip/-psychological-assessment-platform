/**
 * Cloudflare Pages Middleware for SPA routing
 * 最终修复版本 - 彻底防止JS文件请求返回HTML导致的MIME类型错误
 * 
 * 关键改进：
 * - 更严格的静态资源检测，包括所有可能的文件类型
 * - 检查请求的 Accept 头，避免对非HTML请求返回HTML
 * - 即使404，如果是静态资源请求，也不返回index.html
 * - 完全避免直接传递 body stream
 */
export async function onRequest(context) {
  const { request, next } = context
  
  try {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // 获取请求的 Accept 头，用于判断是否为 HTML 请求
    const acceptHeader = request.headers.get('Accept') || ''
    const isHtmlRequest = acceptHeader.includes('text/html')
    
    // 扩展的静态资源检测 - 包括所有可能的文件类型
    const hasFileExtension = /\.([a-z0-9]+)$/i.test(pathname)
    const isStaticPath = 
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/_static/') ||
      pathname.startsWith('/node_modules/') ||
      pathname.startsWith('/src/') // 开发环境路径 - 必须直接通过，不返回HTML
    
    // 检查是否为静态资源扩展名（包括开发环境的文件类型）
    const isStaticExtension = /\.(js|mjs|jsx|ts|tsx|css|scss|sass|less|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|otf|json|map|webp|mp4|mp3|pdf|zip|txt|xml|wasm|data|bin|webm|avi|mov|flv|swf|ogg|wav|aac|flac|rss|atom|yaml|yml|toml|md|markdown|gzip|bz2|7z|rar|tar|gz)$/i.test(pathname)
    
    // 判断是否为静态文件
    const isStaticFile = 
      isStaticPath ||
      isStaticExtension ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname === '/manifest.json'
    
    // 特别检查：如果是源代码文件（.tsx, .ts, .jsx, .js），绝对不要返回HTML
    const isSourceCodeFile = /\.(tsx?|jsx?|mjs)$/i.test(pathname)
    
    // 静态文件直接通过，不进行任何处理
    // 重要：对于 /src/ 路径和源代码文件，即使文件不存在（404），也绝对不要返回 HTML
    if (isStaticFile || isSourceCodeFile) {
      const response = await next()
      // 如果是 404 响应且 Content-Type 是 HTML，创建一个纯文本的 404 响应
      if (response && (response.status === 404 || response.status === 403)) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('text/html')) {
          // 返回纯文本的 404，而不是 HTML
          return new Response('File not found', {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        }
      }
      return response
    }
    
    // 特别处理：如果是 /src/ 路径但没有被上面的规则捕获，也要直接通过
    // 这确保了任何 /src/ 开头的请求都不会返回 HTML
    if (pathname.startsWith('/src/')) {
      const response = await next()
      // 如果返回的是 HTML 格式的 404，改为纯文本
      if (response && (response.status === 404 || response.status === 403)) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('text/html')) {
          return new Response('File not found', {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        }
      }
      return response
    }
    
    // index.html 本身直接通过
    if (pathname === '/index.html') {
      return next()
    }
    
    // 如果有文件扩展名但不是静态扩展名，且不是 HTML 请求，直接返回原始响应
    // 这样可以避免对图片、字体等非HTML资源的404请求返回HTML
    if (hasFileExtension && !isHtmlRequest) {
      return next()
    }
    
    // 对于非静态资源路径，先尝试获取原始响应
    const originalResponse = await next()
    
    // 如果原始响应是成功的（200-299），直接返回
    if (originalResponse && originalResponse.ok) {
      return originalResponse
    }
    
    // 如果原始响应是404或403，需要判断是否应该返回index.html
    if (originalResponse && (originalResponse.status === 404 || originalResponse.status === 403)) {
      // 重要：如果有文件扩展名，说明请求的是文件而不是路由，不应该返回HTML
      // 或者请求的 Accept 头不包含 text/html，也不应该返回HTML
      if (hasFileExtension || !isHtmlRequest) {
        // 直接返回原始404响应，不返回HTML
        return originalResponse
      }
      
      // 只有在明确的HTML路由请求时，才返回index.html用于SPA路由
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
