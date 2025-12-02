import { useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Users, Trash2, ShieldCheck, UserMinus, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatNumber, formatCurrency } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useInputDialog } from '@/components/InputDialog'

const statusStyles: Record<'active' | 'disabled', string> = {
  active: 'bg-successLight text-success border border-success/30',
  disabled: 'bg-dangerLight text-danger border-danger/30',
}

export default function UserManagement() {
  const navigate = useNavigate()
  const { user, accounts, clearCustomUsers, updateUserStatus, updateUserQuota } = useAuth()
  const { showConfirm, showAlert, DialogComponent } = useConfirmDialog()
  const { showInput, InputDialogComponent } = useInputDialog()

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const customAccounts = useMemo(() => accounts.filter((acc) => !acc.isDefault), [accounts])

  const handleToggleStatus = async (accountId: string, currentStatus: 'active' | 'disabled') => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active'
    const confirmed = await showConfirm(
      '确认操作',
      `确定要将用户状态更新为"${nextStatus === 'active' ? '启用' : '禁用'}"吗？`
    )
    if (confirmed) {
      updateUserStatus(accountId, nextStatus)
      await showAlert('操作成功', `用户状态已更新为"${nextStatus === 'active' ? '启用' : '禁用'}"`, 'success')
    }
  }

  const handleClear = async () => {
    if (customAccounts.length === 0) {
      await showAlert('提示', '当前没有注册用户可清理', 'info')
      return
    }
    const confirmed = await showConfirm(
      '确认清理',
      '确定要清理所有注册用户数据吗？此操作无法恢复。',
      { destructive: true }
    )
    if (confirmed) {
      clearCustomUsers()
      await showAlert('清理成功', '已清空注册用户数据', 'success')
    }
  }

  const handleAddQuota = async (accountId: string, accountUsername: string, accountRole: 'admin' | 'user') => {
    if (accountRole === 'admin') {
      await showAlert('提示', '管理员账号额度为无限，无需添加额度', 'info')
      return
    }

    const input = await showInput('添加额度', {
      message: `为用户 "${accountUsername}" 添加额度`,
      placeholder: '请输入要添加的额度数量',
      type: 'number',
      defaultValue: '',
      confirmText: '确认添加',
      cancelText: '取消',
      validate: (value) => {
        const num = Number(value)
        if (!value.trim()) {
          return '请输入额度数量'
        }
        if (Number.isNaN(num) || num <= 0) {
          return '请输入大于0的数字'
        }
        if (!Number.isInteger(num)) {
          return '请输入整数'
        }
        return null
      },
    })

    if (input !== null && input !== '') {
      const amount = parseInt(input, 10)
      updateUserQuota(accountId, amount)
      await showAlert('操作成功', `已为用户 "${accountUsername}" 添加 ${formatNumber(amount)} 条额度`, 'success')
    }
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      {InputDialogComponent}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">用户管理</h1>
          <p className="text-gray-600 mt-2">管理员可查看所有账号的状态并管理注册用户数据</p>
        </div>
        <button onClick={handleClear} className="btn-secondary flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          清理注册用户数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">账号总数</p>
          <p className="text-3xl font-bold text-text mt-2">{accounts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">注册用户</p>
          <p className="text-3xl font-bold text-secondary-600 mt-2">{customAccounts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">默认账号</p>
          <p className="text-3xl font-bold text-gray-600 mt-2">{accounts.length - customAccounts.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text flex items-center gap-2">
            <Users className="w-5 h-5" />
            用户列表
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted text-text text-sm">
                <th className="text-left py-3 px-4 font-semibold">用户名</th>
                <th className="text-left py-3 px-4 font-semibold">邮箱</th>
                <th className="text-left py-3 px-4 font-semibold">角色</th>
                <th className="text-left py-3 px-4 font-semibold">类型</th>
                <th className="text-left py-3 px-4 font-semibold">累计总额度</th>
                <th className="text-left py-3 px-4 font-semibold">累计使用额度</th>
                <th className="text-left py-3 px-4 font-semibold">剩余额度</th>
                <th className="text-left py-3 px-4 font-semibold">状态</th>
                <th className="text-left py-3 px-4 font-semibold">创建时间</th>
                <th className="text-left py-3 px-4 font-semibold">最近一次在线日期</th>
                <th className="text-left py-3 px-4 font-semibold">累计充值金额</th>
                <th className="text-left py-3 px-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/admin/users/${account.id}`)}
                >
                  <td className="py-3 px-4 font-medium text-text">{account.username}</td>
                  <td className="py-3 px-4 text-gray-600">{account.email}</td>
                  <td className="py-3 px-4">{account.role === 'admin' ? '管理员' : '普通用户'}</td>
                  <td className="py-3 px-4">{account.isDefault ? '系统内置' : '注册用户'}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {account.role === 'admin' ? (
                      <span className="text-primary-600 font-semibold">无限</span>
                    ) : (
                      `${formatNumber(account.totalQuota || account.remainingQuota || 0)} 条`
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {account.role === 'admin' ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      `${formatNumber(account.totalUsedQuota || 0)} 条`
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {account.role === 'admin' ? (
                      <span className="text-primary-600 font-semibold">无限</span>
                    ) : (
                      `${formatNumber(account.remainingQuota ?? 0)} 条`
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[account.status]}`}>
                      {account.status === 'active' ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {formatDate(account.createdAt, 'yyyy-MM-dd')}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {account.lastLoginAt ? formatDate(account.lastLoginAt, 'yyyy-MM-dd HH:mm') : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">
                    {formatCurrency(account.totalRecharge || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddQuota(account.id, account.username, account.role)}
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={account.role === 'admin' ? '管理员账号额度为无限' : '添加额度'}
                        disabled={account.role === 'admin'}
                      >
                        <Plus className="w-4 h-4" />
                        添加额度
                      </button>
                      {!account.isDefault && (
                        <button
                          onClick={() => handleToggleStatus(account.id, account.status)}
                          className={`flex items-center gap-1 text-sm ${
                            account.status === 'active'
                              ? 'text-danger hover:text-danger/80'
                              : 'text-success hover:text-success/80'
                          }`}
                        >
                          {account.status === 'active' ? (
                            <>
                              <UserMinus className="w-4 h-4" />
                              禁用
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              启用
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}






