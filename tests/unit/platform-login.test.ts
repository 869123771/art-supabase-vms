import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPlatformLoginUrl } from '../../src/utils/platform-login'

test('builds the central platform login URL without exposing session tokens', () => {
  const currentUrl = 'https://869123771.github.io/art-supabase-vms/#/vms/vehicle-archive'
  const loginUrl = buildPlatformLoginUrl(
    currentUrl,
    'https://869123771.github.io/art-supabase-pro/'
  )
  const parsed = new URL(loginUrl)
  const hashQuery = new URLSearchParams(parsed.hash.split('?')[1])

  assert.equal(parsed.origin, 'https://869123771.github.io')
  assert.equal(parsed.pathname, '/art-supabase-pro/')
  assert.equal(parsed.hash.split('?')[0], '#/auth/login')
  assert.equal(hashQuery.get('redirect'), currentUrl)
  assert.doesNotMatch(loginUrl, /access_token|refresh_token/)
})

test('resolves a relative platform base against the child application origin', () => {
  const loginUrl = buildPlatformLoginUrl(
    'http://127.0.0.1:41737/art-supabase-vms/#/vms',
    '/art-supabase-pro/'
  )

  assert.equal(
    loginUrl,
    'http://127.0.0.1:41737/art-supabase-pro/#/auth/login?redirect=http%3A%2F%2F127.0.0.1%3A41737%2Fart-supabase-vms%2F%23%2Fvms'
  )
})
