import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Language, t } from '@/lib/translations'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  translate: (key: string) => string
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => {
        set({ language: lang })
        document.documentElement.lang = lang
      },
      translate: (key) => t(key as any, get().language),
    }),
    {
      name: 'language-storage',
    }
  )
)
