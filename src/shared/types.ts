/** 条目类型：固定四类，link = 网络连接 */
export type ItemType = 'program' | 'doc' | 'folder' | 'link'

export interface Item {
  id: string
  /** 标题，默认取文件名去扩展名 */
  title: string
  /** 简要说明，可为空 */
  desc: string
  /** 本地绝对路径；type 为 link 时是网址 */
  path: string
  type: ItemType
  /** 自由文本标签，可多个、可为空 */
  tags: string[]
  /** 添加时间戳，用于「添加顺序」排序 */
  createdAt: number
}

export interface LibraryFile {
  version: number
  items: Item[]
}

export interface ProbeResult {
  exists: boolean
  isDirectory: boolean
}

export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
}

export const TYPE_LABEL: Record<ItemType, string> = {
  program: '程序',
  doc: '文档',
  folder: '文件夹',
  link: '网络连接'
}
