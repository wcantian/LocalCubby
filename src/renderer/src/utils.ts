import type { Item, ItemType } from '../../shared/types'

export function uid(): string {
  return crypto.randomUUID()
}

/** 以 http(s):// 开头视为网址 */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

/** 无协议时补 https:// */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** 按路径与是否目录推断类型 */
export function inferType(target: string, isDirectory = false): ItemType {
  const value = target.trim()
  if (!value) return 'doc'
  if (looksLikeUrl(value)) return 'link'
  if (isDirectory) return 'folder'
  if (/\.(exe|bat|cmd|ps1|com|msi)$/i.test(value)) return 'program'
  return 'doc'
}

/** 从路径或网址生成默认标题 */
export function titleFromPath(target: string): string {
  const value = target.trim()
  if (!value) return ''
  if (looksLikeUrl(value)) {
    const host = normalizeUrl(value).replace(/^[a-z]+:\/\//i, '').split('/')[0]
    return host || value
  }
  const base = value.split(/[\\/]/).pop() ?? value
  const withoutExt = base.replace(/\.[^.]+$/, '')
  return withoutExt || base
}

export function typeColor(type: ItemType): string {
  switch (type) {
    case 'program':
      return 'var(--c-program)'
    case 'doc':
      return 'var(--c-doc)'
    case 'folder':
      return 'var(--c-folder)'
    case 'link':
      return 'var(--c-link)'
  }
}

/** 中文拼音序（Chromium 内置 ICU，无需拼音库） */
export function compareZh(a: string, b: string): number {
  return a.localeCompare(b, 'zh-CN')
}

export function sortItems(items: Item[], mode: 'added' | 'name'): Item[] {
  const list = [...items]
  if (mode === 'name') {
    list.sort((a, b) => compareZh(a.title, b.title))
  } else {
    list.sort((a, b) => a.createdAt - b.createdAt)
  }
  return list
}

/** 搜索匹配：标题 + 说明 + 路径 + 标签名 */
export function matchItem(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.title.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q) ||
    item.path.toLowerCase().includes(q) ||
    item.tags.join(' ').toLowerCase().includes(q)
  )
}
