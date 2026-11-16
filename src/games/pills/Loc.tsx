import type { ElementType } from 'react'
import { useI18n } from '../../i18n/context'
import { localizedLang, type LocalizedText } from '../../i18n/localized'

/** Content text in the chosen language, marked with the language it is really in (English when a translation is missing). */
export function Loc({ field, as: Tag = 'span' }: { field: LocalizedText; as?: ElementType }) {
  const { l, lang } = useI18n()
  return <Tag lang={localizedLang(field, lang)}>{l(field)}</Tag>
}
