import flow from '../../../src/module'

export default defineNuxtConfig({
  modules: [flow],
  ssr: true,
  devtools: { enabled: false },
  compatibilityDate: '2026-10-01',
})
