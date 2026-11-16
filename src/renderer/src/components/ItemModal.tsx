import { useEffect, useRef, useState } from 'react'
import type { ItemType } from '../../../shared/types'
import { TYPE_LABEL } from '../../../shared/types'
import { Icon } from './Icons'
import { inferType, normalizeUrl, titleFromPath } from '../utils'

export interface Draft {
  id?: string
  title: string
  desc: string
  path: string
  type: ItemType
  tags: string[]
  createdAt?: number
}

interface Props {
  mode: 'add' | 'edit'
  initial?: Draft
  suggestions: string[]
  onCancel: () => void
  onSubmit: (draft: Draft) => void
}

const TYPE_ORDER: ItemType[] = ['program', 'doc', 'folder', 'link']

export function ItemModal({ mode, initial, suggestions, onCancel, onSubmit }: Props): JSX.Element {
  const [path, setPath] = useState(initial?.path ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [desc, setDesc] = useState(initial?.desc ?? '')
  const [type, setType] = useState<ItemType>(initial?.type ?? 'doc')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')

  const titleTouched = useRef(Boolean(initial?.title))
  const typeTouched = useRef(Boolean(initial?.type))
  const pathRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    pathRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const applyPath = (next: string, isDirectory = false): void => {
    setPath(next)
    if (!titleTouched.current) setTitle(titleFromPath(next))
    if (!typeTouched.current) setType(inferType(next, isDirectory))
  }

  const browse = async (kind: 'file' | 'directory'): Promise<void> => {
    const picked = await window.api.pick(kind)
    if (!picked) return
    applyPath(picked, kind === 'directory')
  }

  const addTag = (raw: string): void => {
    const value = raw.trim()
    if (!value) return
    if (!tags.includes(value)) setTags([...tags, value])
    setTagDraft('')
  }

  const canSave = path.trim().length > 0 && title.trim().length > 0

  const submit = (): void => {
    if (!canSave) return
    onSubmit({
      id: initial?.id,
      title: title.trim(),
      desc: desc.trim(),
      path: type === 'link' ? normalizeUrl(path) : path.trim(),
      type,
      tags,
      createdAt: initial?.createdAt
    })
  }

  return (
    <div className="modal-mask" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{mode === 'add' ? '添加条目' : '编辑条目'}</h2>
          <p>说明与标签可以留空，标题建议写清楚，它是搜索的主要依据</p>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>
              {type === 'link' ? '网址' : '路径'} <span className="req">*</span>
            </label>
            <div className="row">
              <input
                ref={pathRef}
                className="input"
                value={path}
                placeholder={type === 'link' ? 'https://example.com' : 'D:\\示例程序\\启动.bat'}
                onChange={(event) => applyPath(event.target.value)}
              />
              {type !== 'link' && (
                <>
                  <button className="btn" style={{ height: 32 }} onClick={() => browse('file')}>
                    浏览…
                  </button>
                  <button className="btn" style={{ height: 32 }} onClick={() => browse('directory')}>
                    目录…
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="field">
            <label>
              标题 <span className="req">*</span>
            </label>
            <input
              className="input"
              value={title}
              onChange={(event) => {
                titleTouched.current = true
                setTitle(event.target.value)
              }}
            />
          </div>

          <div className="field">
            <label>说明</label>
            <textarea
              className="input"
              value={desc}
              placeholder="简要说明，会参与搜索"
              onChange={(event) => setDesc(event.target.value)}
            />
          </div>

          <div className="field">
            <label>类型</label>
            <div className="seg">
              {TYPE_ORDER.map((option) => (
                <button
                  key={option}
                  className={`opt${type === option ? ' on' : ''}`}
                  onClick={() => {
                    typeTouched.current = true
                    setType(option)
                  }}
                >
                  <Icon name={option} size={14} />
                  {TYPE_LABEL[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>标签</label>
            <div className="taginput">
              {tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                  <button className="x" onClick={() => setTags(tags.filter((item) => item !== tag))}>
                    ✕
                  </button>
                </span>
              ))}
              <input
                list="tag-suggestions"
                value={tagDraft}
                placeholder="输入标签后回车…"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    addTag(tagDraft)
                  } else if (event.key === 'Backspace' && !tagDraft && tags.length > 0) {
                    setTags(tags.slice(0, -1))
                  }
                }}
                onBlur={() => addTag(tagDraft)}
              />
              <datalist id="tag-suggestions">
                {suggestions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
