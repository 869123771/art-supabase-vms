import { computed, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ArtTableQueryExpose } from '@/components/core/tables/art-table-query/index.vue'

type ReminderSearchParams = Api.Vms.ReminderManage.VehicleReminderSearchParams

export function useReminderDeleteLocation(
  searchQuery: ReminderSearchParams,
  tableRef: Ref<ArtTableQueryExpose | undefined>
) {
  const route = useRoute()
  const targetSourceKey = computed(() =>
    route.query.fromMasterDelete === '1' && typeof route.query.sourceKey === 'string'
      ? route.query.sourceKey
      : ''
  )
  const targetWorkOrderId = computed(() =>
    targetSourceKey.value && typeof route.query.recordId === 'string' ? route.query.recordId : ''
  )

  watch([targetSourceKey, targetWorkOrderId], () => {
    Object.assign(searchQuery, {
      companyName: '',
      plateNo: '',
      reminderDays: undefined,
      riskBand: undefined,
      expired: undefined
    })
    void tableRef.value?.refreshCreate()
  })

  return { targetSourceKey, targetWorkOrderId }
}
