<template>
  <ArtPageShell
    class="vehicle-insurance-detail min-h-full p-4 bg-[var(--art-main-bg-color)]"
    :loading="page.loading"
    loading-mode="skeleton"
    :error="page.error"
    :empty="!detail.data"
    empty-text="暂无车辆保险详情"
    empty-description="请返回车辆保险列表重新选择，或刷新后重试。"
    @retry="loadDetail"
  >
    <ArtPageHeader
      :title="detail.data?.plateNo || '车辆保险详情'"
      :subtitle="detail.data?.companyName || '--'"
      show-back
      @back="goBack"
    />

    <section
      class="vehicle-insurance-detail__summary art-card-xs mt-3 grid gap-4 p-4 min-[901px]:grid-cols-3"
    >
      <div class="vehicle-insurance-detail__summary-item flex min-w-0 flex-col gap-2">
        <span class="text-[var(--el-text-color-secondary)]">商业险到期</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          formatArtValue(detail.data?.commercialExpireDate, 'date')
        }}</strong>
      </div>
      <div class="vehicle-insurance-detail__summary-item flex min-w-0 flex-col gap-2">
        <span class="text-[var(--el-text-color-secondary)]">交强险到期</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          formatArtValue(detail.data?.compulsoryExpireDate, 'date')
        }}</strong>
      </div>
      <div
        class="vehicle-insurance-detail__summary-item flex min-w-0 flex-col gap-2"
        v-if="canViewInsuranceField('documents')"
      >
        <span class="text-[var(--el-text-color-secondary)]">附件数量</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          detail.data?.attachments?.length ?? 0
        }}</strong>
      </div>
    </section>

    <div class="vehicle-insurance-detail__content art-card-xs mt-3 flex flex-col gap-6 p-5">
      <ArtPageSection title="保险信息" class="vehicle-insurance-detail__section">
        <ArtDescriptions
          :data="descriptionData"
          :items="vehicleItems"
          :columns="2"
          :label-width="128"
        />
      </ArtPageSection>

      <div class="vehicle-insurance-detail__insurance-grid grid gap-4 min-[901px]:grid-cols-2">
        <ArtPageSection title="商业险" class="vehicle-insurance-detail__section">
          <ArtDescriptions
            :data="descriptionData"
            :items="commercialItems"
            :columns="1"
            :label-width="128"
          />
        </ArtPageSection>

        <ArtPageSection title="交强险" class="vehicle-insurance-detail__section">
          <ArtDescriptions
            :data="descriptionData"
            :items="compulsoryItems"
            :columns="1"
            :label-width="128"
          />
        </ArtPageSection>
      </div>

      <ArtPageSection title="备注" class="vehicle-insurance-detail__section">
        <div
          class="vehicle-insurance-detail__remark min-h-12 rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-3.5 py-3 leading-relaxed text-[var(--el-text-color-regular)] wrap-anywhere whitespace-pre-wrap"
          >{{ formatArtValue(detail.data?.remark) }}</div
        >
      </ArtPageSection>

      <ArtPageSection
        title="保险附件"
        class="vehicle-insurance-detail__section"
        v-if="canViewInsuranceField('documents')"
      >
        <ArtTable
          :data="detail.data?.attachments ?? []"
          :columns="attachmentColumns"
          :pagination="undefined"
          :show-table-header="false"
          empty-height="180px"
        />
      </ArtPageSection>
    </div>
  </ArtPageShell>
</template>

<script setup lang="tsx">
  import { getFriendlySupabaseErrorMessage } from '@/utils/supabase'
  import BusinessAttachmentRowActions from '@/components/business/business-attachment-row-actions/index.vue'
  import { formatArtValue } from '@/utils/ui/format'
  import ArtDescriptions from '@/components/core/base/art-descriptions/index.vue'
  import type { ArtDescriptionItem } from '@/components/core/base/art-descriptions/types'
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types'
  import { fetchVehicleInsuranceDetail } from '@vms/api'
  import { attachmentTableLink } from '@/components/core/media/art-file-viewer/table-link'
  import { canViewField, formatSensitiveNumberWithAffix } from '@/utils/field-permission'

  defineOptions({ name: 'VehicleInsuranceDetail' })

  type VehicleInsurance = Api.Vms.VehicleManage.VehicleInsurance
  type Attachment = Api.Vms.VehicleManage.VehicleAttachment
  type InsuranceFieldKey = Api.Vms.VehicleManage.VehicleInsuranceFieldKey

  const route = useRoute()
  const router = useRouter()
  const page = reactive<{ loading: boolean; error: Error | null }>({ loading: false, error: null })
  const detail = reactive<{ data?: VehicleInsurance }>({ data: undefined })
  const descriptionData = computed<Partial<VehicleInsurance>>(() => detail.data ?? {})
  const canViewInsuranceField = (field: InsuranceFieldKey): boolean =>
    canViewField(detail.data?.fieldAccess, field)
  const vehicleItems: ArtDescriptionItem<Partial<VehicleInsurance>>[] = [
    { key: 'plateNo', label: '车牌号', field: 'plateNo' },
    { key: 'companyName', label: '所属公司', field: 'companyName' }
  ]
  const commercialItems = computed<ArtDescriptionItem<Partial<VehicleInsurance>>[]>(() => [
    ...(canViewInsuranceField('policyNumbers')
      ? [
          {
            key: 'commercialPolicyNo',
            label: '保单号',
            field: 'commercialPolicyNo',
            copyable: true
          } as ArtDescriptionItem<Partial<VehicleInsurance>>
        ]
      : []),
    { key: 'commercialCompanyName', label: '保险公司', field: 'commercialCompanyName' },
    {
      key: 'commercialInsureDate',
      label: '投保日期',
      field: 'commercialInsureDate',
      format: 'date'
    },
    ...(canViewInsuranceField('premiumAmounts')
      ? [
          {
            key: 'commercialPremium',
            label: '投保金额',
            field: 'commercialPremium',
            formatter: (value) =>
              formatSensitiveNumberWithAffix(value as number | string | null | undefined, {
                suffix: ' 元'
              })
          } as ArtDescriptionItem<Partial<VehicleInsurance>>
        ]
      : []),
    {
      key: 'commercialExpireDate',
      label: '到期日期',
      field: 'commercialExpireDate',
      format: 'date'
    }
  ])
  const compulsoryItems = computed<ArtDescriptionItem<Partial<VehicleInsurance>>[]>(() => [
    ...(canViewInsuranceField('policyNumbers')
      ? [
          {
            key: 'compulsoryPolicyNo',
            label: '保单号',
            field: 'compulsoryPolicyNo',
            copyable: true
          } as ArtDescriptionItem<Partial<VehicleInsurance>>
        ]
      : []),
    { key: 'compulsoryCompanyName', label: '保险公司', field: 'compulsoryCompanyName' },
    {
      key: 'compulsoryInsureDate',
      label: '投保日期',
      field: 'compulsoryInsureDate',
      format: 'date'
    },
    ...(canViewInsuranceField('premiumAmounts')
      ? [
          {
            key: 'compulsoryPremium',
            label: '投保金额',
            field: 'compulsoryPremium',
            formatter: (value) =>
              formatSensitiveNumberWithAffix(value as number | string | null | undefined, {
                suffix: ' 元'
              })
          } as ArtDescriptionItem<Partial<VehicleInsurance>>
        ]
      : []),
    {
      key: 'compulsoryExpireDate',
      label: '到期日期',
      field: 'compulsoryExpireDate',
      format: 'date'
    }
  ])

  const attachmentColumns: ColumnOption<Attachment>[] = [
    { type: 'globalIndex', label: '序号', width: 80 },
    { prop: 'name', label: '附件名称', minWidth: 240, link: attachmentTableLink },
    {
      prop: 'fileType',
      label: '格式类型',
      width: 120,
      dict: { code: 'FILE_EXTENSION_LABEL_MAP', display: 'text' }
    },
    { prop: 'fileSize', label: '附件大小', width: 120 },
    {
      prop: 'operation',
      label: '操作',
      width: 104,
      fixed: 'right',
      formatter: (row) => <BusinessAttachmentRowActions file={row} />
    }
  ]

  onMounted(() => {
    void loadDetail()
  })

  const loadDetail = async (): Promise<void> => {
    const id = String(route.params.id || '')
    if (!id) {
      page.error = new Error('缺少保险记录标识')
      return
    }
    page.loading = true
    page.error = null
    try {
      const { data, error } = await fetchVehicleInsuranceDetail(id, { showErrorMessage: false })
      if (error) throw error
      detail.data = data ? { ...data, attachments: data.attachments ?? [] } : undefined
    } catch (error) {
      page.error =
        error instanceof Error
          ? error
          : new Error(getFriendlySupabaseErrorMessage(error, '车辆保险详情加载失败'), {
              cause: error
            })
    } finally {
      page.loading = false
    }
  }

  const goBack = (): void => {
    void router.push('/vms/vehicle-manage/vehicle-insurance')
  }
</script>
