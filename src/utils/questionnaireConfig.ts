/**
 * 问卷配置工具
 * 统一管理问卷类型、上架状态等配置
 */

export interface QuestionnaireConfig {
  value: string
  label: string
  description: string
  features: string[]
  duration: string
  questions: string
  price: number
  isCustom?: boolean
}

export const SYSTEM_QUESTIONNAIRES: Omit<QuestionnaireConfig, 'isCustom'>[] = [
  { 
    value: 'SCL-90', 
    label: 'SCL-90 心理健康测评',
    description: '综合心理健康症状自评量表，评估9个心理症状维度',
    features: ['90个题目', '9个评估维度', '专业报告解读', '适合个人自查'],
    duration: '约15-20分钟',
    questions: '90题',
    price: 1,
  },
  { 
    value: 'MBTI', 
    label: 'MBTI 人格评估',
    description: '16型人格测试，帮助了解个人性格特点和职业倾向',
    features: ['93个题目', '16种人格类型', '职业匹配分析', '适合团队建设'],
    duration: '约20-25分钟',
    questions: '93题',
    price: 1,
  },
  { 
    value: 'Holland', 
    label: '霍兰德职业测试',
    description: '职业兴趣测评，帮助发现个人职业兴趣和适合的职业方向',
    features: ['60个题目', '6种职业兴趣类型', '职业推荐', '适合职业规划'],
    duration: '约10-15分钟',
    questions: '60题',
    price: 1,
  },
]

export const CUSTOM_TYPES_KEY = 'question_import_custom_types'
export const PUBLISH_STATE_KEY = 'question_publish_state'
export const SYSTEM_QUESTIONNAIRES_OVERRIDE_KEY = 'system_questionnaires_override'
export const DEFAULT_PRICE = 1 // 默认价格：1元

/**
 * 加载上架状态
 */
export function loadPublishState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(PUBLISH_STATE_KEY)
    if (!stored) {
      // 默认系统题目都上架
      const defaults: Record<string, boolean> = {
        'SCL-90': true,
        'MBTI': true,
        'Holland': true,
      }
      return defaults
    }
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

/**
 * 保存上架状态
 */
export function savePublishState(state: Record<string, boolean>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PUBLISH_STATE_KEY, JSON.stringify(state))
    // 触发自定义事件，通知其他页面更新
    window.dispatchEvent(new CustomEvent('questionnaire-publish-state-updated'))
  } catch (error) {
    console.error('保存上架状态失败', error)
  }
}

/**
 * 加载自定义问卷类型
 */
export function loadCustomTypes(): QuestionnaireConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CUSTOM_TYPES_KEY)
    if (!stored) return []
    const types = JSON.parse(stored)
    return types.map((t: any) => ({
      value: t.type || t.value,
      label: t.title || t.label || t.type,
      description: t.description || '',
      features: t.features || [],
      duration: t.duration || '约10-15分钟',
      questions: typeof t.questions === 'number' ? `${t.questions}题` : `${t.questions?.length || 0}题`,
      price: t.price || DEFAULT_PRICE,
      isCustom: true,
    }))
  } catch {
    return []
  }
}

/**
 * 加载系统问卷覆盖配置
 */
function loadSystemQuestionnairesOverride(): Record<string, Partial<QuestionnaireConfig>> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(SYSTEM_QUESTIONNAIRES_OVERRIDE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

/**
 * 获取所有问卷配置（包括系统 + 自定义）
 */
export function getAllQuestionnaires(): QuestionnaireConfig[] {
  const customTypes = loadCustomTypes()
  const systemOverrides = loadSystemQuestionnairesOverride()
  
  const systemQuestionnaires = SYSTEM_QUESTIONNAIRES.map(q => {
    const override = systemOverrides[q.value]
    if (override) {
      return {
        ...q,
        ...override,
        value: q.value, // 确保 value 不被覆盖
        isCustom: false,
      }
    }
    return { ...q, isCustom: false }
  })
  
  return [
    ...systemQuestionnaires,
    ...customTypes,
  ]
}

/**
 * 获取已上架的问卷配置
 */
export function getPublishedQuestionnaires(): QuestionnaireConfig[] {
  const publishState = loadPublishState()
  const all = getAllQuestionnaires()
  
  return all.filter((q) => {
    // 系统题目：默认上架（除非明确设置为false）
    if (!q.isCustom) {
      return publishState[q.value] !== false
    }
    // 自定义题目：必须明确设置为true才上架
    return publishState[q.value] === true
  })
}

/**
 * 切换问卷上架状态
 */
export function toggleQuestionnairePublish(value: string): boolean {
  const state = loadPublishState()
  const isSystem = SYSTEM_QUESTIONNAIRES.some(q => q.value === value)
  
  // 系统题目默认上架，自定义题目默认下架
  const currentState = isSystem 
    ? (state[value] !== false) 
    : (state[value] === true)
  
  const newState = { ...state, [value]: !currentState }
  savePublishState(newState)
  
  return !currentState
}

/**
 * 更新问卷上架状态（直接设置状态）
 */
export function updateQuestionnairePublishState(value: string, isPublished: boolean): void {
  const state = loadPublishState()
  const newState = { ...state, [value]: isPublished }
  savePublishState(newState)
}

/**
 * 更新自定义问卷类型配置
 */
export function updateCustomQuestionnaire(value: string, updates: Partial<Omit<QuestionnaireConfig, 'value' | 'isCustom'>>): void {
  if (typeof window === 'undefined') return
  try {
    // 检查是否是系统问卷
    const isSystem = SYSTEM_QUESTIONNAIRES.some(q => q.value === value)
    
    if (isSystem) {
      // 更新系统问卷覆盖配置
      const stored = localStorage.getItem(SYSTEM_QUESTIONNAIRES_OVERRIDE_KEY)
      const existing = stored ? JSON.parse(stored) : {}
      
      const currentOverride = existing[value] || {}
      existing[value] = {
        ...currentOverride,
        label: updates.label !== undefined ? updates.label : currentOverride.label,
        description: updates.description !== undefined ? updates.description : currentOverride.description,
        features: updates.features !== undefined ? updates.features : currentOverride.features,
        duration: updates.duration !== undefined ? updates.duration : currentOverride.duration,
        price: updates.price !== undefined ? updates.price : currentOverride.price,
        questions: updates.questions !== undefined 
          ? (typeof updates.questions === 'string' ? `${updates.questions}题` : updates.questions)
          : currentOverride.questions,
      }
      
      localStorage.setItem(SYSTEM_QUESTIONNAIRES_OVERRIDE_KEY, JSON.stringify(existing))
    } else {
      // 更新自定义问卷类型
      const stored = localStorage.getItem(CUSTOM_TYPES_KEY)
      const existing = stored ? JSON.parse(stored) : []
      
      const updatedTypes = existing.map((t: any) => {
        const typeValue = t.type || t.value
        if (typeValue === value) {
          return {
            ...t,
            title: updates.label !== undefined ? updates.label : (t.title || t.label),
            label: updates.label !== undefined ? updates.label : (t.label || t.title),
            description: updates.description !== undefined ? updates.description : t.description,
            features: updates.features !== undefined ? updates.features : t.features,
            duration: updates.duration !== undefined ? updates.duration : t.duration,
            price: updates.price !== undefined ? updates.price : t.price,
            questions: updates.questions !== undefined 
              ? (typeof updates.questions === 'string' ? parseInt(updates.questions) : updates.questions)
              : t.questions,
          }
        }
        return t
      })
      
      localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(updatedTypes))
    }
    
    // 触发更新事件，通知主页和其他页面刷新
    window.dispatchEvent(new CustomEvent('questionnaire-publish-state-updated'))
  } catch (error) {
    console.error('更新问卷配置失败', error)
    throw error
  }
}

