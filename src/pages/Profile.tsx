import { useState } from 'react'
import { User, Mail, Calendar, Save, Edit2, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/formatters'

export default function Profile() {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  if (!user) return null

  const handleSave = () => {
    // 这里应该调用API更新用户信息
    alert('用户信息已更新')
    setIsEditing(false)
  }

  const handlePasswordSave = () => {
    setPasswordError('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('请填写完整信息')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('新密码至少8位')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    // 这里应该调用API修改密码
    alert('密码已更新')
    setIsChangingPassword(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
        <p className="text-gray-600 mt-2">管理您的账户信息和偏好设置</p>
      </div>

      {/* 基本信息卡片 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">基本信息</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* 头像 */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-secondary-50 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-secondary-600" />
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-secondary-600 text-white rounded-full hover:bg-secondary-700">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
            <div>
              <p className="text-sm text-gray-600">头像</p>
              <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式，最大 2MB</p>
            </div>
          </div>

          {/* 用户信息表单 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                用户名
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{user.name}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                邮箱
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{user.email}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                账号
              </label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-500">{user.username}</div>
              <p className="text-xs text-gray-500 mt-1">账号不可修改</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                注册时间
              </label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-500">
                {formatDate(user.createdAt, 'yyyy-MM-dd')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-secondary-50 text-secondary-600 border border-secondary-200' 
                    : 'bg-muted text-text'
                }`}>
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4 border-t">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                保存更改
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ name: user.name, email: user.email })
                }}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 账户安全 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">账户安全</h2>
        <div className="space-y-4">
          <div className="p-4 border border-muted rounded-lg space-y-4">
            <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">修改密码</h3>
              <p className="text-sm text-gray-500 mt-1">定期更改密码以保护账户安全</p>
            </div>
              {!isChangingPassword && (
                <button className="btn-secondary" onClick={() => setIsChangingPassword(true)}>
                  修改
                </button>
              )}
            </div>
            {isChangingPassword && (
              <div className="space-y-3">
                {passwordError && (
                  <div className="text-sm text-danger bg-dangerLight/60 border border-dangerLight text-left px-3 py-2 rounded-lg">
                    {passwordError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="password"
                    placeholder="当前密码"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="新密码（至少8位）"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="确认新密码"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handlePasswordSave} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存密码
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordError('')
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                    }}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4 border border-muted rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">退出登录</h3>
              <p className="text-sm text-gray-500 mt-1">安全退出当前账户</p>
            </div>
            <button onClick={logout} className="btn-secondary">
              退出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




