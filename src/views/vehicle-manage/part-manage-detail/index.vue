<template>
  <ArtPageShell
    class="vehicle-part-usage-detail min-h-full p-4 bg-[var(--art-main-bg-color)]"
    :loading="page.loading"
    loading-mode="skeleton"
    :error="page.error"
    :empty="!detail.data"
    empty-text="暂无零部件详情"
    empty-description="请返回零部件记录列表重新选择，或刷新后重试。"
    @retry="loadDetail"
  >
    <ArtPageHeader
      :title="detail.data?.plateNo || '零部件详情'"
      :subtitle="detail.data?.partName || '--'"
      show-back
      @back="goBack"
    />

    <section
      class="vehicle-part-usage-detail__summary art-card-xs mt-3 grid gap-4 p-4 grid-cols-2 min-[721px]:grid-cols-4"
    >
      <div class="vehicle-part-usage-detail__summary-item flex min-w-0 flex-col gap-2">
        <span class="text-[var(--el-text-color-secondary)]">零部件状态</span>
        <strong class="text-lg font-semibold wrap-anywhere">
          <ArtDictDisplay
            dict-code="vehiclePartUsageStatus"
            :value="detail.data?.status"
            display="auto"
          />
        </strong>
      </div>
      <div
        class="vehicle-part-usage-detail__summary-item flex min-w-0 flex-col gap-2"
        v-if="canViewField(fieldAccess, 'traceabilityTag')"
      >
        <span class="text-[var(--el-text-color-secondary)]">RFID 标签</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          detail.data?.rfidTag || '待绑定'
        }}</strong>
      </div>
      <div
        v-if="canViewField(fieldAccess, 'lifecycleLimits')"
        class="vehicle-part-usage-detail__summary-item flex min-w-0 flex-col gap-2"
      >
        <span class="text-[var(--el-text-color-secondary)]">启用日期</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          detail.data?.lifecycleLimitsMasked ? '***' : detail.data?.enableDate || '--'
        }}</strong>
      </div>
      <div
        v-if="canViewField(fieldAccess, 'lifecycleLimits')"
        class="vehicle-part-usage-detail__summary-item flex min-w-0 flex-col gap-2"
      >
        <span class="text-[var(--el-text-color-secondary)]">已使用里程</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          detail.data?.lifecycleLimitsMasked
            ? '***'
            : formatSensitiveNumberWithAffix(detail.data?.usedMileage, {
                suffix: ' km',
                numberFormat: { maximumFractionDigits: 3 }
              })
        }}</strong>
      </div>
    </section>

    <div class="vehicle-part-usage-detail__content art-card-xs mt-3 flex flex-col gap-6 p-5">
      <ArtPageSection title="零部件信息">
        <ArtDescriptions
          :data="descriptionData"
          :items="partItems"
          :columns="3"
          :label-width="138"
        />
      </ArtPageSection>

      <ArtPageSection title="零部件使用">
        <ArtDescriptions
          :data="descriptionData"
          :items="usageItems"
          :columns="3"
          :label-width="138"
        />
      </ArtPageSection>
    </div>
  </ArtPageShell>
</template>

<script setup lang="ts">
  import { getFriendlySupabaseErrorMessage } from '@/utils/supabase'
  import ArtDescriptions from '@/components/core/base/art-descriptions/index.vue'
  import ArtDictDisplay from '@/components/core/base/art-dict-display/index.vue'
  import type { ArtDescriptionItem } from '@/components/core/base/art-descriptions/types'
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import { fetchVehiclePartUsageDetail } from '@vms/api'
  import { canViewField, formatSensitiveNumberWithAffix } from '@/utils/field-permission'

  defineOptions({ name: 'VehiclePartUsageDetail' })

  type Usage = Api.Vms.VehicleManage.VehiclePartUsage

  const route = useRoute()
  const router = useRouter()
  const page = reactive<{ loading: boolean; error: Error | null }>({ loading: false, error: null })
  const detail = reactive<{ data?: Usage }>({ data: undefined })
  const fieldAccess = computed(() => detail.data?.fieldAccess ?? {})
  const descriptionData = computed<Partial<Usage>>(() => detail.data ?? {})

  const partItems = computed<ArtDescriptionItem<Partial<Usage>>[]>(() => [
    { key: 'plateNo', label: '车牌号', field: 'plateNo' },
    { key: 'companyName', label: '所属公司', field: 'companyName' },
    { key: 'partType', label: '零部件类型', field: 'partType', dictCode: 'vehiclePartType' },
    { key: 'partName', label: '零部件名称', field: 'partName' },
    { key: 'partCode', label: '零部件编码', field: 'partCode', copyable: true },
    { key: 'categoryName', label: '零部件类别', field: 'categoryName' },
    { key: 'brand', label: '品牌', field: 'brand' },
    { key: 'model', label: '型号', field: 'model' },
    { key: 'unit', label: '单位', field: 'unit' },
    {
      key: 'isConsumable',
      label: '是否易损/耗件',
      value: (data: Partial<Usage>) => getBooleanDictValue(data.isConsumable),
      dictCode: 'commonBoolean',
      dictDisplay: 'text'
    },
    {
      key: 'qualityCategory',
      label: '品质分类',
      field: 'qualityCategory',
      dictCode: 'vehiclePartQualityCategory',
      dictDisplay: 'text'
    },
    { key: 'manufacturer', label: '生产厂商', field: 'manufacturer' },
    ...(canViewField(fieldAccess.value, 'supplierDetails')
      ? ([
          { key: 'supplierName', label: '供应厂商', field: 'supplierName' },
          {
            key: 'supplierContact',
            label: '供应厂商联系人',
            field: 'supplierContact',
            span: 2
          }
        ] as ArtDescriptionItem<Partial<Usage>>[])
      : [])
  ])

  const warrantyText = computed(() => {
    if (detail.data?.lifecycleLimitsMasked) return '***'
    if (detail.data?.warrantyMode === 'vehicle') return '随整车质保'
    return (
      [
        detail.data?.warrantyMileage ? `${detail.data.warrantyMileage}公里` : '',
        detail.data?.warrantyDuration ? `${detail.data.warrantyDuration}个月` : ''
      ]
        .filter(Boolean)
        .join(' / ') || '--'
    )
  })

  const serviceLifeText = computed(() => {
    if (detail.data?.lifecycleLimitsMasked) return '***'
    return (
      [
        detail.data?.serviceMileageEnabled && detail.data.serviceMileage
          ? `使用里程 ${detail.data.serviceMileage} 公里`
          : '',
        detail.data?.serviceYearsEnabled && detail.data.serviceYears
          ? `使用年限 ${detail.data.serviceYears} 年`
          : ''
      ]
        .filter(Boolean)
        .join(' / ') || '--'
    )
  })

  const usageItems = computed<ArtDescriptionItem<Partial<Usage>>[]>(() => [
    ...(canViewField(fieldAccess.value, 'traceabilityTag')
      ? ([
          {
            key: 'rfidTag',
            label: 'RFID标签',
            value: (data: Partial<Usage>) => (data.rfidEnabled ? data.rfidTag : '否')
          }
        ] as ArtDescriptionItem<Partial<Usage>>[])
      : []),
    ...(canViewField(fieldAccess.value, 'lifecycleLimits')
      ? ([
          {
            key: 'enableDate',
            label: '启用日期',
            value: detail.data?.lifecycleLimitsMasked ? '***' : detail.data?.enableDate || '--'
          },
          { key: 'warranty', label: '质保期', value: warrantyText.value },
          { key: 'serviceLife', label: '使用寿命', value: serviceLifeText.value, span: 2 },
          {
            key: 'usedMileage',
            label: '已使用里程',
            value: detail.data?.lifecycleLimitsMasked
              ? '***'
              : formatSensitiveNumberWithAffix(detail.data?.usedMileage, {
                  suffix: ' 公里',
                  numberFormat: { maximumFractionDigits: 3 }
                })
          }
        ] as ArtDescriptionItem<Partial<Usage>>[])
      : []),
    {
      key: 'status',
      label: '状态',
      field: 'status',
      dictCode: 'vehiclePartUsageStatus'
    },
    ...(detail.data?.status === 'scrapped' && canViewField(fieldAccess.value, 'dispositionNotes')
      ? [{ key: 'scrapReason', label: '报废原因', field: 'scrapReason', span: 2 }]
      : []),
    ...(canViewField(fieldAccess.value, 'dispositionNotes')
      ? ([{ key: 'remark', label: '备注', field: 'remark', span: 3 }] as ArtDescriptionItem<
          Partial<Usage>
        >[])
      : [])
  ])

  onMounted(() => {
    void loadDetail()
  })

  const loadDetail = async (): Promise<void> => {
    const id = String(route.params.id || '')
    if (!id) {
      page.error = new Error('缺少零部件使用记录标识')
      return
    }
    page.loading = true
    page.error = null
    try {
      const { data, error } = await fetchVehiclePartUsageDetail(id, { showErrorMessage: false })
      if (error) throw error
      detail.data = data ?? undefined
    } catch (error) {
      page.error =
        error instanceof Error
          ? error
          : new Error(getFriendlySupabaseErrorMessage(error, '零部件详情加载失败'), {
              cause: error
            })
    } finally {
      page.loading = false
    }
  }

  const goBack = (): void => {
    void router.push('/vms/vehicle-manage/part-manage')
  }

  const getBooleanDictValue = (value?: boolean | null): string | undefined =>
    value === undefined || value === null ? undefined : String(value)
</script>

<style scoped lang="scss">
  @media (width <= 900px) {
    .vehicle-part-usage-detail
      :deep(.art-descriptions .el-descriptions__body .el-descriptions__table) {
      table-layout: auto;
    }
  }
</style>
