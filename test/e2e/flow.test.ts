import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { describe } from 'vitest'
import { interactionTests } from './interactions'
import { lifecycleTests } from './lifecycle'

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  browser: true,
  browserOptions: {
    type: 'chromium',
    launch: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
})

describe('canvas lifecycle', lifecycleTests)
describe('upstream graph behavior', interactionTests)
