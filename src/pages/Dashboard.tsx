import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Link as LinkIcon, BarChart3, TrendingUp, Activity, RefreshCw, Sparkles, CalendarRange, ArrowRight, Download } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import { mockDashboardStats } from '@/data/mockData'
import { formatNumber, formatPercentage } from '@/utils/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { exportDashboardToPDF } from '@/utils/export'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import ChartWrapper from '@/components/ChartWrapper'
import { useRealtimeData } from '@/utils/realtime'
import { getLinkStats } from '@/utils/links'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/LazyChart'

const chartPresets: Record<'7d' | '15d' | '30d', Array<{ name: string; 链接数: number; 使用率: number }>> = {
  '7d': [
  { name: '周一', 链接数: 45, 使用率: 0.78 },
  { name: '周二', 链接数: 52, 使用率: 0.82 },
  { name: '周三', 链接数: 48, 使用率: 0.75 },
  { name: '周四', 链接数: 61, 使用率: 0.88 },
  { name: '周五', 链接数: 55, 使用率: 0.85 },
  { name: '周六', 链接数: 40, 使用率: 0.72 },
    { name: '周日', 链接数: 38, 使用率: 0.7 },
  ],
  '15d': [
    { name: '第1-3天', 链接数: 150, 使用率: 0.74 },
    { name: '第4-6天', 链接数: 165, 使用率: 0.79 },
    { name: '第7-9天', 链接数: 172, 使用率: 0.81 },
    { name: '第10-12天', 链接数: 188, 使用率: 0.84 },
    { name: '第13-15天', 链接数: 205, 使用率: 0.87 },
  ],
  '30d': [
    { name: '第1周', 链接数: 280, 使用率: 0.74 },
    { name: '第2周', 链接数: 320, 使用率: 0.79 },
    { name: '第3周', 链接数: 360, 使用率: 0.83 },
    { name: '第4周', 链接数: 390, 使用率: 0.87 },
  ],
}

const liveMetrics = [
  { label: '测评完成率', value: 0.62, target: 0.75, status: '稳步提升', unit: 'percentage' as const },
  { label: '报告发送及时率', value: 0.9, target: 0.95, status: '保持稳定', unit: 'percentage' as const },
  { label: '平均答题时长', value: 18, target: 20, status: '保持在目标内', unit: 'minutes' as const },
]

const questionnaireSummary = [
  { type: 'SCL-90', participants: 328, completion: 0.86, avgTime: 18 },
  { type: 'MBTI', participants: 412, completion: 0.91, avgTime: 16 },
  { type: 'Holland', participants: 276, completion: 0.78, avgTime: 22 },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState<'7d' | '15d' | '30d'>('7d')
  const [refreshing, setRefreshing] = useState(false)
  const chartData = useMemo(() => chartPresets[timeframe], [timeframe])
  const { showAlert, DialogComponent } = useConfirmDialog()
  const axisColor = '#2D3748'
  const gridColor = '#E2E8F0'
  const lineStart = '#4A90E2'
  const lineEnd = '#1E3A5F'

  const { data: realtimeStats } = useRealtimeData(
    'dashboard-stats',
    () => {
      const linkStats = getLinkStats()
      return {
        ...mockDashboardStats,
        totalLinks: linkStats.total,
        usedLinks: linkStats.used,
        unusedLinks: linkStats.unused,
      }
    },
    { interval: 30000 }
  )

  const stats = realtimeStats || mockDashboardStats

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const handleExportPDF = () => {
    try {
      exportDashboardToPDF(stats, chartData)
      showAlert('导出成功', 'Dashboard数据已导出为PDF文件', 'success')
    } catch (error) {
      showAlert('导出失败', error instanceof Error ? error.message : '导出过程中出现错误', 'alert')
    }
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-600 mt-2">查看平台整体数据概览和实时监控</p>
      </div>
        <div className="flex flex-wrap gap-3">
          {(['7d', '15d', '30d'] as Array<'7d' | '15d' | '30d'>).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeframe(option)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                timeframe === option ? 'bg-primary-600 text-white border-primary-600' : 'border-muted text-text'
              }`}
            >
              {option === '7d' ? '最近 7 天' : option === '15d' ? '最近 15 天' : '最近 30 天'}
            </button>
          ))}
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl border border-muted text-text flex items-center gap-2 hover:border-primary-400"
            title="导出PDF报告"
          >
            <Download className="w-4 h-4" />
            导出PDF
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl border border-muted text-text flex items-center gap-2 hover:border-primary-400"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '刷新中' : '刷新数据'}
          </button>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="bg-white border border-primary-100 text-primary-700 rounded-3xl p-8 shadow-lg flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between overflow-hidden relative">
          <div className="space-y-4 max-w-2xl">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
              <Sparkles className="w-4 h-4" />
              智能协作 · 题库一键上线
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-primary-700">
              管理员工作台焕新升级
              <span className="block text-primary-400 text-lg font-normal mt-2">
                题库协作审核、实时监控、全链路可视化尽在此处
              </span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <RouterLink
                to="/admin/questions/import"
                className="btn-primary flex items-center gap-2"
              >
                前往题库导入
                <ArrowRight className="w-4 h-4" />
              </RouterLink>
              <RouterLink
                to="/links/generate"
                className="btn-secondary"
              >
                快速生成链接
              </RouterLink>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <svg viewBox="0 0 320 220" className="w-full drop-shadow">
              <defs>
                <linearGradient id="cardGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fdf2f8" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="barGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#fcd34d" />
                </linearGradient>
              </defs>
              <rect x="10" y="20" width="300" height="180" rx="24" fill="url(#cardGradientLight)" />
              <text x="40" y="60" fill="#c2410c" fontSize="16" fontWeight="600">
                数据概览
              </text>
              {[70, 110, 150].map((y, index) => (
                <g key={y}>
                  <rect x="40" y={y} width="220" height="18" rx="9" fill="#f3f4f6" />
                  <rect
                    x="40"
                    y={y}
                    width={160 - index * 30}
                    height="18"
                    rx="9"
                    fill="url(#barGradientLight)"
                  />
                </g>
              ))}
              <circle cx="250" cy="70" r="16" fill="#f472b6" opacity="0.25" />
              <circle cx="280" cy="120" r="10" fill="#fcd34d" opacity="0.35" />
            </svg>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="总链接个数"
          value={formatNumber(stats.totalLinks)}
          icon={LinkIcon}
          trend={{ value: 12, isPositive: true }}
          description="累计生成的测试链接总数"
        />
        <StatsCard
          title="剩余额度"
          value={formatNumber(stats.remainingQuota)}
          icon={BarChart3}
          description="当前可用测试链接额度"
        />
        <StatsCard
          title="今日使用"
          value={formatNumber(stats.todayUsedLinks)}
          icon={Activity}
          trend={{ value: 8, isPositive: true }}
          description="今天被使用的链接数量"
        />
        <StatsCard
          title="实时参与率"
          value={formatPercentage(stats.participationRate)}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          description="用户参与测评的实时比例"
        />
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-text">问卷使用概览</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">实时刷新</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-muted">
                <th className="py-2">问卷类型</th>
                <th className="py-2">参与人数</th>
                <th className="py-2">完成率</th>
                <th className="py-2">平均时长</th>
              </tr>
            </thead>
            <tbody>
              {questionnaireSummary.map((item) => {
                const width = Math.min(item.completion * 100, 100)
                const colorClass =
                  width >= 85
                    ? 'from-success to-success'
                    : width >= 70
                      ? 'from-warning to-warning'
                      : 'from-danger to-danger'
                return (
                  <tr key={item.type} className="border-b border-muted/50 hover:bg-muted/30 transition">
                    <td className="py-3 font-semibold text-text">{item.type}</td>
                    <td className="py-3 text-gray-600">{formatNumber(item.participants)} 人</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="text-text font-semibold">{formatPercentage(item.completion)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{item.avgTime} 分钟</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-text">链接使用趋势</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={lineStart} />
                    <stop offset="100%" stopColor={lineEnd} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: gridColor, backgroundColor: '#fff' }} />
                <Legend wrapperStyle={{ color: axisColor }} />
                <Line
                  type="monotone"
                  dataKey="链接数"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: lineStart, stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: lineEnd }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-text">参与率统计</h2>
          <ChartWrapper minHeight={320}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineStart} />
                    <stop offset="100%" stopColor={lineEnd} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
                <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                <Tooltip
                  formatter={(value: number | string) => formatPercentage(typeof value === 'number' ? value : Number(value))}
                  contentStyle={{ borderRadius: 12, borderColor: gridColor, backgroundColor: '#fff' }}
                />
                <Legend wrapperStyle={{ color: axisColor }} />
                <Bar dataKey="使用率" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">最近生成的链接</h2>
          <div className="space-y-3">
            {[
              { id: 1, type: 'SCL-90', time: '2小时前', status: '已使用' },
              { id: 2, type: 'MBTI', time: '5小时前', status: '未使用' },
              { id: 3, type: 'Holland', time: '1天前', status: '已使用' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.type}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === '已使用' 
                    ? 'bg-successLight text-success' 
                    : 'bg-muted text-text'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">最近完成测评</h2>
          <div className="space-y-3">
            {[
              { id: 1, type: 'SCL-90', score: 85, time: '1小时前' },
              { id: 2, type: 'MBTI', score: 92, time: '3小时前' },
              { id: 3, type: 'Holland', score: 78, time: '5小时前' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.type}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-secondary-600">{item.score}</p>
                  <p className="text-xs text-gray-500">分</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-text">实时运营追踪</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveMetrics.map((metric) => {
            const isPercentage = metric.unit === 'percentage'
            const currentValue = isPercentage ? formatPercentage(metric.value) : `${metric.value} 分钟`
            const targetValue = isPercentage ? formatPercentage(metric.target) : `${metric.target} 分钟`
            const progress = isPercentage
              ? Math.min((metric.value / metric.target) * 100, 100)
              : Math.min((metric.value / metric.target) * 100, 100)
            return (
              <div key={metric.label} className="border border-muted rounded-2xl p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-text">{metric.label}</p>
                  <span className="text-sm font-medium text-primary-600">{currentValue}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  目标 {targetValue} · {metric.status}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

