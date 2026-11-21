import type { ElementType } from 'react'
import { useI18n } from '../../i18n/context'
import { localizedLang, type LocalizedText } from '../../i18n/localized'

/** Take the [1], [2]... reference markers out of a text, for places that show no reference list. */
function withoutMarkers(text: string): string {
  return text.replace(/\s*\[\d+\]/g, '')
}

/**
 * Content text in the chosen language, marked with the language it is really
 * in (English when a translation is missing). `plain` leaves out the [n]
 * reference markers.
 */
export function Loc({
  field,
  as: Tag = 'span',
  className,
  plain = false,
}: {
  field: LocalizedText
  as?: ElementType
  className?: string | undefined
  plain?: boolean
}) {
  const { l, lang } = useI18n()
  const text = l(field)
  return (
    <Tag lang={localizedLang(field, lang)} className={className}>
      {plain ? withoutMarkers(text) : text}
    </Tag>
  )
}
