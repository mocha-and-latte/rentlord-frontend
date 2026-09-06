import { createContext, ReactNode, use, useState } from 'react'
type Locale = 'th' | 'en'
const LocaleContext = createContext({
  locale: 'th' as Locale,
  toggle: () => {},
})
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(
    () => (localStorage.getItem('locale') as Locale) || 'th',
  )
  const toggle = () =>
    setLocale((v) => {
      const n = v === 'th' ? 'en' : 'th'
      localStorage.setItem('locale', n)
      return n
    })
  return (
    <LocaleContext.Provider value={{ locale, toggle }}>
      {children}
    </LocaleContext.Provider>
  )
}
export const useLocale = () => use(LocaleContext)
export const money = (value: unknown, locale = 'th-TH') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'THB' }).format(
    Number(value ?? 0),
  )
export const date = (value: string, locale = 'th-TH') =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
