import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { apiClient } from '@/services/api/client'
import toast from 'react-hot-toast'

export default function Payment() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [orderStatus, setOrderStatus] = useState<'pending' | 'success' | 'failed' | null>(null)
  const [orderInfo, setOrderInfo] = useState<any>(null)

  const questionnaireType = searchParams.get('qt') || searchParams.get('type') || ''
  const result = searchParams.get('result')
  const orderNo = searchParams.get('order')

  useEffect(() => {
    // 如果是从支付网关返回，查询订单状态
    if (result === 'return' && orderNo) {
      checkOrderStatus(orderNo)
    }
  }, [result, orderNo])

  const checkOrderStatus = async (outTradeNo: string) => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/payment/query?out_trade_no=${encodeURIComponent(outTradeNo)}`)
      
      if (response.success && response.data) {
        const order = response.data
        setOrderInfo(order)
        
        if (order.status === 'paid') {
          setOrderStatus('success')
          toast.success('支付成功！')
        } else if (order.status === 'failed') {
          setOrderStatus('failed')
          toast.error('支付失败')
        } else {
          setOrderStatus('pending')
        }
      } else {
        setOrderStatus('failed')
        toast.error('查询订单失败')
      }
    } catch (error: any) {
      console.error('查询订单失败:', error)
      setOrderStatus('failed')
      toast.error('查询订单失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!questionnaireType) {
      toast.error('请选择问卷类型')
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.post('/payment/create', {
        questionnaireType,
        money: 1,
        type: 'alipay', // 仅支持支付宝
      })

      if (response.success && response.data?.paymentUrl) {
        // 跳转到支付网关
        window.location.href = response.data.paymentUrl
      } else {
        toast.error(response.message || '创建支付订单失败')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('创建支付订单失败:', error)
      toast.error(error.message || '创建支付订单失败')
      setLoading(false)
    }
  }

  // 支付成功页面
  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">支付成功！</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            您的订单已支付成功，额度已到账
          </p>
          {orderInfo && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">订单号：</span>
                  <span className="text-gray-900 dark:text-white font-mono">{orderInfo.outTradeNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">支付金额：</span>
                  <span className="text-gray-900 dark:text-white">¥{orderInfo.money}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">问卷类型：</span>
                  <span className="text-gray-900 dark:text-white">{orderInfo.questionnaireType}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // 支付失败页面
  if (orderStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">支付失败</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            支付未完成，请重试
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setOrderStatus(null)
                setOrderInfo(null)
              }}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              重新支付
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 支付页面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">支付订单</h2>
          {questionnaireType && (
            <p className="text-gray-600 dark:text-gray-400">
              问卷类型：<span className="font-semibold">{questionnaireType}</span>
            </p>
          )}
        </div>

        {!questionnaireType && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">缺少问卷类型</p>
              <p>请从首页选择问卷类型后进入支付页面</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">支付金额</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">¥1.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">获得额度</span>
              <span className="text-gray-900 dark:text-white">1 个测试链接</span>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handlePayment}
            disabled={loading || !questionnaireType}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                支付宝支付
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
