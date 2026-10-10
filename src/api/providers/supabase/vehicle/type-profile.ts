import { useSupabase } from '@/hooks/core/useSupabase'
import type { VehicleTypeProfile, VehicleTypeProfileWriteInput } from '@vms/types/vehicle-type'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export interface VehicleTypeProfileScope {
  tenantId?: string | null
  vehicleId?: string | null
  carrierId?: string | null
  includeDisabled?: boolean
}

export async function fetchVehicleTypeProfiles(scope: VehicleTypeProfileScope = {}) {
  return await responseHandle<VehicleTypeProfile[]>(
    () =>
      supabase.rpc('vms_list_vehicle_type_profiles_secure', {
        p_tenant_id: scope.tenantId || null,
        p_vehicle_id: scope.vehicleId || null,
        p_carrier_id: scope.carrierId || null,
        p_include_disabled: scope.includeDisabled ?? false
      }),
    { showErrorMessage: false }
  )
}

export async function saveVehicleTypeProfile(input: VehicleTypeProfileWriteInput) {
  const { id, ...payload } = input
  return await responseHandle<VehicleTypeProfile>(
    () =>
      supabase.rpc('vms_save_vehicle_type_profile_secure', {
        p_id: id || null,
        p_payload: keysToSnakeDeep(payload)
      }),
    { showMessage: true, breakReturn: true }
  )
}

export async function deleteVehicleTypeProfile(id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('vms_delete_vehicle_type_profile_secure', { p_id: id }),
    { showMessage: true, message: '车型配置已删除', breakReturn: true }
  )
}
