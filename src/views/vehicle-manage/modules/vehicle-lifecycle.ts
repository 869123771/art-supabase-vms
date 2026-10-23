/** Preserve the fleet's 365.25-day year and one-decimal usage-age convention. */
export function getVehicleUsageYears(
  startDate?: string | null,
  clampFuture = true,
  now = Date.now()
): number | null {
  if (!startDate) return null
  const startTime = new Date(startDate).getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(now)) return null
  const years = (now - startTime) / (365.25 * 24 * 60 * 60 * 1000)
  return Number((clampFuture ? Math.max(0, years) : years).toFixed(1))
}
