<template>
  <ArtPageSection title="车辆年检">
    <VehicleQueryTable
      :error="error"
      @retry="loadRecords"
      :data="records"
      :columns="columns"
      :loading="loading"
    />
  </ArtPageSection>
</template>

<script setup lang="tsx">
  import type { ColumnOption } from '@/types'
  import { fetchVehicleInspectionList } from '@vms/api'
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import VehicleQueryTable from './vehicle-query-table.vue'
  import type { VehicleArchive, VehicleInspection } from './types'
  import { formatDate } from './query-format'
  import { useVehiclePanelList } from './use-vehicle-panel-list'
  import {
    canViewField,
    mergeFieldAccessMaps,
    formatSensitiveNumberWithAffix
  } from '@/utils/field-permission'

  defineOptions({ name: 'VehicleQueryInspectionPanel' })

  const props = defineProps<{
    vehicle: VehicleArchive
  }>()

  const vehicle = toRef(props, 'vehicle')
  const { loading, records, error, loadRecords } = useVehiclePanelList<VehicleInspection>(
    vehicle,
    async (current) => {
      const { data, error: requestError } = await fetchVehicleInspectionList(
        {
          vehicleId: current.id,
          from: 0,
          to: 9999
        },
        { showErrorMessage: false }
      )
      if (requestError) throw requestError
      return data ?? []
    }
  )

  const effectiveFieldAccess = computed(() =>
    mergeFieldAccessMaps(...records.value.map((record) => record.fieldAccess))
  )

  const columns = computed<ColumnOption<VehicleInspection>[]>(() => [
    { type: 'globalIndex', label: '序号', width: 80 },
    {
      prop: 'inspectionDate',
      label: '年检日期',
      minWidth: 150,
      formatter: (row) => formatDate(row.inspectionDate)
    },
    ...(canViewField(effectiveFieldAccess.value, 'inspectionIdentifiers')
      ? [{ prop: 'inspectionNo', label: '年检号', minWidth: 160 }]
      : []),
    ...(canViewField(effectiveFieldAccess.value, 'monetaryAmounts')
      ? [
          {
            prop: 'inspectionAmount',
            label: '年检金额',
            minWidth: 150,
            formatter: (row: VehicleInspection) =>
              formatSensitiveNumberWithAffix(row.inspectionAmount, { suffix: ' 元' })
          }
        ]
      : []),
    { prop: 'vehicleOffice', label: '车管所', minWidth: 160 },
    {
      prop: 'expireDate',
      label: '到期日期',
      minWidth: 150,
      formatter: (row) => formatDate(row.expireDate)
    }
  ])
</script>
