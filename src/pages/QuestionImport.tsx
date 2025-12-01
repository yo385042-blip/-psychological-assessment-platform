import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Upload, AlertCircle, FileText, ListChecks, Database, Download, History, Settings2, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import QuestionBankSelector from '@/components/QuestionBankSelector'
import {
  loadBankQuestions,
  saveBankQuestions,
} from '@/utils/questionBank'
import type { ImportedQuestion, ParseResult } from '@/utils/questionImport'
import { parseCSV, parseJSON, parseExcel, parseMarkdown, parseXML, parseHTML, formatDate, headerAlias } from '@/utils/questionImport'
import { addImportHistory, loadImportHistory, type ImportHistoryRecord } from '@/utils/questionImportHistory'
import { useQuestionBanks } from '@/hooks/useQuestionBanks'
import { importLinksFromFile, generateImportTemplate, type ImportResult } from '@/utils/batchImport'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/contexts/AuthContext'
import { addAuditLog } from '@/utils/audit'
import { useLoading } from '@/hooks/useLoading'
import VirtualList from '@/components/VirtualList'
import { loadCustomTypes, CUSTOM_TYPES_KEY } from '@/utils/questionnaireConfig'
import { performanceMonitor } from '@/utils/monitoring'

type ImportStep = 'select' | 'preview' | 'done'
type ImportStrategy = 'append' | 'overwrite'
type ImportTab = 'questions' | 'links'

interface SkippedDetail {
  title: string
  reason: string
}

export default function QuestionImport() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showAlert, DialogComponent } = useConfirmDialog()
  const { isLoading, withLoading } = useLoading()
  const { currentBankId, banks, setActiveBank } = useQuestionBanks()

  // 标签页状态
  const [activeTab, setActiveTab] = useState<ImportTab>('questions')

  // 题目导入相关状态
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [fileType, setFileType] = useState<'csv' | 'json' | 'xlsx' | 'xls' | 'txt' | 'md' | 'xml' | 'html' | 'unknown'>('unknown')

  const [parsing, setParsing] = useState(false)
  const [step, setStep] = useState<ImportStep>('select')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [skippedDetails, setSkippedDetails] = useState<SkippedDetail[]>([])
  const [strategy, setStrategy] = useState<ImportStrategy>('append')
  const [showSkippedDetail, setShowSkippedDetail] = useState(false)
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 简单字段映射配置
  const [customTitleHeader, setCustomTitleHeader] = useState('')
  const [customAnswerHeader, setCustomAnswerHeader] = useState('')

  // 链接导入相关状态
  const linkFileInputRef = useRef<HTMLInputElement>(null)
  const [linkImportResult, setLinkImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    setHistory(loadImportHistory())
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileSize(file.size)
    const lower = file.name.toLowerCase()
    const asJSON = lower.endsWith('.json')
    const asCSV = lower.endsWith('.csv')
    const asXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls')
    const asTxt = lower.endsWith('.txt')
    const asMd = lower.endsWith('.md') || lower.endsWith('.markdown')
    const asXml = lower.endsWith('.xml')
    const asHtml = lower.endsWith('.html') || lower.endsWith('.htm')

    // 设置文件类型
    if (asJSON) setFileType('json')
    else if (asCSV) setFileType('csv')
    else if (asXlsx) setFileType(lower.endsWith('.xlsx') ? 'xlsx' : 'xls')
    else if (asTxt) setFileType('txt')
    else if (asMd) setFileType('md')
    else if (asXml) setFileType('xml')
    else if (asHtml) setFileType('html')
    else setFileType('unknown')

    setParsing(true)
    setStep('select')
    setParseResult(null)
    setImportedCount(null)
    setSkippedDetails([])

    try {
      const result = await performanceMonitor.measureAsyncFunction('question_import::parse_file', async () => {
        if (asXlsx) {
          // Excel 文件解析
          return parseExcel(file, (() => {
            const alias = { ...headerAlias }
            const titleKey = customTitleHeader.trim()
            const answerKey = customAnswerHeader.trim()
            if (titleKey) alias[titleKey] = 'title'
            if (answerKey) alias[answerKey] = 'answer'
            return alias
          })())
        } else if (asJSON) {
          // JSON 文件解析
          const text = await file.text()
          return parseJSON(text)
        } else if (asMd) {
          // Markdown 文件解析
          const text = await file.text()
          return parseMarkdown(text)
        } else if (asXml) {
          // XML 文件解析
          const text = await file.text()
          return parseXML(text)
        } else if (asHtml) {
          // HTML 文件解析
          const text = await file.text()
          return parseHTML(text)
        } else {
          // CSV/TXT 文件解析
          const text = await file.text()
          const alias = { ...headerAlias }
          const titleKey = customTitleHeader.trim()
          const answerKey = customAnswerHeader.trim()
          if (titleKey) alias[titleKey] = 'title'
          if (answerKey) alias[answerKey] = 'answer'
          return parseCSV(text, alias)
        }
      })

      if (!result.questions.length) {
        toast.error('未解析出任何题目，请检查文件格式')
        setParsing(false)
        return
      }

      setParseResult(result)
      setStep('preview')
      toast.success(`解析完成，共识别到 ${result.questions.length} 道题目`)
    } catch (error) {
      console.error(error)
      toast.error('文件解析失败，请确认格式是否正确')
    } finally {
      setParsing(false)
      // 清空 input，方便用户再次选择同一文件
      e.target.value = ''
    }
  }

  const handleImport = useCallback(() => {
    if (!parseResult) {
      toast.error('请先选择并解析文件')
      return
    }
    if (!currentBankId) {
      toast.error('请先选择题库')
      return
    }

    try {
      const { merged, added, skipped, bankName, record } = performanceMonitor.measureFunction(
        'question_import::merge_questions',
        () => {
          const existing = loadBankQuestions(currentBankId) as ImportedQuestion[]

          const existingMap = new Map<string, ImportedQuestion>()
          existing.forEach((q) => {
            const key = q.title.trim()
            if (key) existingMap.set(key, q)
          })

          let addedCount = 0
          const mergedList: ImportedQuestion[] = []
          const skippedDetails: SkippedDetail[] = []

          if (strategy === 'append') {
            mergedList.push(...existing)
            parseResult.questions.forEach((q) => {
              const key = q.title.trim()
              if (!key) {
                skippedDetails.push({ title: '(空标题)', reason: '缺少题目标题' })
                return
              }
              if (existingMap.has(key)) {
                skippedDetails.push({ title: q.title, reason: '与现有题目标题重复，已跳过' })
                return
              }
              mergedList.push(q)
              existingMap.set(key, q)
              addedCount++
            })
          } else {
            const incomingMap = new Map<string, ImportedQuestion>()
            parseResult.questions.forEach((q) => {
              const key = q.title.trim()
              if (!key) {
                skippedDetails.push({ title: '(空标题)', reason: '缺少题目标题' })
                return
              }
              incomingMap.set(key, q)
            })

            existing.forEach((q) => {
              const key = q.title.trim()
              if (!key) return
              if (!incomingMap.has(key)) {
                mergedList.push(q)
              } else {
                skippedDetails.push({ title: q.title, reason: '已被导入文件中同标题题目覆盖' })
              }
            })

            incomingMap.forEach((q, key) => {
              const existed = existingMap.has(key)
              mergedList.push(q)
              if (!existed) {
                addedCount++
              }
            })
          }

          const bank = banks.find((b) => b.id === currentBankId)?.name
          const record: ImportHistoryRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            bankId: currentBankId,
            bankName: bank,
            fileName: fileName || '未命名文件',
            fileSize,
            fileType: fileType && ['csv', 'json', 'xlsx', 'txt'].includes(fileType)
              ? (fileType as ImportHistoryRecord['fileType'])
              : 'unknown',
            importedCount: addedCount,
            totalParsed: parseResult.questions.length,
            skippedCount: skippedDetails.length,
            strategy,
            createdAt: Date.now(),
          }

          return {
            merged: mergedList,
            added: addedCount,
            skipped: skippedDetails,
            bankName: bank,
            record,
          }
        },
      )

      setSkippedDetails(skipped)

      if (added === 0) {
        toast('没有新的题目需要导入（根据标题及导入策略判断）')
      }

      saveBankQuestions(currentBankId, merged)
      setImportedCount(added)
      setStep('done')

      window.dispatchEvent(
        new CustomEvent('questions-updated', {
          detail: { bankId: currentBankId, count: merged.length },
        }),
      )

      addImportHistory(record)
      setHistory((prev) => [record, ...prev].slice(0, 50))

      if (added > 0 && bankName) {
        try {
          const customTypes = loadCustomTypes()
          const questionnaireValue = bankName.replace(/\s+/g, '-').toLowerCase()

          const existingType = customTypes.find(
            (t) => t.value === questionnaireValue || t.label === bankName,
          )

          if (!existingType) {
            const newType = {
              type: questionnaireValue,
              title: bankName,
              label: bankName,
              description: `${bankName} 问卷`,
              value: questionnaireValue,
              questions: merged.length,
              questionCount: merged.length,
              features: [`${merged.length}个题目`],
              duration: '约10-15分钟',
              price: 1,
            }

            const stored = localStorage.getItem(CUSTOM_TYPES_KEY)
            const existing = stored ? JSON.parse(stored) : []
            const updatedTypes = [...existing, newType]
            localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(updatedTypes))

            window.dispatchEvent(new CustomEvent('questionnaire-publish-state-updated'))
          } else {
            const stored = localStorage.getItem(CUSTOM_TYPES_KEY)
            const existing = stored ? JSON.parse(stored) : []
            const updatedTypes = existing.map((t: any) => {
              if ((t.type || t.value) === questionnaireValue || (t.title || t.label) === bankName) {
                return {
                  ...t,
                  questions: merged.length,
                  questionCount: merged.length,
                  features: [`${merged.length}个题目`],
                }
              }
              return t
            })
            localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(updatedTypes))

            window.dispatchEvent(new CustomEvent('questionnaire-publish-state-updated'))
          }
        } catch (error) {
          console.warn('同步到主页题目管理失败', error)
        }
      }

      if (added > 0) {
        toast.success(`成功导入 ${added} 道新题目`)
      }
    } catch (error) {
      console.error(error)
      toast.error('导入题目时发生错误')
    }
  }, [currentBankId, parseResult, strategy, banks, fileName, fileSize, fileType])

  const previewQuestions = useMemo(() => {
    if (!parseResult) return []
    return parseResult.questions.slice(0, 10)
  }, [parseResult])

  const totalParsed = parseResult?.questions.length ?? 0

  // 链接导入相关处理函数
  const handleLinkFileSelect = async (file: File) => {
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      await showAlert('文件格式错误', '请上传 Excel (.xlsx, .xls) 或 CSV (.csv) 格式的文件', 'alert')
      return
    }

    try {
      const result = await withLoading(
        () => importLinksFromFile(file, user?.id),
        '正在导入链接...'
      )

      setLinkImportResult(result)

      // 记录操作日志
      if (user) {
        addAuditLog({
          userId: user.id,
          username: user.name,
          action: '批量导入链接',
          target: `${result.success}个链接`,
          targetType: 'link',
          details: {
            success: result.success,
            failed: result.failed,
            total: result.success + result.failed,
          },
        })
      }

      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 个链接`)
        // 触发链接更新事件
        window.dispatchEvent(new Event('links-updated'))
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} 个链接导入失败`)
      }
    } catch (error) {
      await showAlert('导入失败', error instanceof Error ? error.message : '文件解析失败，请检查文件格式', 'alert')
    }
  }

  const handleLinkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLinkFileSelect(file)
    }
    // 清空文件输入，允许重复选择同一文件
    if (linkFileInputRef.current) {
      linkFileInputRef.current.value = ''
    }
  }

  const handleLinkDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleLinkDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleLinkFileSelect(file)
    }
  }

  const handleDownloadLinkTemplate = () => {
    generateImportTemplate()
    toast.success('模板已下载')
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
      {DialogComponent}
      <header className="flex flex-col lg:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-500/20">
            <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">导入中心</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              支持批量导入题目和链接，支持多种文件格式，自动解析并存入系统。
            </p>
          </div>
        </div>
      </header>

      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>题目导入</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'links'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              <span>批量导入链接</span>
            </div>
          </button>
        </nav>
      </div>

      {/* 题目导入内容 */}
      {activeTab === 'questions' && (
        <main className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Database className="w-3 h-3" />
            <span>导入目标题库</span>
          </div>
          <QuestionBankSelector onBankChange={setActiveBank} />
        </section>

        <section className="rounded-2xl border border-dashed border-primary-200 bg-white/60 p-6 shadow-sm dark:border-primary-500/40 dark:bg-gray-900/80">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary-100 p-2 dark:bg-primary-500/20">
                  <FileText className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">选择题目文件</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    支持多种文件格式：CSV（推荐）、JSON、Excel（.xlsx/.xls）、Markdown（.md）、XML（.xml）、HTML（.html/.htm）、TXT。CSV/Excel 文件第一行为表头，可包含：题目/问题、类型、选项、答案、标签、难度、解析 等列。HTML 文件将自动识别题目结构。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:ring-offset-gray-900">
                  <Upload className="w-4 h-4" />
                  <span>{parsing ? '解析中...' : '选择文件'}</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.json,.xlsx,.xls,.md,.markdown,.xml,.html,.htm"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={parsing}
                  />
                </label>

                {fileName && (
                  <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      当前文件：
                      <span className="font-medium">{fileName}</span>
                      {fileSize > 0 && (
                        <span className="ml-1 text-gray-400">({(fileSize / 1024).toFixed(1)} KB)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      解析方式：
                      {fileType === 'json'
                        ? 'JSON 解析'
                        : fileType === 'csv' || fileType === 'txt'
                        ? 'CSV 文本解析'
                        : fileType === 'xlsx' || fileType === 'xls'
                        ? 'Excel 解析'
                        : fileType === 'md'
                        ? 'Markdown 解析'
                        : fileType === 'xml'
                        ? 'XML 解析'
                        : fileType === 'html'
                        ? 'HTML 解析'
                        : '自动识别 / 默认 CSV 解析'}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const header = '题目,类型,选项,答案,标签,难度,解析'
                    const exampleRow = '示例题目,single,选项A|选项B|选项C,A,示例标签,1,示例解析'
                    const content = `${header}\n${exampleRow}`
                    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = '题目导入模板.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-3 w-3" />
                  下载 CSV 模板
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const jsonTemplate = {
                      questions: [
                        {
                          title: '示例题目',
                          type: 'single',
                          options: ['选项A', '选项B', '选项C', '选项D'],
                          answer: 'A',
                          tags: ['示例标签'],
                          difficulty: 1,
                          analysis: '示例解析内容'
                        },
                        {
                          title: '多选题示例',
                          type: 'multiple',
                          options: ['选项A', '选项B', '选项C'],
                          answer: 'A,B',
                          tags: ['标签1', '标签2'],
                          difficulty: 2,
                          analysis: '多选题解析'
                        }
                      ]
                    }
                    const content = JSON.stringify(jsonTemplate, null, 2)
                    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = '题目导入模板.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-3 w-3" />
                  下载 JSON 模板
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <History className="h-3 w-3" />
                  导入历史
                </button>
              </div>

              <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
                  <p>
                    CSV 示例表头：
                    <span className="font-mono text-[11px]">
                      题目,类型,选项,答案,标签,难度,解析
                    </span>
                    。选项可用逗号或竖线分隔；标签可用逗号或顿号分隔。
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-blue-500" />
                  <p>
                    JSON 格式支持：
                    <span className="font-mono text-[11px]">
                      {"{questions: [...]}"}
                    </span>
                    或直接数组格式
                    <span className="font-mono text-[11px]">
                      {"[{...}, {...}]"}
                    </span>
                    。字段名支持中英文（title/题目、options/选项、answer/答案等）。
                  </p>
                </div>
                <p>
                  题型字段可填写 <span className="font-mono">single</span>（单选）、
                  <span className="font-mono">multiple</span>（多选）、
                  <span className="font-mono">text</span>（开放题）。未填写时默认单选题。
                </p>

                <div className="mt-2 rounded-lg border border-dashed border-gray-200 p-2 dark:border-gray-700">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    <Settings2 className="h-3.5 w-3.5 text-gray-400" />
                    自定义表头映射（可选）
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">标题列名</span>
                      <input
                        value={customTitleHeader}
                        onChange={(e) => setCustomTitleHeader(e.target.value)}
                        placeholder="例如：题干"
                        className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">答案列名</span>
                      <input
                        value={customAnswerHeader}
                        onChange={(e) => setCustomAnswerHeader(e.target.value)}
                        placeholder="例如：正确选项"
                        className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    如不填写，将根据内置中文别名（题目/问题/标题、答案/正确答案 等）自动识别。
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-100">
                <ListChecks className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                导入步骤
              </h3>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li className={step !== 'select' ? 'line-through decoration-primary-500' : ''}>选择题库与文件</li>
                <li className={step === 'preview' || step === 'done' ? 'font-semibold text-primary-600' : ''}>
                  预览并确认题目
                </li>
                <li className={step === 'done' ? 'font-semibold text-emerald-600' : ''}>导入并保存到题库</li>
              </ol>
            </div>
          </div>
        </section>

        {parseResult && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary-600" />
                  解析结果预览
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  共解析出 <span className="font-semibold text-primary-600">{totalParsed}</span> 道题目，以下展示前{' '}
                  <span className="font-semibold">{previewQuestions.length}</span> 道。
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    导入策略：
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        value="append"
                        checked={strategy === 'append'}
                        onChange={() => setStrategy('append')}
                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>追加（仅新增不重复题目）</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer ml-3">
                      <input
                        type="radio"
                        value="overwrite"
                        checked={strategy === 'overwrite'}
                        onChange={() => setStrategy('overwrite')}
                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>覆盖（同标题题目将覆盖旧题）</span>
                    </label>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={parsing || !totalParsed}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                导入到当前题库
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">题目</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">类型</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">选项</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">答案</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">标签</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">难度</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {previewQuestions.map((q) => (
                    <tr key={q.id}>
                      <td className="max-w-xs px-3 py-2 text-gray-900 dark:text-gray-100">
                        <div className="line-clamp-2">{q.title}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {q.type === 'single' && '单选题'}
                        {q.type === 'multiple' && '多选题'}
                        {q.type === 'text' && '开放题'}
                      </td>
                      <td className="max-w-xs px-3 py-2 text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-2">{q.options?.join(' | ')}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{q.answer}</td>
                      <td className="max-w-xs px-3 py-2 text-gray-700 dark:text-gray-300">
                        <div className="line-clamp-2">{q.tags?.join('、')}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{q.difficulty ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-[11px]">
                        {formatDate(q.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parseResult.warnings.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  导入警告（不影响其它题目导入）：
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {parseResult.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {step === 'done' && importedCount !== null && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                成功将 <span className="font-semibold">{importedCount}</span> 道新题目导入到当前题库。
                {skippedDetails.length > 0 && (
                  <>
                    {' '}
                    其中 <span className="font-semibold">{skippedDetails.length}</span> 道题目因重复或缺少必要信息被跳过。
                  </>
                )}
                <span className="ml-1">
                  如需修改上下架状态，可前往「题目上下架操作台」页面进行管理。
                </span>
              </div>
              {skippedDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSkippedDetail((v) => !v)}
                  className="mt-1 inline-flex items-center justify-center rounded border border-emerald-400 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/60 dark:text-emerald-100 dark:hover:bg-emerald-400/10"
                >
                  {showSkippedDetail ? '收起被跳过明细' : '查看被跳过的题目'}
                </button>
              )}
            </div>

            {showSkippedDetail && skippedDetails.length > 0 && (
              <div className="mt-3 max-h-40 overflow-auto rounded border border-emerald-200 bg-white/70 p-2 text-[11px] text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-900/40 dark:text-emerald-50">
                <div className="mb-1 font-semibold">被跳过题目列表</div>
                <ul className="space-y-0.5">
                  {skippedDetails.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item.title}</span>
                      <span className="ml-1 opacity-80">（{item.reason}）</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {showHistory && history.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">导入历史</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                收起
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-[11px] dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">时间</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">题库</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">文件</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">导入/总数</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">跳过</th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-300">策略</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-2 py-1">{formatDate(h.createdAt)}</td>
                      <td className="px-2 py-1">{h.bankName || h.bankId}</td>
                      <td className="px-2 py-1">
                        <div className="max-w-[160px] truncate" title={h.fileName}>
                          {h.fileName}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <span className="font-semibold">{h.importedCount}</span>
                        <span className="opacity-70"> / {h.totalParsed}</span>
                      </td>
                      <td className="px-2 py-1">{h.skippedCount}</td>
                      <td className="px-2 py-1">{h.strategy === 'append' ? '追加' : '覆盖'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      )}

      {/* 链接导入内容 */}
      {activeTab === 'links' && (
        <main className="space-y-6">
          {/* 使用说明 */}
          <section className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10 p-4 sm:p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">导入说明</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside mb-4">
              <li>支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式</li>
              <li>必需字段：问卷类型</li>
              <li>可选字段：链接、状态、创建时间、使用时间、报告ID</li>
              <li>可以下载模板文件查看格式要求</li>
            </ul>
            <button
              onClick={handleDownloadLinkTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              下载导入模板
            </button>
          </section>

          {/* 文件上传区域 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20'
                  : 'border-gray-300 hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500'
              }`}
              onDragEnter={handleLinkDrag}
              onDragLeave={handleLinkDrag}
              onDragOver={handleLinkDrag}
              onDrop={handleLinkDrop}
            >
              <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                拖拽文件到此处或点击选择
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                支持 Excel 和 CSV 格式
              </p>
              <input
                ref={linkFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleLinkFileChange}
                className="hidden"
                id="link-file-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="link-file-upload"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isLoading ? '导入中...' : '选择文件'}
              </label>
            </div>
          </section>

          {/* 导入结果 */}
          {linkImportResult && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">导入结果</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{linkImportResult.success}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">成功</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{linkImportResult.failed}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {linkImportResult.success + linkImportResult.failed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">总计</div>
                </div>
              </div>

              {/* 错误列表 */}
              {linkImportResult.errors.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    错误详情
                  </h4>
                  <VirtualList
                    items={linkImportResult.errors}
                    height={Math.min(linkImportResult.errors.length * 60, 320)}
                    itemHeight={60}
                    renderItem={(error, index) => (
                      <div key={`${error.row}-${index}`} className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 mb-2">
                        <span className="font-semibold">第 {error.row} 行：</span>
                        {error.message}
                      </div>
                    )}
                  />
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setLinkImportResult(null)
                    navigate('/links/manage')
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                >
                  查看导入的链接
                </button>
                <button
                  onClick={() => setLinkImportResult(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  继续导入
                </button>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  )
}