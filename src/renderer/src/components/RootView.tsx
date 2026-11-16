import type { ItemType } from '../../../shared/types'
import { TYPE_LABEL } from '../../../shared/types'
import { Icon } from './Icons'
import { typeColor } from '../utils'

const TYPE_ORDER: ItemType[] = ['program', 'doc', 'folder', 'link']

interface Props {
  total: number
  typeCounts: Record<ItemType, number>
  tags: { name: string; count: number }[]
  uncategorized: number
  onPickType: (type: ItemType) => void
  onPickTag: (tag: string) => void
  onPickUncat: () => void
  onAdd: () => void
}

export function RootView({
  total,
  typeCounts,
  tags,
  uncategorized,
  onPickType,
  onPickTag,
  onPickUncat,
  onAdd
}: Props): JSX.Element {
  if (total === 0) {
    return (
      <div className="empty">
        <Icon name="box" size={56} color="#c4c4c4" />
        <h3>还没有收录任何东西</h3>
        <p>把程序、文档、文件夹拖进窗口，或点「添加」手动填写</p>
        <button className="btn btn-primary" onClick={onAdd}>
          <Icon name="plus" size={15} />
          添加第一个条目
        </button>
      </div>
    )
  }

  const visibleTypes = TYPE_ORDER.filter((type) => typeCounts[type] > 0)

  return (
    <>
      <div className="group">
        <div className="group-head">
          <h3>类型</h3>
          <span className="count">共 {total} 项</span>
        </div>
        <div className="type-grid">
          {visibleTypes.map((type) => (
            <button key={type} className="type-card" onClick={() => onPickType(type)}>
              <Icon name={type} size={28} color={typeColor(type)} />
              <span className="txt">
                <span className="name">{TYPE_LABEL[type]}</span>
                <span className="num">{typeCounts[type]} 项</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {(tags.length > 0 || uncategorized > 0) && (
        <div className="group">
          <div className="group-head">
            <h3>标签</h3>
            <span className="count">共 {tags.length} 个</span>
          </div>
          <div className="tag-grid">
            {tags.map((tag) => (
              <button key={tag.name} className="tag-card" onClick={() => onPickTag(tag.name)}>
                <span className="hash">#</span>
                <span className="tname">{tag.name}</span>
                <span className="tnum">{tag.count}</span>
              </button>
            ))}
          </div>
          {uncategorized > 0 && (
            <div className="tag-grid" style={{ marginTop: 10 }}>
              <button className="tag-card uncat" onClick={onPickUncat}>
                <span className="hash">·</span>
                <span className="tname">未分类</span>
                <span className="tnum">{uncategorized}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
