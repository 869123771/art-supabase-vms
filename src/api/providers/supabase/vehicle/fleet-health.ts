import { useSupabase } from '@/hooks'

const { supabase, responseHandle } = useSupabase()

interface FleetHealthWorkspaceResult {
  records?: Api.Vms.VehicleManage.FleetHealthRecord[]
  total?: number
  overview?: Api.Vms.VehicleManage.FleetHealthOverview
}

const emptyOverview = (): Api.Vms.VehicleManage.FleetHealthOverview => ({
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  openWorkOrders: 0
})

export async function fetchFleetHealthWorkspace(
  params: Api.Vms.VehicleManage.FleetHealthSearchParams = {}
) {
  const from = Math.max(params.from ?? 0, 0)
  const to = Math.max(params.to ?? from + 19, from)
  const result = await responseHandle<FleetHealthWorkspaceResult>(
    () =>
      supabase.rpc('vms_get_fleet_health_workspace', {
        p_keyword: params.keyword?.trim() || null,
        p_risk_level: params.riskLevel || null,
        p_from: from,
        p_to: to
      }),
    { showErrorMessage: true }
  )

  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    overview: result.data?.overview ?? emptyOverview(),
    error: result.error
  }
}
