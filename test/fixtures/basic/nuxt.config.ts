import flow from '../../../src/module'

export default defineNuxtConfig({
  modules: [flow],
  ssr: true,
  devtools: { enabled: false },
  app: { head: { link: [{ rel: 'icon', href: 'data:,' }] } },
  compatibilityDate: '2026-10-01',
})
