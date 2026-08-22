const DEFAULT_PLATFORM_URL = 'https://869123771.github.io/art-supabase-pro/'

/**
 * 构造平台统一登录地址。
 *
 * 回跳地址只包含当前应用 URL，不包含 access token 或 refresh token。生产环境要求平台与
 * 子应用部署在同一 origin 的不同子路径下，以便共享 Supabase 的浏览器会话。
 */
export function buildPlatformLoginUrl(currentUrl: string, platformUrl: string): string {
  const returnUrl = new URL(currentUrl)
  const loginUrl = new URL(platformUrl, returnUrl.origin)
  const query = new URLSearchParams({ redirect: returnUrl.href })

  loginUrl.hash = `/auth/login?${query.toString()}`
  return loginUrl.href
}

export function getPlatformLoginUrl(currentUrl = window.location.href): string {
  const configuredPlatformUrl = import.meta.env.VITE_PLATFORM_URL?.trim()
  return buildPlatformLoginUrl(currentUrl, configuredPlatformUrl || DEFAULT_PLATFORM_URL)
}

export function redirectToPlatformLogin(currentUrl = window.location.href): void {
  window.location.replace(getPlatformLoginUrl(currentUrl))
}
