<template>
  <ArtPageSection title="零部件管理">
    <template #actions>
      <ElInput
        v-model="panel.keyword"
        clearable
        placeholder="零部件名称"
        class="w-55! max-w-full"
      />
    </template>
    <VehicleQueryTable
      :error="error"
      @retry="loadRecords"
      :data="filteredRecords"
      :columns="columns"
      :loading="loading"
    />
  </ArtPageSection>
</template>

<script setup lang="tsx">
  import { ElInput } from 'element-plus'
  import type { ColumnOption } from '@/types'
  import { fetchVehiclePartUsageList } from '@vms/api'
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import VehicleQueryTable from './vehicle-query-table.vue'
  import type { VehicleArchive, VehiclePartUsage } from './types'
  import { formatDate, formatValue } from './query-format'
  import { useVehiclePanelList } from './use-vehicle-panel-list'
  import { isNil } from 'lodash-es'
  import { canViewField, mergeFieldAccessMaps } from '@/utils/field-permission'
  import { formatVehiclePartWarranty } from '@vms/views/vehicle-manage/part-manage/modules/vehicle-part-display'

  defineOptions({ name: 'VehicleQueryPartsPanel' })

  const props = defineProps<{
    vehicle: VehicleArchive
  }>()

  const vehicle = toRef(props, 'vehicle')
  const panel = reactive({
    keyword: ''
  })

  const { loading, records, error, loadRecords } = useVehiclePanelList<VehiclePartUsage>(
    vehicle,
    async (current) => {
      const { data, error: requestError } = await fetchVehiclePartUsageList(
        {
          plateNo: current.plateNo,
          from: 0,
          to: 9999
        },
        { showErrorMessage: false }
      )
      if (requestError) throw requestError
      return data ?? []
    }
  )

  const filteredRecords = computed(() => {
    const keyword = panel.keyword.trim()
    if (!keyword) return records.value
    return records.value.filter((item) => item.partName?.includes(keyword))
  })

  const effectiveFieldAccess = computed(() =>
    mergeFieldAccessMaps(...records.value.map((record) => record.fieldAccess))
  )

  const columns = computed<ColumnOption<VehiclePartUsage>[]>(() => [
    { type: 'globalIndex', label: '序号', width: 70 },
    {
      prop: 'partType',
      label: '零部件类型',
      width: 120,
      dict: { code: 'vehiclePartType', display: 'auto' }
    },
    { prop: 'partName', label: '零部件名称', minWidth: 160 },
    { prop: 'categoryName', label: '类别', width: 120 },
    { prop: 'brand', label: '品牌', width: 100 },
    { prop: 'model', label: '型号', width: 120 },
    ...(canViewField(effectiveFieldAccess.value, 'traceabilityTag')
      ? [{ prop: 'rfidTag', label: 'RFID标签', minWidth: 140 } as ColumnOption<VehiclePartUsage>]
      : []),
    ...(canViewField(effectiveFieldAccess.value, 'lifecycleLimits')
      ? ([
          {
            prop: 'enableDate',
            label: '启用日期',
            width: 120,
            formatter: (row) => (row.lifecycleLimitsMasked ? '***' : formatDate(row.enableDate))
          },
          {
            prop: 'warrantySummary',
            label: '质保期',
            minWidth: 200,
            formatter: formatVehiclePartWarranty
          },
          {
            prop: 'serviceYears',
            label: '使用年限（年）',
            width: 130,
            formatter: (row) => (row.lifecycleLimitsMasked ? '***' : (row.serviceYears ?? '--'))
          },
          {
            prop: 'usedYears',
            label: '已使用时长（年）',
            width: 150,
            formatter: (row) =>
              row.lifecycleLimitsMasked ? '***' : formatUsedYears(row.enableDate)
          },
          {
            prop: 'serviceMileage',
            label: '可使用里程（公里）',
            width: 160,
            formatter: (row) => (row.lifecycleLimitsMasked ? '***' : (row.serviceMileage ?? '--'))
          },
          {
            prop: 'usedMileage',
            label: '已使用里程（公里）',
            width: 160,
            formatter: (row) => (row.lifecycleLimitsMasked ? '***' : (row.usedMileage ?? '--'))
          }
        ] as ColumnOption<VehiclePartUsage>[])
      : []),
    {
      prop: 'status',
      label: '状态',
      width: 100,
      dict: { code: 'vehiclePartUsageStatus', display: 'auto' }
    }
  ])

  const formatUsedYears = (enableDate?: string | null): string => {
    if (isNil(enableDate) || enableDate === '') return '--'
    const start = new Date(enableDate)
    if (Number.isNaN(start.getTime())) return '--'
    const years = Math.max(0, (Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return formatValue(years.toFixed(1))
  }
</script>
