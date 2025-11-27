import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Calendar, Link as LinkIcon, BarChart3, TrendingUp, FileText } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatNumber, formatCurrency } from '@/utils/formatters'
import { loadAuditLogs } from '@/utils/audit'
import { loadLinks } from '@/utils/links'
import ChartWrapper from '@/components/ChartWrapper'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from '@/components/LazyChart'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, accounts } = useAuth()
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const targetAccount = useMemo(() => accounts.find(acc => acc.id === id), [accounts, id])

  if (!targetAccount) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/users')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回用户列表
        </button>
        <div className="card text-center py-12">
          <p className="text-gray-500">用户不存在</p>
        </div>
      </div>
    )
  }

  const userLogs = useMemo(() => {
    const logs = loadAuditLogs().filter(log => log.userId === id)
    const withDateFilter = logs.filter(log => {
      const timestamp = log.timestamp
      const afterStart = !dateRange.start || timestamp >= dateRange.start
      if (!dateRange.end) return afterStart
      const end = new Date(dateRange.end)
      end.setDate(end.getDate() + 1)
      return afterStart && timestamp < end.toISOString()
    })
    return withDateFilter.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [id, dateRange])

  const userLinks = useMemo(() => loadLinks().filter(link => link.createdBy === id), [id])

  const stats = useMemo(() => {
    const linksByStatus = {
      total: userLinks.length,
      unused: userLinks.filter(l => l.status === 'unused').length,
      used: userLinks.filter(l => l.status === 'used').length,
      expired: userLinks.filter(l => l.status === 'expired').length,
      disabled: userLinks.filter(l => l.status === 'disabled').length,
    }

    const actionsCount = userLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {})

    return {
      links: linksByStatus,
      actions: actionsCount,
      totalActions: userLogs.length,
    }
  }, [userLinks, userLogs])

  const quotaTrendData = useMemo(() => {
    const days = 30
    const now = new Date()
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLogs = userLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        return logDate === dateStr && log.action === '生成链接'
      })

      const quotaUsed = dayLogs.reduce((sum, log) => {
        const count = parseInt(log.target.match(/\d+/)?.[0] || '0', 10)
        return sum + count
      }, 0)

      data.push({ date: dateStr, quota: quotaUsed })
    }

    return data
  }, [userLogs])

  const linkGenerationTrendData = useMemo(() => {
    const days = 30
    const now = new Date()
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayLinks = userLinks.filter(link => {
        const linkDate = new Date(link.createdAt).toISOString().split('T')[0]
        return linkDate === dateStr
      })

      data.push({ date: dateStr, count: dayLinks.length })
    }

    return data
  }, [userLinks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/admin/users')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回用户列表
        </button>
      </div>

      <div className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{targetAccount.username}</h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{targetAccount.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>注册时间: {formatDate(targetAccount.createdAt)}</span>
              </div>
              {targetAccount.lastLoginAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>最近登录: {formatDate(targetAccount.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                targetAccount.role === 'admin' ? 'bg-purple-500/30 text-white' : 'bg-blue-500/30 text-white'
              }`}
            >
              {targetAccount.role === 'admin' ? '管理员' : '普通用户'}
            </span>
            <span
              className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                targetAccount.status === 'active' ? 'bg-green-500/30 text-white' : 'bg-red-500/30 text-white'
              }`}
            >
              {targetAccount.status === 'active' ? '正常' : '已禁用'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <LinkIcon className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">生成的链接</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.links.total}</p>
          <p className="text-sm text-gray-500 mt-1">已使用: {stats.links.used} / 未使用: {stats.links.unused}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">操作记录</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalActions}</p>
          <p className="text-sm text-gray-500 mt-1">总操作次数</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">累计总额度</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {targetAccount.role === 'admin' ? '∞' : formatNumber(targetAccount.totalQuota || targetAccount.remainingQuota || 0)}
          </p>
          {targetAccount.role !== 'admin' && (
            <p className="text-sm text-gray-500 mt-1">已使用: {formatNumber(targetAccount.totalUsedQuota || 0)}</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">剩余额度</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {targetAccount.role === 'admin' ? '∞' : formatNumber(targetAccount.remainingQuota || 0)}
          </p>
          {targetAccount.totalRecharge && (
            <p className="text-sm text-gray-500 mt-1">累计充值: {formatCurrency(targetAccount.totalRecharge)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">额度使用趋势（最近30天）</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={quotaTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string | number) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value: string | number) =>
                    formatDate(typeof value === 'number' ? new Date(value).toISOString() : value)
                  }
                  formatter={(value: number | string) => [`${value} 条`, '使用额度']}
                />
                <Legend />
                <Area type="monotone" dataKey="quota" stroke="#4A6CF7" fill="#4A6CF7" fillOpacity={0.6} name="使用额度" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">链接生成趋势（最近30天）</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={linkGenerationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string | number) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value: string | number) =>
                    formatDate(typeof value === 'number' ? new Date(value).toISOString() : value)
                  }
                  formatter={(value: number | string) => [`${value} 个`, '生成数量']}
                />
                <Legend />
                <Bar dataKey="count" fill="#10B981" name="生成数量" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">操作历史</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input text-sm py-1.5"
              placeholder="开始日期"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input text-sm py-1.5"
              placeholder="结束日期"
            />
            {(dateRange.start || dateRange.end) && (
              <button onClick={() => setDateRange({ start: '', end: '' })} className="text-xs text-primary-600 hover:text-primary-700">
                清除
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">目标</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">类型</th>
              </tr>
            </thead>
            <tbody>
              {userLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(log.timestamp)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{log.target}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{log.targetType}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userLogs.length === 0 && <div className="text-center py-12 text-gray-500">暂无操作记录</div>}
        {userLogs.length > 50 && (
          <div className="mt-4 text-center text-sm text-gray-500">仅显示最近50条记录，共 {userLogs.length} 条</div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">生成的链接</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">链接URL</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">问卷类型</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">生成时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">使用时间</th>
              </tr>
            </thead>
            <tbody>
              {userLinks.slice(0, 20).map((link) => (
                <tr key={link.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="text-sm text-gray-800 font-mono break-all">{link.url}</code>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{link.questionnaireType}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        link.status === 'used'
                          ? 'bg-green-100 text-green-700'
                          : link.status === 'unused'
                            ? 'bg-gray-100 text-gray-700'
                            : link.status === 'expired'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {link.status === 'used' ? '已使用' : link.status === 'unused' ? '未使用' : link.status === 'expired' ? '已过期' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(link.createdAt)}</td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{link.usedAt ? formatDate(link.usedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userLinks.length === 0 && <div className="text-center py-12 text-gray-500">暂无生成的链接</div>}

        {userLinks.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            仅显示最近20条链接，共 {userLinks.length} 条
            <button
              onClick={() => navigate('/links/manage', { state: { createdBy: id } })}
              className="ml-2 text-primary-600 hover:text-primary-700"
            >
              查看全部 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}







