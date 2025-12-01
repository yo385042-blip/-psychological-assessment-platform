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
 * - 支持多种格式：
 *   1. 数组格式：[{title: "...", options: [...], ...}, ...]
 *   2. 对象格式：{questions: [{...}, ...]}
 *   3. 对象格式：{data: [{...}, ...]}
 *   4. 对象格式：{items: [{...}, ...]}
 */
export function parseJSON(text: string): ParseResult {
  try {
    const data = JSON.parse(text)
    let list: any[] = []
    const warnings: string[] = []

    // 处理不同的JSON结构
    if (Array.isArray(data)) {
      // 直接是数组
      list = data
    } else if (typeof data === 'object' && data !== null) {
      // 对象格式，尝试多个可能的字段名
      list = 
        data.questions || 
        data.data || 
        data.items || 
        data.list || 
        data.题目 || 
        data.问题 ||
        []
      
      if (!Array.isArray(list)) {
        warnings.push('JSON 结构不符合预期，未找到题目数组')
        return { questions: [], warnings }
      }
    } else {
      warnings.push('JSON 格式不正确，期望数组或包含题目数组的对象')
      return { questions: [], warnings }
    }

    if (list.length === 0) {
      warnings.push('JSON 文件中没有找到题目数据')
      return { questions: [], warnings }
    }

    const questions = list.map((item: any, index: number) => {
      try {
        return normalizeRecord(item, index)
      } catch (error) {
        warnings.push(`第 ${index + 1} 条记录解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
        return null
      }
    }).filter((q): q is ImportedQuestion => q !== null)

    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: [`JSON 解析失败: ${error instanceof Error ? error.message : '请检查文件格式是否正确'}`],
    }
  }
}

/**
 * 解析 Excel 文件（.xlsx, .xls）
 * - 使用 xlsx 库解析
 * - 读取第一个工作表
 * - 第一行为表头
 */
export async function parseExcel(file: File, alias: Record<string, string> = headerAlias): Promise<ParseResult> {
  try {
    // 动态导入 xlsx 库
    const XLSX = await import('xlsx')
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const firstSheet = workbook.Sheets[firstSheetName]
          
          // 转换为 JSON 数组
          const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
          
          if (jsonData.length === 0) {
            resolve({ questions: [], warnings: ['Excel 文件中没有数据'] })
            return
          }
          
          // 获取表头（从第一行数据推断）
          const headers = Object.keys(jsonData[0])
          const mappedKeys = headers.map((h) => alias[h] || h)
          
          const warnings: string[] = []
          const questions: ImportedQuestion[] = []
          
          jsonData.forEach((row, index) => {
            const record: any = {}
            mappedKeys.forEach((key, idx) => {
              record[key] = row[headers[idx]] ?? ''
            })
            
            const normalized = normalizeRecord(record, index)
            if (!normalized.title) {
              warnings.push(`第 ${index + 2} 行缺少题目标题，已跳过`)
              return
            }
            questions.push(normalized)
          })
          
          resolve({ questions, warnings })
        } catch (error) {
          resolve({
            questions: [],
            warnings: [`Excel 解析失败: ${error instanceof Error ? error.message : '未知错误'}`],
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          questions: [],
          warnings: ['读取 Excel 文件失败'],
        })
      }
      
      reader.readAsArrayBuffer(file)
    })
  } catch (error) {
    return {
      questions: [],
      warnings: [`Excel 解析库加载失败: ${error instanceof Error ? error.message : '未知错误'}`],
    }
  }
}

/**
 * 解析 Markdown 文件
 * - 支持简单的 Markdown 格式题目
 * - 格式：## 题目标题\n选项A\n选项B\n答案：A
 */
export function parseMarkdown(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) {
    return { questions: [], warnings: ['文件内容为空'] }
  }
  
  const questions: ImportedQuestion[] = []
  const warnings: string[] = []
  let currentQuestion: any = null
  let questionIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检测题目标题（## 或 ### 开头，或数字编号）
    if (line.startsWith('##') || line.startsWith('###') || /^\d+[\.、]/.test(line)) {
      // 保存上一题
      if (currentQuestion && currentQuestion.title) {
        questions.push(normalizeRecord(currentQuestion, questionIndex++))
      }
      
      // 开始新题
      const title = line.replace(/^#+\s*/, '').replace(/^\d+[\.、]\s*/, '').trim()
      currentQuestion = {
        title,
        type: 'single',
        options: [],
        answer: '',
        tags: [],
      }
    } else if (currentQuestion) {
      // 检测选项（以 - 或 * 开头，或 A. B. 等格式）
      if (/^[-*]\s/.test(line) || /^[A-Z][\.、]\s/.test(line)) {
        const option = line.replace(/^[-*]\s*/, '').replace(/^[A-Z][\.、]\s*/, '').trim()
        if (option) {
          currentQuestion.options.push(option)
        }
      }
      // 检测答案（答案：或 正确答案：）
      else if (/^答案[：:]\s*/.test(line) || /^正确答案[：:]\s*/.test(line)) {
        currentQuestion.answer = line.replace(/^答案[：:]\s*/, '').replace(/^正确答案[：:]\s*/, '').trim()
      }
      // 检测标签
      else if (/^标签[：:]\s*/.test(line)) {
        const tags = line.replace(/^标签[：:]\s*/, '').trim()
        currentQuestion.tags = tags.split(/[，,、]/).map((t) => t.trim()).filter(Boolean)
      }
    }
  }
  
  // 保存最后一题
  if (currentQuestion && currentQuestion.title) {
    questions.push(normalizeRecord(currentQuestion, questionIndex++))
  }
  
  if (questions.length === 0) {
    warnings.push('未能从 Markdown 文件中解析出题目，请检查格式')
  }
  
  return { questions, warnings }
}

/**
 * 解析 XML 文件
 * - 支持简单的 XML 格式题目
 */
export function parseXML(text: string): ParseResult {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, 'text/xml')
    
    // 检查解析错误
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      return {
        questions: [],
        warnings: ['XML 解析失败，请检查文件格式是否正确'],
      }
    }
    
    // 查找题目节点（支持多种可能的标签名）
    const questionNodes = xmlDoc.querySelectorAll('question, item, 题目, 问题')
    
    if (questionNodes.length === 0) {
      return {
        questions: [],
        warnings: ['XML 文件中未找到题目节点，请检查 XML 结构'],
      }
    }
    
    const questions: ImportedQuestion[] = []
    const warnings: string[] = []
    
    questionNodes.forEach((node, index) => {
      const record: any = {}
      
      // 提取题目标题
      const titleNode = node.querySelector('title, 题目, 问题, text, 题干')
      record.title = titleNode?.textContent?.trim() || ''
      
      // 提取类型
      const typeNode = node.querySelector('type, 类型, 题型')
      record.type = typeNode?.textContent?.trim() || 'single'
      
      // 提取选项
      const optionNodes = node.querySelectorAll('option, 选项, choice, 备选项')
      record.options = Array.from(optionNodes).map((opt) => opt.textContent?.trim() || '').filter(Boolean)
      
      // 提取答案
      const answerNode = node.querySelector('answer, 答案, 正确答案, correct')
      record.answer = answerNode?.textContent?.trim() || ''
      
      // 提取标签
      const tagNodes = node.querySelectorAll('tag, 标签, category, 分类')
      record.tags = Array.from(tagNodes).map((tag) => tag.textContent?.trim() || '').filter(Boolean)
      
      // 提取难度
      const difficultyNode = node.querySelector('difficulty, 难度')
      record.difficulty = difficultyNode?.textContent?.trim() || ''
      
      // 提取解析
      const analysisNode = node.querySelector('analysis, 解析, explanation, 说明')
      record.analysis = analysisNode?.textContent?.trim() || ''
      
      const normalized = normalizeRecord(record, index)
      if (!normalized.title) {
        warnings.push(`第 ${index + 1} 个题目节点缺少题目标题，已跳过`)
        return
      }
      questions.push(normalized)
    })
    
    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: [`XML 解析失败: ${error instanceof Error ? error.message : '未知错误'}`],
    }
  }
}

/**
 * 解析 HTML 文件
 * - 支持多种 HTML 题目结构
 * - 自动识别常见的题目容器、选项、答案等元素
 */
export function parseHTML(text: string): ParseResult {
  try {
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(text, 'text/html')
    
    const questions: ImportedQuestion[] = []
    const warnings: string[] = []
    
    // 尝试多种可能的题目容器选择器
    const questionContainers = htmlDoc.querySelectorAll(
      '.question, .item, .quiz-item, [data-question], .question-item, ' +
      '#question, #questions, .questions, .quiz-questions, ' +
      'div.question, li.question, tr.question'
    )
    
    // 如果没找到特定的题目容器，尝试从表单中提取
    if (questionContainers.length === 0) {
      // 尝试查找包含选项的元素（可能是题目）
      const forms = htmlDoc.querySelectorAll('form')
      if (forms.length > 0) {
        // 从表单中提取题目
        forms.forEach((form) => {
          const formQuestions: any[] = []
          
          // 查找字段集（fieldset）或题目组
          const fieldsets = form.querySelectorAll('fieldset, .question-group, .question-block')
          if (fieldsets.length > 0) {
            fieldsets.forEach((fieldset, index) => {
              const record: any = {
                title: '',
                type: 'single',
                options: [],
                answer: '',
                tags: [],
              }
              
              // 提取题目标题（label、legend、h1-h6、p、span等）
              const titleSelectors = 'legend, label, h1, h2, h3, h4, h5, h6, p.question-title, .question-title, .title, [data-title]'
              const titleElement = fieldset.querySelector(titleSelectors)
              record.title = titleElement?.textContent?.trim() || ''
              
              // 提取选项（input[type="radio/checkbox"], label, option等）
              const inputs = fieldset.querySelectorAll('input[type="radio"], input[type="checkbox"]')
              if (inputs.length > 0) {
                inputs.forEach((input) => {
                  const label = input.closest('label') || 
                               (input.id ? htmlDoc.querySelector(`label[for="${input.id}"]`) : null) ||
                               input.nextElementSibling
                  const optionText = label?.textContent?.trim() || (input as HTMLInputElement).value || ''
                  if (optionText) {
                    record.options.push(optionText)
                  }
                  // 如果选中，可能是答案
                  if ((input as HTMLInputElement).checked || input.hasAttribute('checked')) {
                    record.answer = record.options.length > 0 
                      ? String.fromCharCode(64 + record.options.length) 
                      : optionText
                  }
                })
                
                // 判断题型
                const hasCheckbox = fieldset.querySelector('input[type="checkbox"]')
                if (hasCheckbox) {
                  record.type = 'multiple'
                }
              } else {
                // 尝试从 select 中提取
                const select = fieldset.querySelector('select')
                if (select) {
                  const options = select.querySelectorAll('option')
                  options.forEach((opt) => {
                    const text = opt.textContent?.trim()
                    if (text && !opt.hasAttribute('disabled') && opt.value) {
                      record.options.push(text)
                      if (opt.selected || opt.hasAttribute('selected')) {
                        record.answer = text
                      }
                    }
                  })
                }
              }
              
              if (record.title) {
                formQuestions.push(normalizeRecord(record, index))
              }
            })
            
            questions.push(...formQuestions)
            return
          }
          
          // 如果没有字段集，尝试从表单中的所有输入元素推断题目结构
          const allInputs = form.querySelectorAll('input[type="radio"], input[type="checkbox"], textarea, input[type="text"]')
          if (allInputs.length > 0) {
            let currentQuestion: any = null
            
            Array.from(allInputs).forEach((input) => {
              const inputElement = input as HTMLElement
              const parent = inputElement.closest('div, li, tr, fieldset, .question')
              
              if (parent) {
                const titleElement = parent.querySelector('label, .question-title, h1, h2, h3, h4, h5, h6, p, span')
                const title = titleElement?.textContent?.trim() || ''
                
                if (title && (!currentQuestion || currentQuestion.title !== title)) {
                  // 保存上一题
                  if (currentQuestion && currentQuestion.title) {
                    formQuestions.push(normalizeRecord(currentQuestion, formQuestions.length))
                  }
                  
                  // 开始新题
                  currentQuestion = {
                    title,
                    type: inputElement.getAttribute('type') === 'checkbox' ? 'multiple' : 
                          inputElement.tagName === 'TEXTAREA' ? 'text' : 'single',
                    options: [],
                    answer: '',
                    tags: [],
                  }
                }
                
                if (currentQuestion) {
                  const label = inputElement.closest('label') || 
                               (inputElement.id ? htmlDoc.querySelector(`label[for="${inputElement.id}"]`) : null) ||
                               inputElement.nextElementSibling
                  const optionText = label?.textContent?.trim() || (inputElement as HTMLInputElement).value || ''
                  
                  if (inputElement.getAttribute('type') === 'radio' || inputElement.getAttribute('type') === 'checkbox') {
                    if (optionText && !currentQuestion.options.includes(optionText)) {
                      currentQuestion.options.push(optionText)
                    }
                    if ((inputElement as HTMLInputElement).checked || inputElement.hasAttribute('checked')) {
                      const answerIndex = currentQuestion.options.length - 1
                      currentQuestion.answer = String.fromCharCode(65 + answerIndex) // A, B, C...
                    }
                  } else if (inputElement.tagName === 'TEXTAREA') {
                    const value = (inputElement as HTMLTextAreaElement).value.trim()
                    if (value) {
                      currentQuestion.answer = value
                    }
                  }
                }
              }
            })
            
            // 保存最后一题
            if (currentQuestion && currentQuestion.title) {
              formQuestions.push(normalizeRecord(currentQuestion, formQuestions.length))
            }
            
            questions.push(...formQuestions)
          }
        })
      }
    } else {
      // 从找到的题目容器中提取
      questionContainers.forEach((container, index) => {
        const record: any = {
          title: '',
          type: 'single',
          options: [],
          answer: '',
          tags: [],
        }
        
        // 提取题目标题
        const titleSelectors = '.question-title, .title, h1, h2, h3, h4, h5, h6, p.title, label, [data-title], .question-text'
        const titleElement = container.querySelector(titleSelectors)
        record.title = titleElement?.textContent?.trim() || container.getAttribute('data-question') || ''
        
        // 如果还是没有标题，尝试从第一个文本节点获取
        if (!record.title) {
          const textNodes = Array.from(container.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
          if (textNodes.length > 0) {
            record.title = textNodes[0].textContent?.trim() || ''
          }
        }
        
        // 提取选项
        const optionSelectors = '.option, .choice, input[type="radio"], input[type="checkbox"], label, .answer-option'
        const optionElements = container.querySelectorAll(optionSelectors)
        
        if (optionElements.length > 0) {
          optionElements.forEach((elem) => {
            const optionText = elem.textContent?.trim() || (elem as HTMLInputElement).value || ''
            if (optionText && !record.options.includes(optionText)) {
              record.options.push(optionText)
              
              // 检查是否选中（答案）
              const input = elem as HTMLInputElement
              if (input.checked || input.hasAttribute('checked') || 
                  elem.classList.contains('correct') || elem.classList.contains('answer') ||
                  elem.hasAttribute('data-correct')) {
                const answerChar = String.fromCharCode(65 + record.options.length - 1)
                if (!record.answer) {
                  record.answer = answerChar
                } else {
                  record.answer += ',' + answerChar
                  record.type = 'multiple'
                }
              }
            }
          })
        }
        
        // 判断题型
        const hasCheckbox = container.querySelector('input[type="checkbox"]')
        if (hasCheckbox && record.options.length > 0) {
          record.type = 'multiple'
        }
        
        // 提取答案（可能有单独的答案区域）
        const answerSelectors = '.answer, .correct-answer, .solution, [data-answer], .answer-text'
        const answerElement = container.querySelector(answerSelectors)
        if (answerElement && !record.answer) {
          record.answer = answerElement.textContent?.trim() || ''
        }
        
        // 提取解析
        const analysisSelectors = '.analysis, .explanation, .solution-text, [data-analysis]'
        const analysisElement = container.querySelector(analysisSelectors)
        if (analysisElement) {
          record.analysis = analysisElement.textContent?.trim() || ''
        }
        
        // 提取标签
        const tagSelectors = '.tag, .category, [data-tag], .question-tag'
        const tagElements = container.querySelectorAll(tagSelectors)
        record.tags = Array.from(tagElements).map(tag => tag.textContent?.trim() || '').filter(Boolean)
        
        const normalized = normalizeRecord(record, index)
        if (!normalized.title) {
          warnings.push(`第 ${index + 1} 个题目容器缺少题目标题，已跳过`)
          return
        }
        questions.push(normalized)
      })
    }
    
    if (questions.length === 0) {
      warnings.push('未能从 HTML 文件中解析出题目，请检查 HTML 结构。支持的结构：包含 .question、form、fieldset 等元素的HTML')
    }
    
    return { questions, warnings }
  } catch (error) {
    return {
      questions: [],
      warnings: [`HTML 解析失败: ${error instanceof Error ? error.message : '未知错误'}`],
    }
  }
}





