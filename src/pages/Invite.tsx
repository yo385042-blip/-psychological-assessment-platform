import { Copy, Users, Gift, TrendingUp, Share2, QrCode, HelpCircle, Award, Info, Link as LinkIcon } from 'lucide-react'
import { mockInvite } from '@/data/mockData'
import { formatNumber } from '@/utils/formatters'

export default function Invite() {
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板！')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">邀请推广</h1>
        <p className="text-gray-600 mt-2">邀请新用户注册，获得持续收益。每邀请一位用户，即可获得其购买额度的30%作为奖励！</p>
      </div>

      {/* 推广优势 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-900">高额返佣</h3>
          </div>
          <p className="text-sm text-primary-800">30%返佣比例，行业领先</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">持续收益</h3>
          </div>
          <p className="text-sm text-green-800">被邀请用户每次购买都有收益</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">多级奖励</h3>
          </div>
          <p className="text-sm text-purple-800">支持多级分销奖励机制</p>
        </div>
      </div>

      {/* 推广概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 rounded-lg">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">累计邀请</div>
              <div className="text-3xl font-bold mt-1">{mockInvite.totalInvited}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">累计收益</div>
              <div className="text-3xl font-bold mt-1 text-green-600">
                {formatNumber(mockInvite.totalReward)}
              </div>
              <div className="text-xs text-gray-500 mt-1">额度</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">本月收益</div>
              <div className="text-3xl font-bold mt-1 text-purple-600">450</div>
              <div className="text-xs text-gray-500 mt-1">额度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 推广链接 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">我的邀请链接</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀请码
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mockInvite.inviteCode}
                readOnly
                className="input bg-gray-50"
              />
              <button
                onClick={() => handleCopy(mockInvite.inviteCode)}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀请链接
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mockInvite.inviteUrl}
                readOnly
                className="input bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => handleCopy(mockInvite.inviteUrl)}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Copy className="w-4 h-4" />
                复制链接
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button className="btn-primary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              分享到社交媒体
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              生成二维码
            </button>
          </div>
        </div>
      </div>

      {/* 收益规则 */}
      <div className="card bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-4">收益规则详解</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">直接邀请奖励</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">被邀请者首单购买额的 30%</p>
                <p className="text-xs text-gray-500">例如：被邀请者购买500额度套餐，您获得150额度</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">持续收益</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">被邀请者后续所有购买的 30%</p>
                <p className="text-xs text-gray-500">每笔订单都有收益，长期有效</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900">多级奖励</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">支持多级分销奖励机制</p>
                <p className="text-xs text-gray-500">被邀请者再邀请他人，您也有收益</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">收益上限</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">可设置单日或单月收益上限</p>
                <p className="text-xs text-gray-500">保护系统稳定，合理分配资源</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 推广技巧 */}
      <div className="card bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-3">推广技巧</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  社交媒体推广
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                  <li>在微信、QQ群分享邀请链接</li>
                  <li>制作推广海报吸引用户</li>
                  <li>撰写推荐文案突出优势</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  精准推广
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                  <li>向有测评需求的用户推荐</li>
                  <li>与企业HR、学校老师合作</li>
                  <li>建立长期合作关系</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  线下推广
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                  <li>使用二维码方便扫码注册</li>
                  <li>在展会上展示推广二维码</li>
                  <li>打印推广海报放置线下</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  口碑营销
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-700">
                  <li>分享平台使用体验</li>
                  <li>推荐给身边有需要的朋友</li>
                  <li>建立用户社群持续推广</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 推广工具 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">推广工具</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold mb-2">推广数据统计</h3>
            <p className="text-sm text-gray-600 mb-3">查看详细的推广数据和收益明细</p>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              查看详情 →
            </button>
          </div>
          <div className="p-4 border rounded-lg hover:border-primary-500 transition-colors">
            <h3 className="font-semibold mb-2">推广素材</h3>
            <p className="text-sm text-gray-600 mb-3">下载推广海报、文案等素材</p>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              下载素材 →
            </button>
          </div>
        </div>
      </div>

      {/* 邀请记录 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">邀请记录</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">被邀请人</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">注册时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">累计购买</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">我的收益</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">用户***</td>
                <td className="py-3 px-4 text-gray-600">2024-01-15</td>
                <td className="py-3 px-4 text-gray-600">500 额度</td>
                <td className="py-3 px-4 text-green-600 font-medium">150 额度</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">用户***</td>
                <td className="py-3 px-4 text-gray-600">2024-01-12</td>
                <td className="py-3 px-4 text-gray-600">1000 额度</td>
                <td className="py-3 px-4 text-green-600 font-medium">300 额度</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

