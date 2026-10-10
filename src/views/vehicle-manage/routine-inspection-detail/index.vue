<template>
  <ArtPageShell
    class="routine-inspection-detail min-h-full p-4 bg-[var(--art-main-bg-color)]"
    :loading="page.loading"
    loading-mode="skeleton"
    :error="page.error"
    :empty="!detail.data"
    empty-text="暂无例检记录详情"
    empty-description="请返回例检记录列表重新选择，或刷新后重试。"
    @retry="loadDetail"
  >
    <ArtPageHeader
      :title="detail.data?.routineInspectionNo || '例检记录详情'"
      :subtitle="
        [detail.data?.plateNo, detail.data?.companyName].filter(Boolean).join(' / ') || '--'
      "
      show-back
      @back="goBack"
    />

    <section
      class="routine-inspection-detail__summary art-card-xs mt-3 grid gap-4 p-4 min-[901px]:grid-cols-3"
    >
      <div class="routine-inspection-detail__summary-item flex min-w-0 flex-col gap-2">
        <span class="text-[var(--el-text-color-secondary)]">例检类型</span>
        <strong class="text-lg font-semibold wrap-anywhere">
          <ArtDictDisplay
            dict-code="vehicleRoutineInspectionType"
            :value="detail.data?.inspectionType"
            display="auto"
          />
        </strong>
      </div>
      <div
        class="routine-inspection-detail__summary-item flex min-w-0 flex-col gap-2"
        v-if="canViewField(fieldAccess, 'inspectionFindings')"
      >
        <span class="text-[var(--el-text-color-secondary)]">检查结果</span>
        <strong class="text-lg font-semibold wrap-anywhere">
          <ArtDictDisplay
            dict-code="vehicleRoutineInspectionResult"
            :value="detail.data?.checkResult"
            display="auto"
          />
        </strong>
      </div>
      <div
        v-if="canViewField(fieldAccess, 'documents')"
        class="routine-inspection-detail__summary-item flex min-w-0 flex-col gap-2"
      >
        <span class="text-[var(--el-text-color-secondary)]">附件数量</span>
        <strong class="text-lg font-semibold wrap-anywhere">{{
          detail.data?.attachmentsMasked ? '***' : (detail.data?.attachments?.length ?? 0)
        }}</strong>
      </div>
    </section>

    <div class="routine-inspection-detail__content art-card-xs mt-3 flex flex-col gap-6 p-5">
      <ArtPageSection title="基础信息" class="routine-inspection-detail__section">
        <ArtDescriptions
          :data="descriptionData"
          :items="descriptionItems"
          :columns="2"
          :label-width="128"
        />
      </ArtPageSection>

      <ArtPageSection
        title="检查情况"
        v-if="canViewField(fieldAccess, 'inspectionFindings')"
        class="routine-inspection-detail__section"
      >
        <div
          class="routine-inspection-detail__text min-h-12 rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-3.5 py-3 leading-relaxed text-[var(--el-text-color-regular)] wrap-anywhere whitespace-pre-wrap"
        >
          {{ formatArtValue(detail.data?.checkCondition) }}
        </div>
      </ArtPageSection>

      <ArtPageSection
        title="处理方式"
        v-if="canViewField(fieldAccess, 'remediationDetails')"
        class="routine-inspection-detail__section"
      >
        <div
          class="routine-inspection-detail__text min-h-12 rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-3.5 py-3 leading-relaxed text-[var(--el-text-color-regular)] wrap-anywhere whitespace-pre-wrap"
        >
          {{ formatArtValue(detail.data?.handlingMethod) }}
        </div>
      </ArtPageSection>

      <ArtPageSection
        title="备注"
        class="routine-inspection-detail__section"
        v-if="canViewField(fieldAccess, 'remediationDetails')"
      >
        <div
          class="routine-inspection-detail__text min-h-12 rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-3.5 py-3 leading-relaxed text-[var(--el-text-color-regular)] wrap-anywhere whitespace-pre-wrap"
          >{{ formatArtValue(detail.data?.remark) }}</div
        >
      </ArtPageSection>

      <ArtPageSection
        title="例检附件"
        v-if="canViewField(fieldAccess, 'documents')"
        class="routine-inspection-detail__section"
      >
        <div
          v-if="detail.data?.attachmentsMasked"
          class="routine-inspection-detail__text min-h-12 rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-3.5 py-3 leading-relaxed text-[var(--el-text-color-regular)] wrap-anywhere whitespace-pre-wrap"
        >
          附件内容已脱敏
        </div>
        <ArtTable
          v-else
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
  import ArtDictDisplay from '@/components/core/base/art-dict-display/index.vue'
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types'
  import { fetchVehicleRoutineInspectionDetail } from '@vms/api'
  import { attachmentTableLink } from '@/components/core/media/art-file-viewer/table-link'
  import { canViewField } from '@/utils/field-permission'

  defineOptions({ name: 'VehicleRoutineInspectionDetail' })

  type RoutineInspection = Api.Vms.VehicleManage.VehicleRoutineInspectionRecord
  type Attachment = Api.Vms.VehicleManage.VehicleAttachment

  const route = useRoute()
  const router = useRouter()
  const page = reactive<{ loading: boolean; error: Error | null }>({ loading: false, error: null })
  const detail = reactive<{ data?: RoutineInspection }>({ data: undefined })
  const fieldAccess = computed(() => detail.data?.fieldAccess ?? {})
  const descriptionData = computed<Partial<RoutineInspection>>(() => detail.data ?? {})
  const descriptionItems = computed<ArtDescriptionItem<Partial<RoutineInspection>>[]>(() => [
    { key: 'plateNo', label: '车牌号', field: 'plateNo' },
    { key: 'companyName', label: '所属公司', field: 'companyName' },
    {
      key: 'routineInspectionNo',
      label: '例检编号',
      field: 'routineInspectionNo',
      copyable: true
    },
    {
      key: 'inspectionType',
      label: '例检类型',
      field: 'inspectionType',
      dictCode: 'vehicleRoutineInspectionType',
      dictDisplay: 'text'
    },
    { key: 'inspectionTime', label: '例检时间', field: 'inspectionTime', format: 'datetime' },
    ...(canViewField(fieldAccess.value, 'responsiblePeople')
      ? ([
          { key: 'inspector', label: '检查人', field: 'inspector' },
          { key: 'driverName', label: '驾驶员', field: 'driverName' }
        ] as ArtDescriptionItem<Partial<RoutineInspection>>[])
      : []),
    ...(canViewField(fieldAccess.value, 'inspectionFindings')
      ? ([
          {
            key: 'checkResult',
            label: '检查结果',
            field: 'checkResult',
            dictCode: 'vehicleRoutineInspectionResult',
            dictDisplay: 'text'
          }
        ] as ArtDescriptionItem<Partial<RoutineInspection>>[])
      : [])
  ])

  const attachmentColumns: ColumnOption<Attachment>[] = [
    { type: 'globalIndex', label: '序号', width: 56 },
    { prop: 'name', label: '附件名称', minWidth: 180, link: attachmentTableLink },
    {
      prop: 'fileType',
      label: '格式类型',
      width: 110,
      dict: { code: 'FILE_EXTENSION_LABEL_MAP', display: 'text' }
    },
    { prop: 'fileSize', label: '附件大小', width: 110 },
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
      page.error = new Error('缺少例检记录标识')
      return
    }
    page.loading = true
    page.error = null
    try {
      const { data, error } = await fetchVehicleRoutineInspectionDetail(id, {
        showErrorMessage: false
      })
      if (error) throw error
      detail.data = data ? { ...data, attachments: data.attachments ?? [] } : undefined
    } catch (error) {
      page.error =
        error instanceof Error
          ? error
          : new Error(getFriendlySupabaseErrorMessage(error, '例检记录详情加载失败'), {
              cause: error
            })
    } finally {
      page.loading = false
    }
  }

  const goBack = (): void => {
    void router.push('/vms/vehicle-manage/routine-inspection')
  }
</script>
