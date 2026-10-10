import { useSupabase } from '@/hooks/core/useSupabase'
import { chunk, uniq } from 'lodash-es'
import type { VehicleQuerySummaryRecords } from './types'

const { supabase, responseHandle } = useSupabase()
const MAX_VEHICLES_PER_REQUEST = 200

export async function fetchVehicleQuerySummaryRecords(
  vehicleIds: string[]
): Promise<Record<string, VehicleQuerySummaryRecords>> {
  if (vehicleIds.length === 0) return {}

  const results = await Promise.all(
    chunk(uniq(vehicleIds), MAX_VEHICLES_PER_REQUEST).map(async (ids) => {
      const result = await responseHandle<Record<string, VehicleQuerySummaryRecords>>(
        () =>
          supabase.rpc('vms_get_vehicle_query_summary_records_secure', {
            p_vehicle_ids: ids
          }),
        {
          breakReturn: true,
          errorMessage: '车辆运营资料加载失败，请重试'
        }
      )
      return result.data ?? {}
    })
  )
  return Object.assign({}, ...results)
}
