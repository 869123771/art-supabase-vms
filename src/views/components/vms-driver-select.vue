<template>
  <ArtTableSingleSelect
    :model-value="modelValue ?? undefined"
    :selected-data="selectedDriver"
    :api-fn="fetchDrivers"
    :columns="columns"
    row-key="id"
    label-key="driverName"
    title="选择驾驶员"
    subtitle="数据来源：司机管理"
    :placeholder="vehicleId ? '请选择驾驶员（选填）' : '请先选择车辆'"
    search-placeholder="输入司机姓名"
    empty-text="暂无可选司机"
    empty-description="请先在司机管理中维护司机资料。"
    clearable
    :disabled="disabled || !vehicleId"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
  import ArtTableSingleSelect from '@/components/core/forms/art-data-select/table-single.vue'
  import type {
    DataSelectColumn,
    DataSelectRecord
  } from '@/components/core/forms/art-data-select/types'
  import { fetchVehicleDriverOptions, type VmsDriverReference } from '@vms/api'

  const props = defineProps<{
    modelValue?: string | null
    vehicleId?: string | null
    driverName?: string
    driverPhone?: string
    disabled?: boolean
  }>()
  const emit = defineEmits<{
    change: [driver: VmsDriverReference | null]
  }>()

  const selectedDriver = computed<VmsDriverReference[]>(() =>
    props.modelValue
      ? [{ id: props.modelValue, driverName: props.driverName ?? '', phone: props.driverPhone }]
      : []
  )
  const columns: DataSelectColumn[] = [
    { prop: 'driverName', label: '司机姓名', minWidth: 160 },
    {
      prop: 'driverType',
      label: '司机类型',
      width: 110,
      dict: { code: 'tmsDriverType', display: 'auto' }
    },
    {
      prop: 'licenseType',
      label: '准驾车型',
      width: 120,
      dict: { code: 'tmsDriverLicenseType', display: 'auto' }
    }
  ]

  const fetchDrivers = async (params: { keyword: string }) => {
    if (!props.vehicleId) return { data: [], total: 0 }
    const result = await fetchVehicleDriverOptions(props.vehicleId, {
      driverName: params.keyword,
      maxRows: 200
    })
    return { data: result.data ?? [], total: result.data?.length ?? 0 }
  }

  const handleChange = (_value: unknown, rows: DataSelectRecord[]): void => {
    emit('change', (rows[0] as VmsDriverReference | undefined) ?? null)
  }
</script>
