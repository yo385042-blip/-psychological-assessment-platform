/**
 * 题目导入与解析工具（被多个组件和 Worker 依赖）
 * 之前文件内容丢失导致动态导入失败，这里补上一份精简但可用的实现
 */

import { formatDate as baseFormatDate, formatFileSize, generateId } from './formatters'

/**
 * 标准化后的导入题目结构
 */
export interface ImportedQuestion {
  id: string
  title: string
  type: 'single' | 'multiple' | 'text'
  options: string[]
  answer: string
  tags: string[]
  difficulty?: number
  analysis?: string
  createdAt: number
}

export interface ParseResult {
  questions: ImportedQuestion[]
  warnings: string[]
}

/**
 * 表头别名映射：用于 CSV 解析时把中文/别名列映射到内部字段
 */
export const headerAlias: Record<string, string> = {
  题目: 'title',
  问题: 'title',
  标题: 'title',
  类型: 'type',
  题型: 'type',
  选项: 'options',
  备选项: 'options',
  答案: 'answer',
  正确答案: 'answer',
  标签: 'tags',
  分类: 'tags',
  难度: 'difficulty',
  解析: 'analysis',
}

/**
 * 对外暴露的时间格式化，兼容 number / string / Date
 */
export function formatDate(date: number | string | Date, pattern = 'yyyy-MM-dd HH:mm') {
  const value = typeof date === 'number' ? new Date(date) : date
  return baseFormatDate(value as any, pattern)
}

/**
 * 文件大小格式化（给任务队列等组件用）
 */
export function formatSize(bytes: number): string {
  return formatFileSize(bytes)
}

/**
 * 把原始记录（从 CSV/JSON 来）转换成标准 ImportedQuestion
 */
function normalizeRecord(record: any, index: number): ImportedQuestion {
  const id = String(record.id || generateId() || `${Date.now()}-${index}`)
  const title = String(record.title || record.题目 || record.问题 || '').trim()
  const type = (record.type || record.类型 || 'single') as ImportedQuestion['type']

  // 选项：支持数组或用 | / , 分隔的字符串
  let options: string[] = []
  if (Array.isArray(record.options)) {
    options = record.options.map(String)
  } else if (typeof record.options === 'string' && record.options.trim()) {
    options = record.options.split(/[|,，]/).map((s: string) => s.trim()).filter(Boolean)
  } else if (typeof record.optionsRaw === 'string' && record.optionsRaw.trim()) {
    options = record.optionsRaw.split(/[|,，]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const answer = String(record.answer || record.答案 || '').trim()

  // 标签：支持数组或用 , / 、 分隔的字符串
  let tags: string[] = []
  if (Array.isArray(record.tags)) {
    tags = record.tags.map(String)
  } else if (typeof record.tags === 'string' && record.tags.trim()) {
    tags = record.tags.split(/[|,，、]/).map((s: string) => s.trim()).filter(Boolean)
  }

  const difficultyRaw = record.difficulty ?? record.难度
  const difficulty = typeof difficultyRaw === 'number' ? difficultyRaw : difficultyRaw ? Number(difficultyRaw) || undefined : undefined

  const analysis = record.analysis || record.解析 || ''

  const createdAt =
    typeof record.createdAt === 'number'
      ? record.createdAt
      : record.createdAt
      ? new Date(record.createdAt).getTime()
      : Date.now()

  return {
    id,
    title,
    type,
    options,
    answer,
    tags,
    difficulty,
    analysis,
    createdAt,
  }
}

/**
 * 解析 CSV 文本
 * - 支持逗号或制表符分隔
 * - 第一行为表头
 */
export function parseCSV(text: string, alias: Record<string, string> = headerAlias): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) {
    return { questions: [], warnings: ['文件内容为空'] }
  }

  const headerLine = lines[0]
  const delimiter = headerLine.includes('\t') && !headerLine.includes(',') ? '\t' : ','
  const headers = headerLine.split(delimiter).map((h) => h.trim())

  const mappedKeys = headers.map((h) => alias[h] || h)
  const warnings: string[] = []
  const questions: ImportedQuestion[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cells = line.split(delimiter)
    const record: any = {}
    mappedKeys.forEach((key, idx) => {
      record[key] = cells[idx]?.trim?.() ?? ''
    })

    const normalized = normalizeRecord(record, i - 1)
    if (!normalized.title) {
      warnings.push(`第 ${i + 1} 行缺少题目标题，已跳过`)
      continue
    }
    questions.push(normalized)
  }

  return { questions, warnings }
}

/**
 * 解析 JSON 文本
 * - 期望为数组或包含 questions 字段的对象
 */
export function parseJSON(text: string): ParseResult {
  try {
    const data = JSON.parse(text)
    const list = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : []

    const questions = list.map((item: any, index: number) => normalizeRecord(item, index))
    return { questions, warnings: [] }
  } catch (error) {
    return {
      questions: [],
      warnings: ['JSON 解析失败，请检查文件格式是否正确'],
    }
  }
}

/**
 * 解析 Excel 文件（简化实现，将 Excel 内容转为 CSV 格式后解析）
 */
export async function parseExcel(file: File, alias: Record<string, string> = headerAlias): Promise<ParseResult> {
  try {
    // 尝试读取 Excel 文件内容
    // 注意：这里使用简化的方法，实际应该使用 xlsx 库
    // 为了简化，我们先尝试将文件作为 CSV 处理（如果 Excel 文件以 CSV 格式保存）
    const text = await file.text()
    
    // 如果文件开头包含 Excel 的 BOF 标记，说明是二进制 Excel 文件
    // 这种情况下需要用户将文件另存为 CSV 格式
    if (text.charCodeAt(0) === 0x50 && text.charCodeAt(1) === 0x4B) {
      return {
        questions: [],
        warnings: ['Excel 文件解析暂不支持二进制格式，请将文件另存为 CSV 格式后再导入'],
      }
    }
    
    // 否则尝试作为 CSV 解析
    return parseCSV(text, alias)
  } catch (error) {
    return {
      questions: [],
      warnings: ['Excel 文件解析失败：' + (error instanceof Error ? error.message : '未知错误')],
    }
  }
}

/**
 * 解析 Markdown 文本
 * - 支持基本的 Markdown 格式题目
 */
export function parseMarkdown(text: string): ParseResult {
  const warnings: string[] = []
  const questions: ImportedQuestion[] = []
  
  try {
    // 简单的 Markdown 解析：查找题目模式
    // 支持格式：
    // ## 题目标题
    // - 选项A
    // - 选项B
    // 答案：A
    
    const lines = text.split(/\r?\n/)
    let currentQuestion: Partial<ImportedQuestion> | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 题目标题（## 或 ### 开头）
      if (line.match(/^##+\s+(.+)$/)) {
        if (currentQuestion && currentQuestion.title) {
          const normalized = normalizeRecord(currentQuestion, questions.length)
          if (normalized.title) {
            questions.push(normalized)
          }
        }
        const match = line.match(/^##+\s+(.+)$/)
        currentQuestion = {
          id: generateId(),
          title: match?.[1] || '',
          type: 'single',
          options: [],
          answer: '',
          tags: [],
          createdAt: Date.now(),
        }
      }
      // 选项（- 或 * 开头）
      else if (line.match(/^[-*]\s+(.+)$/) && currentQuestion) {
        const match = line.match(/^[-*]\s+(.+)$/)
        if (match && currentQuestion.options) {
          currentQuestion.options.push(match[1])
        }
      }
      // 答案（答案：或 正确答案：开头）
      else if (line.match(/^(答案|正确答案)[：:]\s*(.+)$/i) && currentQuestion) {
        const match = line.match(/^(答案|正确答案)[：:]\s*(.+)$/i)
        if (match) {
          currentQuestion.answer = match[2].trim()
        }
      }
    }
    
    // 添加最后一个题目
    if (currentQuestion && currentQuestion.title) {
      const normalized = normalizeRecord(currentQuestion, questions.length)
      if (normalized.title) {
        questions.push(normalized)
      }
    }
    
    if (questions.length === 0) {
      warnings.push('未识别到有效的 Markdown 格式题目')
    }
    
    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: ['Markdown 解析失败：' + (error instanceof Error ? error.message : '未知错误')],
    }
  }
}

/**
 * 解析 XML 文本
 * - 支持基本的 XML 格式题目
 */
export function parseXML(text: string): ParseResult {
  const warnings: string[] = []
  const questions: ImportedQuestion[] = []
  
  try {
    // 简单的 XML 解析：使用正则表达式提取题目信息
    // 支持格式：
    // <question><title>题目标题</title><options><option>选项A</option></options><answer>答案</answer></question>
    
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    // 检查解析错误
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      return {
        questions: [],
        warnings: ['XML 格式错误：' + parserError.textContent],
      }
    }
    
    // 查找所有 question 节点
    const questionNodes = xmlDoc.querySelectorAll('question, item, q')
    
    questionNodes.forEach((node, index) => {
      const title = node.querySelector('title, name, text')?.textContent?.trim() || ''
      const answer = node.querySelector('answer, correct, solution')?.textContent?.trim() || ''
      const options: string[] = []
      
      // 提取选项
      const optionNodes = node.querySelectorAll('option, choice, item')
      optionNodes.forEach((opt) => {
        const text = opt.textContent?.trim()
        if (text) {
          options.push(text)
        }
      })
      
      if (title) {
        const record: any = {
          id: generateId(),
          title,
          type: options.length > 0 ? 'single' : 'text',
          options,
          answer,
          tags: [],
          createdAt: Date.now(),
        }
        
        const normalized = normalizeRecord(record, index)
        questions.push(normalized)
      }
    })
    
    if (questions.length === 0) {
      warnings.push('未识别到有效的 XML 格式题目')
    }
    
    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: ['XML 解析失败：' + (error instanceof Error ? error.message : '未知错误')],
    }
  }
}

/**
 * 解析 HTML 文本
 * - 从 HTML 页面中提取题目信息
 */
export function parseHTML(text: string): ParseResult {
  const warnings: string[] = []
  const questions: ImportedQuestion[] = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    
    // 查找各种可能的题目结构
    // 1. 查找包含题目标题的元素（h1-h6, div.question, .title 等）
    const questionContainers = doc.querySelectorAll(
      'div.question, .question, [class*="question"], form, .quiz-item, .test-item'
    )
    
    if (questionContainers.length === 0) {
      // 如果没有找到特定的容器，尝试查找表单或列表
      const forms = doc.querySelectorAll('form')
      const lists = doc.querySelectorAll('ol, ul')
      
      if (forms.length > 0) {
        forms.forEach((form, index) => {
          extractQuestionFromForm(form, questions, index)
        })
      } else if (lists.length > 0) {
        lists.forEach((list, index) => {
          extractQuestionFromList(list, questions, index)
        })
      } else {
        warnings.push('未找到标准的题目结构，尝试通用解析')
        extractQuestionsGeneric(doc, questions)
      }
    } else {
      questionContainers.forEach((container, index) => {
        extractQuestionFromContainer(container, questions, index)
      })
    }
    
    if (questions.length === 0) {
      warnings.push('未识别到有效的 HTML 格式题目')
    }
    
    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: ['HTML 解析失败：' + (error instanceof Error ? error.message : '未知错误')],
    }
  }
}

/**
 * 从表单中提取题目
 */
function extractQuestionFromForm(
  form: Element,
  questions: ImportedQuestion[],
  index: number
): void {
  const title = form.querySelector('label, legend, h1, h2, h3, h4, h5, h6, .title')?.textContent?.trim() || 
                `题目 ${index + 1}`
  
  const options: string[] = []
  const inputs = form.querySelectorAll('input[type="radio"], input[type="checkbox"], label')
  
  inputs.forEach((input) => {
    if (input.tagName === 'LABEL') {
      const text = input.textContent?.trim()
      if (text && !options.includes(text)) {
        options.push(text)
      }
    } else {
      const label = input.closest('label') || 
                    input.nextElementSibling ||
                    input.parentElement?.querySelector('label[for="' + (input as HTMLInputElement).id + '"]')
      if (label) {
        const text = label.textContent?.trim()
        if (text && !options.includes(text)) {
          options.push(text)
        }
      }
    }
  })
  
  const record: any = {
    id: generateId(),
    title,
    type: options.length > 0 ? 'single' : 'text',
    options,
    answer: '',
    tags: [],
    createdAt: Date.now(),
  }
  
  const normalized = normalizeRecord(record, index)
  if (normalized.title) {
    questions.push(normalized)
  }
}

/**
 * 从列表中提取题目
 */
function extractQuestionFromList(
  list: Element,
  questions: ImportedQuestion[],
  index: number
): void {
  const title = list.previousElementSibling?.textContent?.trim() || 
                `题目 ${index + 1}`
  
  const options: string[] = []
  const items = list.querySelectorAll('li')
  
  items.forEach((item) => {
    const text = item.textContent?.trim()
    if (text) {
      options.push(text)
    }
  })
  
  const record: any = {
    id: generateId(),
    title,
    type: options.length > 0 ? 'single' : 'text',
    options,
    answer: '',
    tags: [],
    createdAt: Date.now(),
  }
  
  const normalized = normalizeRecord(record, index)
  if (normalized.title) {
    questions.push(normalized)
  }
}

/**
 * 从容器中提取题目
 */
function extractQuestionFromContainer(
  container: Element,
  questions: ImportedQuestion[],
  index: number
): void {
  const title = container.querySelector('h1, h2, h3, h4, h5, h6, .title, label, legend')?.textContent?.trim() || 
                `题目 ${index + 1}`
  
  const options: string[] = []
  const optionElements = container.querySelectorAll('li, .option, [class*="option"], label, input[type="radio"] + label, input[type="checkbox"] + label')
  
  optionElements.forEach((element) => {
    const text = element.textContent?.trim()
    if (text && text !== title && !options.includes(text)) {
      options.push(text)
    }
  })
  
  const record: any = {
    id: generateId(),
    title,
    type: options.length > 0 ? 'single' : 'text',
    options,
    answer: '',
    tags: [],
    createdAt: Date.now(),
  }
  
  const normalized = normalizeRecord(record, index)
  if (normalized.title) {
    questions.push(normalized)
  }
}

/**
 * 通用题目提取（当找不到标准结构时）
 */
function extractQuestionsGeneric(doc: Document, questions: ImportedQuestion[]): void {
  // 查找所有可能包含题目的元素
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  
  headings.forEach((heading, index) => {
    const title = heading.textContent?.trim()
    if (title && title.length > 5) {
      // 查找后续的选项
      const options: string[] = []
      let next = heading.nextElementSibling
      
      while (next && next.tagName !== 'H1' && next.tagName !== 'H2' && next.tagName !== 'H3') {
        if (next.tagName === 'UL' || next.tagName === 'OL') {
          const items = next.querySelectorAll('li')
          items.forEach((item) => {
            const text = item.textContent?.trim()
            if (text) {
              options.push(text)
            }
          })
        }
        next = next.nextElementSibling
      }
      
      const record: any = {
        id: generateId(),
        title,
        type: options.length > 0 ? 'single' : 'text',
        options,
        answer: '',
        tags: [],
        createdAt: Date.now(),
      }
      
      const normalized = normalizeRecord(record, index)
      if (normalized.title) {
        questions.push(normalized)
      }
    }
  })
}





