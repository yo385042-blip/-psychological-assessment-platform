/**
 * 用户行为分析工具
 * 追踪用户操作和页面访问
 */

interface AnalyticsEvent {
  name: string
  category: string
  label?: string
  value?: number
  timestamp: number
}

class Analytics {
  private events: AnalyticsEvent[] = []

  /**
   * 追踪事件
   */
  track(eventName: string, category: string, label?: string, value?: number) {
    const event: AnalyticsEvent = {
      name: eventName,
      category,
      label,
      value,
      timestamp: Date.now(),
    }

    this.events.push(event)

    // 可以在这里发送到分析服务
    // this.sendToAnalyticsService(event)

    // 保存到 localStorage（可选）
    this.saveToLocalStorage(event)
  }

  /**
   * 追踪页面访问
   */
  trackPageView(path: string) {
    this.track('page_view', 'navigation', path)
  }

  /**
   * 追踪用户操作
   */
  trackUserAction(action: string, details?: Record<string, any>) {
    this.track('user_action', 'interaction', action, undefined)
    if (details) {
      // 可以将详细信息存储到单独的事件中
      this.track('user_action_details', 'interaction', JSON.stringify(details), undefined)
    }
  }

  /**
   * 追踪按钮点击
   */
  trackButtonClick(buttonName: string, location?: string) {
    this.track('button_click', 'interaction', buttonName, undefined)
    if (location) {
      this.track('button_click_location', 'navigation', location, undefined)
    }
  }

  /**
   * 追踪表单提交
   */
  trackFormSubmit(formName: string, success: boolean) {
    this.track('form_submit', 'interaction', formName, success ? 1 : 0)
  }

  /**
   * 追踪搜索
   */
  trackSearch(query: string, resultCount: number) {
    this.track('search', 'interaction', query, resultCount)
  }

  /**
   * 追踪下载
   */
  trackDownload(fileName: string, fileType: string) {
    this.track('download', 'interaction', `${fileName}.${fileType}`, undefined)
  }

  /**
   * 保存到 localStorage
   */
  private saveToLocalStorage(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('analytics_events')
      const events = stored ? JSON.parse(stored) : []
      events.push(event)

      // 只保留最近1000条事件
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }

      localStorage.setItem('analytics_events', JSON.stringify(events))
    } catch {
      // 忽略错误
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const events = this.events
    const pageViews = events.filter((e) => e.name === 'page_view').length
    const userActions = events.filter((e) => e.name === 'user_action').length
    const buttonClicks = events.filter((e) => e.name === 'button_click').length
    const searches = events.filter((e) => e.name === 'search').length
    const downloads = events.filter((e) => e.name === 'download').length

    // 获取最常访问的页面
    const pageViewPaths = events
      .filter((e) => e.name === 'page_view')
      .map((e) => e.label || '')
      .filter(Boolean)

    const pageViewCounts = pageViewPaths.reduce((acc, path) => {
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, count]) => ({ path, count }))

    return {
      totalEvents: events.length,
      pageViews,
      userActions,
      buttonClicks,
      searches,
      downloads,
      topPages,
    }
  }

  /**
   * 导出事件数据（用于分析）
   */
  exportEvents() {
    return JSON.stringify(this.events, null, 2)
  }

  /**
   * 清除所有事件
   */
  clear() {
    this.events = []
    localStorage.removeItem('analytics_events')
  }
}

export const analytics = new Analytics()

