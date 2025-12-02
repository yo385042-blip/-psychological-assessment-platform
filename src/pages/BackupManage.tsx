/**
 * 数据备份管理页面
 * 创建、管理和恢复数据备份
 */

import { useState, useEffect, useCallback } from 'react'
import { Download, Upload, Trash2, RefreshCw, Database, Clock, HardDrive, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  loadBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  exportBackupAsJSON,
  importBackupFromJSON,
  BackupData,
} from '@/utils/backup'
import { formatDate, formatFileSize } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { addAuditLog } from '@/utils/audit'
import { checkAllData, exportAllData, downloadDataReport, DataCheckResult } from '@/utils/dataRecovery'

export default function BackupManage() {
  const { user } = useAuth()
  const [backups, setBackups] = useState<BackupData[]>([])
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  const [dataCheckResults, setDataCheckResults] = useState<DataCheckResult[]>([])
  const [showDataCheck, setShowDataCheck] = useState(false)
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const refreshBackups = useCallback(() => {
    setBackups(loadBackups())
  }, [])

  const handleCheckData = useCallback(() => {
    const results = checkAllData()
    setDataCheckResults(results)
    setShowDataCheck(true)
  }, [])

  const handleExportAllData = useCallback(() => {
    try {
      const json = exportAllData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all-data-backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showAlert('导出成功', '所有数据已导出为JSON文件', 'success')
    } catch (error) {
      showAlert('导出失败', error instanceof Error ? error.message : '导出过程中出现错误', 'alert')
    }
  }, [showAlert])

  useEffect(() => {
    refreshBackups()
  }, [refreshBackups])

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      await showAlert('提示', '请输入备份名称', 'warning')
      return
    }

    try {
      const backup = createBackup(backupName.trim(), backupDescription.trim() || undefined)
      refreshBackups()
      setBackupName('')
      setBackupDescription('')
      
      // 记录操作日志
      addAuditLog({
        userId: user.id,
        username: user.name,
        action: '创建备份',
        target: backup.name,
        targetType: 'system',
        details: { backupId: backup.id },
      })

      await showAlert('备份成功', `已创建备份：${backup.name}`, 'success')
    } catch (error) {
      await showAlert('备份失败', error instanceof Error ? error.message : '创建备份时出错', 'alert')
    }
  }

  const handleRestore = async (backup: BackupData) => {
    const confirmed = await showConfirm(
      '确认恢复',
      `确定要恢复备份"${backup.name}"吗？这将覆盖当前所有数据，此操作无法撤销！`,
      { destructive: true, confirmText: '确认恢复' }
    )

    if (confirmed) {
      try {
        const result = restoreBackup(backup.id)
        if (result.success) {
          // 记录操作日志
          addAuditLog({
            userId: user.id,
            username: user.name,
            action: '恢复备份',
            target: backup.name,
            targetType: 'system',
            details: { backupId: backup.id },
          })

          await showAlert('恢复成功', result.message, 'success')
          // 刷新页面以确保数据同步
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          await showAlert('恢复失败', result.message, 'alert')
        }
      } catch (error) {
        await showAlert('恢复失败', error instanceof Error ? error.message : '恢复备份时出错', 'alert')
      }
    }
  }

  const handleDelete = async (backup: BackupData) => {
    const confirmed = await showConfirm(
      '确认删除',
      `确定要删除备份"${backup.name}"吗？此操作无法撤销。`,
      { destructive: true }
    )

    if (confirmed) {
      const success = deleteBackup(backup.id)
      if (success) {
        refreshBackups()
        await showAlert('删除成功', '备份已删除', 'success')
      } else {
        await showAlert('删除失败', '备份不存在或已被删除', 'alert')
      }
    }
  }

  const handleExport = (backup: BackupData) => {
    try {
      exportBackupAsJSON(backup)
      showAlert('导出成功', '备份已导出为JSON文件', 'success')
    } catch (error) {
      showAlert('导出失败', error instanceof Error ? error.message : '导出过程中出现错误', 'alert')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const backup = await importBackupFromJSON(file)
      refreshBackups()
      await showAlert('导入成功', `已导入备份：${backup.name}`, 'success')
    } catch (error) {
      await showAlert('导入失败', error instanceof Error ? error.message : '导入备份文件时出错', 'alert')
    }

    // 清空文件输入
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      {DialogComponent}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">数据备份管理</h1>
        <p className="text-gray-600 mt-2">创建、管理和恢复系统数据备份</p>
      </div>

      {/* 数据检查 */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              数据检查工具
            </h2>
            <p className="text-sm text-yellow-800">检查数据是否丢失，导出所有数据进行备份</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCheckData}
              className="btn-secondary flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              检查数据
            </button>
            <button
              onClick={handleExportAllData}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出所有数据
            </button>
            <button
              onClick={downloadDataReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载检查报告
            </button>
          </div>
        </div>

        {showDataCheck && dataCheckResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-semibold text-yellow-900 mb-2">数据检查结果：</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dataCheckResults.map((result) => (
                <div
                  key={result.key}
                  className={`p-3 rounded-lg border ${
                    result.exists
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.exists ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{result.key}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {result.exists ? (
                        <>
                          {result.itemCount !== undefined ? `${result.itemCount} 项` : '有数据'} • {formatFileSize(result.size)}
                        </>
                      ) : (
                        '无数据'
                      )}
                    </div>
                  </div>
                  {result.error && (
                    <div className="text-xs text-red-600 mt-1">错误: {result.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 创建备份 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-600" />
          创建新备份
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备份名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="例如：数据备份_2024-01-15"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备份说明（可选）
            </label>
            <textarea
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              placeholder="描述本次备份的内容和用途"
              className="input min-h-[80px]"
              rows={3}
            />
          </div>
          <button
            onClick={handleCreateBackup}
            className="btn-primary flex items-center gap-2"
            disabled={!backupName.trim()}
          >
            <Database className="w-4 h-4" />
            创建备份
          </button>
        </div>
      </div>

      {/* 备份列表 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary-600" />
            备份列表 ({backups.length})
          </h2>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            导入备份
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>暂无备份数据</p>
            <p className="text-sm mt-2">创建备份以保护您的数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{backup.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700">
                        v{backup.version}
                      </span>
                    </div>
                    {backup.description && (
                      <p className="text-sm text-gray-600 mb-3">{backup.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(backup.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {formatFileSize(backup.size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleRestore(backup)}
                      className="btn-primary text-sm flex items-center gap-1"
                      title="恢复备份"
                    >
                      <RefreshCw className="w-4 h-4" />
                      恢复
                    </button>
                    <button
                      onClick={() => handleExport(backup)}
                      className="btn-secondary text-sm flex items-center gap-1"
                      title="导出备份"
                    >
                      <Download className="w-4 h-4" />
                      导出
                    </button>
                    <button
                      onClick={() => handleDelete(backup)}
                      className="btn-secondary text-sm flex items-center gap-1 text-danger hover:bg-dangerLight"
                      title="删除备份"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 备份说明 */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">备份说明</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>备份包含：链接数据、用户数据、问卷数据、操作日志</li>
          <li>建议定期创建备份，确保数据安全</li>
          <li>恢复备份会覆盖当前所有数据，请谨慎操作</li>
          <li>可以导出备份为JSON文件，用于迁移或存档</li>
        </ul>
      </div>
    </div>
  )
}

