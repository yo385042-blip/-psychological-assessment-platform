import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Search, Filter, Copy, Download, RefreshCw, Trash2, CheckSquare, Square, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

import { Link, LinkStatus } from '@/types'
import { loadLinks, getLinkStats, batchDeleteLinks, batchUpdateLinkStatus, deleteLink } from '@/utils/links'
import { formatDate } from '@/utils/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'

const statusConfig: Record<LinkStatus, { label: string; badge: string }> = {
  unused: { label: '未使用', badge: 'bg-muted text-text' },
  used: { label: '已使用', badge: 'bg-successLight text-success' },
  expired: { label: '已过期', badge: 'bg-dangerLight text-danger' },
  disabled: { label: '已禁用', badge: 'bg-warningLight text-warning' },
}

const PAGE_SIZE = 12

export default function LinksManage() {
  const { accounts } = useAuth()
  const { showConfirm, DialogComponent } = useConfirmDialog()

  const [links, setLinks] = useState<Link[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LinkStatus | 'all'>('all')
  const [createdBy, setCreatedBy] = useState('')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState(() => getLinkStats())

  const refresh = useCallback(() => {
    const loaded = loadLinks()
    setLinks(loaded)
    setStats(getLinkStats())
    setSelected([])
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('links-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('links-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  const filtered = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        searchTerm === '' ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.questionnaireType.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || link.status === statusFilter
      const matchesCreator = createdBy === '' || link.createdBy === createdBy
      return matchesSearch && matchesStatus && matchesCreator
    })
  }, [links, searchTerm, statusFilter, createdBy])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, createdBy])

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selected.length === paged.length) {
      setSelected([])
    } else {
      setSelected(paged.map((link) => link.id))
    }
  }

  const confirmDelete = async (ids: string[]) => {
    const ok = await showConfirm('删除链接', `确认删除选中的 ${ids.length} 个链接吗？`, {
      confirmText: '删除',
    })
    if (!ok) return
    const deleted = ids.length === 1 ? deleteLink(ids[0]) : batchDeleteLinks(ids)
    if (deleted) {
      toast.success('删除成功')
      refresh()
    } else {
      toast.error('删除失败，请稍后再试')
    }
  }

  const changeStatus = (status: LinkStatus, ids: string[]) => {
    const count = batchUpdateLinkStatus(ids, status)
    if (count > 0) {
      toast.success(`已更新 ${count} 个链接状态`)
      refresh()
    }
  }

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error('没有可导出的数据')
      return
    }
    const header = '链接,问卷类型,状态,生成时间,使用时间,报告ID'
    const rows = filtered.map((link) =>
      [
        link.url,
        link.questionnaireType,
        statusConfig[link.status].label,
        formatDate(link.createdAt),
        link.usedAt ? formatDate(link.usedAt) : '-',
        link.reportId ?? '-',
      ].join(','),
    )
    const blob = new Blob([`${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `链接列表_${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {DialogComponent}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">链接管理</h1>
        <p className="text-gray-600">管理所有生成的测试链接，查看使用状态和报告详情。</p>
      </header>

      {/* 顶部功能模块卡片：快速搜索 / 状态筛选 / 报告查看 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">快速搜索</p>
            <p className="text-xs text-gray-500 mt-1">支持按链接、问卷类型等条件快速查找。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-successLight/20 text-success">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">状态筛选</p>
            <p className="text-xs text-gray-500 mt-1">按状态、创建者等条件一键筛选链接。</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">报告查看</p>
            <p className="text-xs text-gray-500 mt-1">直接查看测试结果和详细报告。</p>
          </div>
        </div>
      </section>

      {/* 搜索 & 筛选区 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索链接URL或问卷类型..."
            suggestions={links.slice(0, 5).map((link) => link.questionnaireType)}
          />
          <div className="flex gap-2 flex-wrap">
            <label className="input flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LinkStatus | 'all')}
                className="bg-transparent flex-1 outline-none"
              >
                <option value="all">全部状态</option>
                <option value="unused">未使用</option>
                <option value="used">已使用</option>
                <option value="expired">已过期</option>
                <option value="disabled">已禁用</option>
              </select>
            </label>
            <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} className="input">
              <option value="">全部创建者</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username}
                </option>
              ))}
            </select>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
            <button onClick={refresh} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          共 {filtered.length} 条结果
          {selected.length > 0 && <span className="ml-2 text-primary-600">已选择 {selected.length} 条</span>}
        </p>
      </section>

      {selected.length > 0 && (
        <section className="rounded-2xl border border-primary-200 bg-primary-50 p-4 shadow-sm flex flex-wrap items-center gap-3">
          <span className="font-medium text-primary-900">批量操作：</span>
          <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => changeStatus('unused', selected)}>
            <CheckSquare className="w-4 h-4" /> 设为未使用
          </button>
          <button className="btn-secondary text-sm flex items-center gap-1" onClick={() => changeStatus('disabled', selected)}>
            <Square className="w-4 h-4" /> 禁用
          </button>
          <button
            className="btn-secondary text-sm flex items-center gap-1 text-danger hover:bg-dangerLight"
            onClick={() => confirmDelete(selected)}
          >
            <Trash2 className="w-4 h-4" /> 删除
          </button>
          <button className="text-sm text-primary-600" onClick={() => setSelected([])}>
            取消选择
          </button>
        </section>
      )}

      {/* 链接列表表格 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto dark:border-gray-700 dark:bg-gray-900">
        {paged.length === 0 ? (
          <EmptyState
            title="暂无链接"
            description="还没有生成过测试链接，点击“链接生成”即可创建。"
            action={
              <RouterLink className="btn-primary" to="/links/generate">
                去生成
              </RouterLink>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-left text-gray-500">
                <th className="py-3 px-3 w-10">
                  <button onClick={toggleSelectAll} title="全选/取消">
                    {selected.length === paged.length && paged.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">链接</th>
                <th className="py-3 px-3">问卷类型</th>
                <th className="py-3 px-3">状态</th>
                <th className="py-3 px-3">生成时间</th>
                <th className="py-3 px-3">使用时间</th>
                <th className="py-3 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((link) => (
                <tr key={link.id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    <input type="checkbox" checked={selected.includes(link.id)} onChange={() => toggleSelect(link.id)} />
                  </td>
                  <td className="py-2 px-3">
                    <code className="text-xs break-all">{link.url}</code>
                  </td>
                  <td className="py-2 px-3">{link.questionnaireType}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[link.status].badge}`}>
                      {statusConfig[link.status].label}
                    </span>
                  </td>
                  <td className="py-2 px-3">{formatDate(link.createdAt)}</td>
                  <td className="py-2 px-3">{link.usedAt ? formatDate(link.usedAt) : '-'}</td>
                  <td className="py-2 px-3">
                    <div className="flex gap-3 justify-end text-primary-600">
                      <button onClick={() => navigator.clipboard.writeText(link.url)} title="复制链接">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          link.reportId ? window.open(`/reports/${link.reportId}`, '_blank') : toast('尚无报告')
                        }
                        title="查看报告"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirmDelete([link.id])} title="删除" className="text-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 底部统计卡片区 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">总链接数</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">已使用</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.used ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">未使用</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.unused ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">已过期</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.expired ?? 0}</p>
        </div>
      </section>

      {filtered.length > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalItems={filtered.length}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

