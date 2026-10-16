import { addComponent, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  /** Register the NuxtFlow component. */
  components: boolean
  /** Include Vue Flow's required structural styles. */
  css: boolean
  /** Include Vue Flow's optional default theme. */
  defaultTheme: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjp/flow',
    configKey: 'flow',
    compatibility: { nuxt: '~4.6.1' },
  },
  defaults: { components: true, css: true, defaultTheme: true },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    if (options.components) {
      addComponent({
        name: 'NuxtFlow',
        filePath: resolver.resolve('./runtime/components/NuxtFlow.vue'),
      })
    }
    const styles = [
      ...(options.css ? ['@vue-flow/core/dist/style.css'] : []),
      ...(options.defaultTheme ? ['@vue-flow/core/dist/theme-default.css'] : []),
    ]
    for (const style of styles) {
      if (!nuxt.options.css.includes(style)) nuxt.options.css.push(style)
    }
  },
})
