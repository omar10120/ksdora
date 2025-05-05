'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en } from '@/translations/en'
import { ar } from '@/translations/ar'

type Language = 'en' | 'ar'

interface LanguageContextType {
  language: Language
  translations: typeof en
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get the language from localStorage during initialization
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang')
      return (savedLang as Language) || 'en'
    }
    return 'en'
  })

  const translations = language === 'en' ? en : ar

  useEffect(() => {
    // Update localStorage when language changes
    localStorage.setItem('lang', language)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const toggleLanguage = () => {
    setLanguage((prev: string) => prev === 'en' ? 'ar' : 'en')
  }

  return (
    <LanguageContext.Provider value={{ language, translations, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}