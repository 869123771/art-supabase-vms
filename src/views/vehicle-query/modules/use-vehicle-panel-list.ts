import { computed, watch, type Ref } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { noop } from 'lodash-es'
import { getFriendlySupabaseErrorMessage } from '@/utils/supabase'
import type { VehicleArchive } from './types'

export const useVehiclePanelList = <TRecord>(
  vehicle: Ref<VehicleArchive>,
  fetcher: (vehicle: VehicleArchive) => Promise<TRecord[]>
) => {
  const {
    state: records,
    isLoading: loading,
    executeImmediate,
    error: rawError
  } = useAsyncState(
    async (current: VehicleArchive): Promise<TRecord[]> =>
      current.plateNo ? fetcher(current) : [],
    [] as TRecord[],
    {
      immediate: false,
      onError: noop
    }
  )
  const error = computed(() =>
    rawError.value
      ? new Error(getFriendlySupabaseErrorMessage(rawError.value, '车辆记录加载失败，请重试'), {
          cause: rawError.value
        })
      : null
  )
  const loadRecords = async (): Promise<void> => {
    await executeImmediate(vehicle.value)
  }
  watch(
    () => [vehicle.value.id, vehicle.value.plateNo],
    () => void loadRecords(),
    { immediate: true }
  )
  return { loading, records, error, loadRecords }
}
