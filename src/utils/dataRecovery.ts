/**
 * 数据恢复工具
 * 用于检查和恢复可能丢失的数据
 */

import { STORAGE_KEYS } from '@/constants'

export interface DataCheckResult {
  key: string
  exists: boolean
  size: number
  itemCount?: number
  error?: string
}

/**
 * 检查所有数据存储
 */
export function checkAllData(): DataCheckResult[] {
  const keys = [
    STORAGE_KEYS.LINKS,
    STORAGE_KEYS.CUSTOM_USERS,
    STORAGE_KEYS.AUDIT_LOGS,
    STORAGE_KEYS.BACKUPS,
    STORAGE_KEYS.QUESTION_TYPES,
    STORAGE_KEYS.PUBLISH_STATE,
    STORAGE_KEYS.IMPORT_HISTORY,
    'default_accounts_quota',
    'default_accounts_used_quota',
    'default_accounts_total_quota',
    'default_accounts_recharge',
    'default_accounts_login_times',
  ]

  return keys.map(key => {
    try {
      const data = localStorage.getItem(key)
      if (!data) {
        return {
          key,
          exists: false,
          size: 0,
        }
      }

      const parsed = JSON.parse(data)
      const itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length

      return {
        key,
        exists: true,
        size: data.length,
        itemCount,
      }
    } catch (error) {
      return {
        key,
        exists: false,
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
}

/**
 * 导出所有数据为 JSON
 */
export function exportAllData(): string {
  const keys = [
    STORAGE_KEYS.LINKS,
    STORAGE_KEYS.CUSTOM_USERS,
    STORAGE_KEYS.AUDIT_LOGS,
    STORAGE_KEYS.BACKUPS,
    STORAGE_KEYS.QUESTION_TYPES,
    STORAGE_KEYS.PUBLISH_STATE,
    STORAGE_KEYS.IMPORT_HISTORY,
    'default_accounts_quota',
    'default_accounts_used_quota',
    'default_accounts_total_quota',
    'default_accounts_recharge',
    'default_accounts_login_times',
  ]

  const data: Record<string, any> = {}
  const timestamp = new Date().toISOString()

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        data[key] = JSON.parse(stored)
      }
    } catch (error) {
      console.error(`Failed to export ${key}:`, error)
    }
  })

  return JSON.stringify({
    timestamp,
    version: '1.0',
    data,
  }, null, 2)
}

/**
 * 从 JSON 导入数据
 */
export function importAllData(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { success: false, message: '无效的数据格式' }
    }

    let importedCount = 0
    const errors: string[] = []

    Object.entries(parsed.data).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        importedCount++
      } catch (error) {
        const errorMsg = `导入 ${key} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    })

    // 触发更新事件
    window.dispatchEvent(new Event('links-updated'))
    window.dispatchEvent(new Event('question-types-updated'))
    window.dispatchEvent(new Event('audit-logs-updated'))

    const message = errors.length > 0
      ? `已导入 ${importedCount} 项数据，${errors.length} 项失败`
      : `成功导入 ${importedCount} 项数据`

    return { success: true, message }
  } catch (error) {
    return {
      success: false,
      message: `解析数据失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * 下载数据检查报告
 */
export function downloadDataReport(): void {
  const results = checkAllData()
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      exists: results.filter(r => r.exists).length,
      missing: results.filter(r => !r.exists).length,
      totalSize: results.reduce((sum, r) => sum + r.size, 0),
    },
  }

  const json = JSON.stringify(report, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `data-report_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


