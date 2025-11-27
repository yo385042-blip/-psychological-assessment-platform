import { useState } from 'react'
import { MessageSquare, Bug, Lightbulb, Heart, Database, Plus, HelpCircle, Award } from 'lucide-react'
import { Feedback as FeedbackType } from '@/types'
import { mockFeedbacks } from '@/data/mockData'
import { formatDate } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'

const feedbackTypes = [
  { value: 'bug', label: 'Bug报告', icon: Bug, color: 'bg-red-100 text-red-800' },
  { value: 'feature', label: '功能建议', icon: Lightbulb, color: 'bg-blue-100 text-blue-800' },
  { value: 'experience', label: '体验反馈', icon: Heart, color: 'bg-purple-100 text-purple-800' },
  { value: 'data', label: '数据问题', icon: Database, color: 'bg-yellow-100 text-yellow-800' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-800' },
  reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-800' },
  accepted: { label: '已采纳', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  completed: { label: '已完成', color: 'bg-purple-100 text-purple-800' },
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>(mockFeedbacks)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'feature' as FeedbackType['type'],
    title: '',
    content: '',
  })
  const { showAlert, DialogComponent } = useConfirmDialog()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newFeedback: FeedbackType = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setFeedbacks(prev => [newFeedback, ...prev])
    setFormData({ type: 'feature', title: '', content: '' })
    setShowForm(false)
    await showAlert('提交成功', '反馈提交成功！我们会尽快处理。', 'success')
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">反馈建议</h1>
          <p className="text-gray-600 mt-2">提交问题和建议，帮助我们改进平台。被采纳的建议将获得额度奖励！</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          提交反馈
        </button>
      </div>

      {/* 反馈类型说明 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {feedbackTypes.map((type) => {
          const Icon = type.icon
          return (
            <div key={type.value} className={`card ${type.color} border-2`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold text-sm">{type.label}</h3>
              </div>
              <p className="text-xs opacity-90">
                {type.value === 'bug' && '报告功能异常、系统错误等'}
                {type.value === 'feature' && '提出新功能需求或优化建议'}
                {type.value === 'experience' && '分享使用体验和改进建议'}
                {type.value === 'data' && '反馈测评数据准确性等问题'}
              </p>
            </div>
          )
        })}
      </div>

      {/* 提交表单 */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">提交反馈</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                反馈类型
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as FeedbackType['type'] })}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="请输入反馈标题"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细内容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[120px]"
                placeholder="请详细描述您的问题或建议..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                提交反馈
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 反馈列表 */}
      <div className="space-y-4">
        {feedbacks.map((feedback) => {
          const typeConfig = feedbackTypes.find(t => t.value === feedback.type)
          const TypeIcon = typeConfig?.icon || MessageSquare

          return (
            <div key={feedback.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${typeConfig?.color || 'bg-gray-100'}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{feedback.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[feedback.status].color}`}>
                        {statusConfig[feedback.status].label}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{feedback.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(feedback.createdAt)}</span>
                      {feedback.reward && (
                        <span className="text-green-600 font-medium">
                          奖励：{feedback.reward} 额度
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 奖励说明 */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-3">奖励机制</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="font-medium">额度奖励</p>
                    <p className="text-xs text-green-700 mt-1">被采纳的建议将获得50-500额度奖励</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="font-medium">贡献记录</p>
                    <p className="text-xs text-green-700 mt-1">记录您的所有贡献历史</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="font-medium">等级体系</p>
                    <p className="text-xs text-green-700 mt-1">根据贡献度提升用户等级</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="font-medium">特别致谢</p>
                    <p className="text-xs text-green-700 mt-1">对重要贡献者公开致谢</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 反馈指南 */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">反馈指南</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">如何写好反馈？</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                  <li>详细描述问题或建议的具体内容</li>
                  <li>提供可复现的步骤（Bug报告）</li>
                  <li>说明期望的改进效果</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">反馈处理流程</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                  <li>1-2个工作日内审核</li>
                  <li>评估可行性后给予反馈</li>
                  <li>采纳后发放奖励</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

