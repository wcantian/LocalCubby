import type { ItemType } from '../../../shared/types'
import { Icon } from './Icons'
import { typeColor } from '../utils'
import { TYPE_KEY, useI18n } from '../i18n'

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
  const { t } = useI18n()

  if (total === 0) {
    return (
      <div className="empty">
        <Icon name="box" size={56} color="#c4c4c4" />
        <h3>{t('emptyTitle')}</h3>
        <p>{t('emptyHint')}</p>
        <button className="btn btn-primary" onClick={onAdd}>
          <Icon name="plus" size={15} />
          {t('emptyAction')}
        </button>
      </div>
    )
  }

  const visibleTypes = TYPE_ORDER.filter((type) => typeCounts[type] > 0)

  return (
    <>
      <div className="group">
        <div className="group-head">
          <h3>{t('typeHeading')}</h3>
          <span className="count">{t('totalSummary', { n: total })}</span>
        </div>
        <div className="type-grid">
          {visibleTypes.map((type) => (
            <button key={type} className="type-card" onClick={() => onPickType(type)}>
              <Icon name={type} size={28} color={typeColor(type)} />
              <span className="txt">
                <span className="name">{t(TYPE_KEY[type])}</span>
                <span className="num">{t('itemsCount', { n: typeCounts[type] })}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {(tags.length > 0 || uncategorized > 0) && (
        <div className="group">
          <div className="group-head">
            <h3>{t('tagsHeading')}</h3>
            <span className="count">{t('tagsSummary', { n: tags.length })}</span>
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
                <span className="tname">{t('uncategorized')}</span>
                <span className="tnum">{uncategorized}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
