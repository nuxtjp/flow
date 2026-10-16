import { fileURLToPath } from 'node:url'
import { loadNuxt } from '@nuxt/kit'
import type { Component } from '@nuxt/schema'
import { describe, expect, it } from 'vitest'
const flowModule = fileURLToPath(new URL('../../src/module.ts', import.meta.url))

const cwd = fileURLToPath(new URL('./fixture', import.meta.url))

describe('Nuxt module options', () => {
  it('keeps SSR and user CSS and adds each selected stylesheet only once', async () => {
    const nuxt = await loadNuxt({
      cwd,
      ready: true,
      overrides: {
        dev: false,
        ssr: true,
        modules: [[flowModule, { defaultTheme: false }]],
        css: ['@vue-flow/core/dist/style.css'],
      },
    })
    try {
      expect(nuxt.options.ssr).toBe(true)
      expect(nuxt.options.css.filter(value => value === '@vue-flow/core/dist/style.css')).toHaveLength(1)
      expect(nuxt.options.css).not.toContain('@vue-flow/core/dist/theme-default.css')
      const components: Component[] = []
      await nuxt.callHook('components:extend', components)
      expect(components.some(component => component.pascalName === 'NuxtFlow')).toBe(true)
    } finally {
      await nuxt.close()
    }
  })

  it('respects disabled CSS and component registration', async () => {
    const nuxt = await loadNuxt({
      cwd,
      ready: true,
      overrides: {
        dev: false,
        modules: [[flowModule, { css: false, defaultTheme: false, components: false }]],
        css: [],
      },
    })
    try {
      expect(nuxt.options.css).toEqual([])
      const components: Component[] = []
      await nuxt.callHook('components:extend', components)
      expect(components.some(component => component.pascalName === 'NuxtFlow')).toBe(false)
      expect(nuxt.options.ssr).toBe(true)
    } finally {
      await nuxt.close()
    }
  })
})
