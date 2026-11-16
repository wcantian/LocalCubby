import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ItemType } from '../../shared/types'

export type Lang = 'zh-CN' | 'en-US'

/** 中文为文案基准，英文必须覆盖全部 key（由 Record<MessageKey, string> 保证） */
const zh = {
  searchPlaceholder: '搜索标题、说明、路径、标签',
  clearSearch: '清空搜索',
  sortAdded: '添加顺序',
  sortName: '名称',
  sortToggle: '切换排序方式',
  add: '添加',
  searchResults: '搜索结果',
  searchSummary: '{n} 项 · 匹配标题 / 说明 / 路径 / 标签',
  noMatch: '没有匹配的条目',
  itemsCount: '{n} 项',
  back: '返回',
  uncategorized: '未分类',
  openFailed: '打开失败：{error}\n\n{path}',
  deleteConfirm: '确定删除「{title}」？\n\n只从清单移除，不会删除磁盘上的文件。',
  dropHint: '松开以添加条目',
  typeHeading: '类型',
  tagsHeading: '标签',
  totalSummary: '共 {n} 项',
  tagsSummary: '共 {n} 个',
  typeProgram: '程序',
  typeDoc: '文档',
  typeFolder: '文件夹',
  typeLink: '网络连接',
  emptyTitle: '还没有收录任何东西',
  emptyHint: '把程序、文档、文件夹拖进窗口，或点「添加」手动填写',
  emptyAction: '添加第一个条目',
  menuOpen: '打开',
  menuReveal: '打开所在目录',
  menuEdit: '编辑',
  menuDelete: '删除',
  modalAddTitle: '添加条目',
  modalEditTitle: '编辑条目',
  modalHint: '说明与标签可以留空，标题建议写清楚，它是搜索的主要依据',
  fieldUrl: '网址',
  fieldPath: '路径',
  pathPlaceholder: 'D:\\示例程序\\启动.bat',
  browseFile: '浏览…',
  browseFolder: '目录…',
  fieldTitle: '标题',
  fieldDesc: '说明',
  descPlaceholder: '简要说明，会参与搜索',
  fieldType: '类型',
  fieldTags: '标签',
  tagPlaceholder: '输入标签后回车…',
  cancel: '取消',
  save: '保存',
  missingPath: '路径不存在',
  switchLang: '切换语言 / Switch language'
} as const

export type MessageKey = keyof typeof zh

const en: Record<MessageKey, string> = {
  searchPlaceholder: 'Search title, description, path, tags',
  clearSearch: 'Clear search',
  sortAdded: 'Date added',
  sortName: 'Name',
  sortToggle: 'Toggle sorting',
  add: 'Add',
  searchResults: 'Search results',
  searchSummary: '{n} items · matches title / description / path / tags',
  noMatch: 'No matching items',
  itemsCount: '{n} items',
  back: 'Back',
  uncategorized: 'Uncategorized',
  openFailed: 'Failed to open: {error}\n\n{path}',
  deleteConfirm: 'Delete "{title}"?\n\nThis only removes it from the list; files on disk are not deleted.',
  dropHint: 'Release to add this item',
  typeHeading: 'Types',
  tagsHeading: 'Tags',
  totalSummary: '{n} in total',
  tagsSummary: '{n} tags',
  typeProgram: 'Program',
  typeDoc: 'Document',
  typeFolder: 'Folder',
  typeLink: 'Link',
  emptyTitle: 'Nothing collected yet',
  emptyHint: 'Drag programs, documents or folders into this window, or click "Add"',
  emptyAction: 'Add your first item',
  menuOpen: 'Open',
  menuReveal: 'Open containing folder',
  menuEdit: 'Edit',
  menuDelete: 'Delete',
  modalAddTitle: 'Add item',
  modalEditTitle: 'Edit item',
  modalHint: 'Description and tags are optional. A clear title matters most — it is what search relies on',
  fieldUrl: 'URL',
  fieldPath: 'Path',
  pathPlaceholder: 'D:\\apps\\launcher.bat',
  browseFile: 'Browse…',
  browseFolder: 'Folder…',
  fieldTitle: 'Title',
  fieldDesc: 'Description',
  descPlaceholder: 'Short note, included in search',
  fieldType: 'Type',
  fieldTags: 'Tags',
  tagPlaceholder: 'Type a tag and press Enter…',
  cancel: 'Cancel',
  save: 'Save',
  missingPath: 'Path missing',
  switchLang: '切换语言 / Switch language'
}

const messages: Record<Lang, Record<MessageKey, string>> = { 'zh-CN': zh, 'en-US': en }

export const TYPE_KEY: Record<ItemType, MessageKey> = {
  program: 'typeProgram',
  doc: 'typeDoc',
  folder: 'typeFolder',
  link: 'typeLink'
}

const LANG_KEY = 'localcubby.lang'

function detectLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

interface I18nValue {
  lang: Lang
  toggleLang: () => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [lang, setLang] = useState<Lang>(detectLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const toggleLang = useCallback((): void => {
    setLang((current) => {
      const next: Lang = current === 'zh-CN' ? 'en-US' : 'zh-CN'
      localStorage.setItem(LANG_KEY, next)
      return next
    })
  }, [])

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>): string => {
      let text = messages[lang][key]
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value))
        }
      }
      return text
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, toggleLang, t }), [lang, toggleLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n 必须在 I18nProvider 内使用')
  return value
}
