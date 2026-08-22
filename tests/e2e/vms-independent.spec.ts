import { expect, test } from '@playwright/test'
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_KEY

interface RpcResponse<T> {
  ok: boolean
  status: number
  data: T
}

async function callRpc<T>(
  page: import('@playwright/test').Page,
  functionName: string,
  body: Record<string, unknown>
): Promise<RpcResponse<T>> {
  return await page.evaluate(
    async ({ url, key, rpcName, payload }) => {
      const authStorageKey = Object.keys(localStorage).find(
        (storageKey) => storageKey.startsWith('sb-') && storageKey.endsWith('-auth-token')
      )
      const session = authStorageKey
        ? (JSON.parse(localStorage.getItem(authStorageKey) || '{}') as { access_token?: string })
        : undefined
      const response = await fetch(`${url}/rest/v1/rpc/${rpcName}`, {
        method: 'POST',
        headers: {
          apikey: key,
          authorization: `Bearer ${session?.access_token ?? ''}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      return {
        ok: response.ok,
        status: response.status,
        data: (await response.json()) as T
      }
    },
    { url: supabaseUrl, key: supabaseKey, rpcName: functionName, payload: body }
  )
}

test('VMS independently loads only its authorized menu and cross-domain read contracts', async ({
  page
}) => {
  test.setTimeout(120_000)
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    runtimeErrors.push(`${request.url()}: ${request.failure()?.errorText ?? 'request failed'}`)
  })
  await page.goto('/#/vms', { waitUntil: 'domcontentloaded' })
  await expect(page).not.toHaveURL(/#\/(?:auth\/)?login/)
  await expect(
    page.getByText('VMS车辆管理', { exact: true }).first(),
    runtimeErrors.join('\n')
  ).toBeVisible({ timeout: 60_000 })
  expect(runtimeErrors).toEqual([])

  const menuResult = await callRpc<{
    flat: Array<{ component?: string; path?: string; type?: string }>
  }>(page, 'get_menus_for_current_application', { p_app_code: 'vms' })

  expect(menuResult.ok, `VMS menu RPC returned ${menuResult.status}`).toBe(true)
  expect(menuResult.data.flat.length).toBeGreaterThan(0)
  expect(
    menuResult.data.flat
      .filter((menu) => menu.component && menu.component !== '/index/index')
      .every((menu) => menu.component?.startsWith('/vms/'))
  ).toBe(true)

  const employeeResult = await callRpc<Array<Record<string, unknown>>>(
    page,
    'vms_list_hr_employee_options_secure',
    { p_keyword: null, p_max_rows: 5 }
  )
  expect(employeeResult.ok, `VMS HR contract returned ${employeeResult.status}`).toBe(true)
  for (const employee of employeeResult.data) {
    expect(Object.keys(employee).sort()).toEqual(
      expect.arrayContaining(['employeeName', 'employeeNo', 'employmentStatus', 'id'])
    )
    expect(employee).not.toHaveProperty('idCardNo')
    expect(employee).not.toHaveProperty('phone')
    expect(employee).not.toHaveProperty('email')
  }

  const driverResult = await callRpc<Array<Record<string, unknown>>>(
    page,
    'tms_list_driver_options_secure',
    {
      p_carrier_id: null,
      p_driver_name: null,
      p_driver_type: null,
      p_ids: null,
      p_include_disabled: false,
      p_max_rows: 5
    }
  )
  expect(driverResult.ok, `VMS driver contract returned ${driverResult.status}`).toBe(true)
})
