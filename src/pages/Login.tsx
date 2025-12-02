import { useState, useMemo } from 'react'
import type React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Lock, User, AlertCircle, Home, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 生成验证码
  const captcha = useMemo(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    return { num1, num2, answer: num1 + num2 }
  }, [])
  
  const [currentCaptcha, setCurrentCaptcha] = useState(captcha)
  
  const refreshCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCurrentCaptcha({ num1, num2, answer: num1 + num2 })
    setCaptchaAnswer('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // 验证验证码
    if (parseInt(captchaAnswer) !== currentCaptcha.answer) {
      setError('验证码错误，请重新输入')
      refreshCaptcha()
      return
    }
    
    setIsSubmitting(true)

    const result = await login(username, password)
    setIsSubmitting(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message || '登录失败，请稍后重试')
      refreshCaptcha()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-primary-500/10">
            <img
              src="/logo-cube.jpg"
              alt="MIND CUBE Logo"
              className="w-12 h-12 rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-text">MIND CUBE 心理测评管理平台</h1>
          <p className="text-gray-600 mt-2">专业、便捷、可信赖的心理健康测评管理系统</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-muted/60">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">账号登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="请输入用户名"
                  required
                  disabled={isSubmitting || isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="请输入密码"
                  required
                  disabled={isSubmitting || isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="input"
                    placeholder="计算结果"
                    required
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="text-gray-700 font-medium">
                    {currentCaptcha.num1} + {currentCaptcha.num2} =
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isSubmitting || isLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </button>
          </form>

        </div>

        {/* 辅助链接 */}
        <div className="mt-6 space-y-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>回到主页</span>
          </Link>
          <div className="text-center text-sm text-gray-600">
            还没有账号？
            <Link to="/register" className="text-secondary-600 hover:underline ml-1">
              立即注册
            </Link>
          </div>
        </div>

        {/* 页脚 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025 MIND CUBE 心理测评管理平台. 保留所有权利.
        </p>
      </div>
    </div>
  )
}




