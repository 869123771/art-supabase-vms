<template>
  <ArtPageShell
    class="vehicle-query-detail"
    :loading="page.loading"
    loading-mode="skeleton"
    :error="page.error"
    :empty="!page.vehicle"
    empty-text="未找到车辆信息"
    empty-description="请返回车辆查询重新选择，或刷新后重试。"
    @retry="loadVehicle"
  >
    <ArtPageHeader
      :title="page.vehicle?.plateNo || '车辆综合查询'"
      :subtitle="vehicleSubtitle"
      show-back
      @back="goBack"
    />

    <VehicleQuerySummary
      v-if="page.vehicle"
      :vehicle="page.vehicle"
      :summary="page.summary"
      @analyze="openHealthAdvisor"
    />

    <div v-if="page.vehicle" class="vehicle-query-detail__body art-card-xs">
      <VehicleQuerySideTabs v-model="page.activeTab" :tabs="tabs" />
      <main class="vehicle-query-detail__content">
        <component :is="activePanel" :vehicle="page.vehicle" />
      </main>
    </div>

    <VehicleHealthAdvisorDrawer ref="healthAdvisorRef" />

    <template #empty-action>
      <ElButton type="primary" plain @click="goBack">返回车辆查询</ElButton>
    </template>
  </ArtPageShell>
</template>

<script setup lang="ts">
  import { fetchVehicleArchiveDetail } from '@vms/api'
  import VehicleQuerySummary from '../modules/vehicle-query-summary.vue'
  import VehicleQuerySideTabs from '../modules/vehicle-query-side-tabs.vue'
  import VehicleViewPanel from '../modules/vehicle-view-panel.vue'
  import ArchivePanel from '../modules/archive-panel.vue'
  import DriverPanel from '../modules/driver-panel.vue'
  import PartsPanel from '../modules/parts-panel.vue'
  import InsurancePanel from '../modules/insurance-panel.vue'
  import InspectionPanel from '../modules/inspection-panel.vue'
  import ViolationPanel from '../modules/violation-panel.vue'
  import AccidentPanel from '../modules/accident-panel.vue'
  import MaintenancePanel from '../modules/maintenance-panel.vue'
  import RoutineInspectionPanel from '../modules/routine-inspection-panel.vue'
  import MileagePanel from '../modules/mileage-panel.vue'
  import DevicePanel from '../modules/device-panel.vue'
  import VehicleHealthAdvisorDrawer from '../modules/vehicle-health-advisor-drawer.vue'
  import type {
    VehicleArchive,
    VehicleQuerySummary as VehicleSummaryData,
    VehicleQueryTab,
    VehicleQueryTabKey
  } from '../modules/types'
  import { loadVehicleQuerySummary } from '../modules/load-vehicle-query-summary'

  defineOptions({ name: 'VehicleQueryDetail' })

  interface PageState {
    loading: boolean
    error: Error | null
    activeTab: VehicleQueryTabKey
    vehicle?: VehicleArchive
    summary: VehicleSummaryData
  }

  interface HealthAdvisorExpose {
    handleOpen: (data: { vehicleId: string; plateNo: string }) => Promise<void>
  }

  const route = useRoute()
  const router = useRouter()
  const healthAdvisorRef = ref<HealthAdvisorExpose>()

  const page = reactive<PageState>({
    loading: false,
    error: null,
    activeTab: 'view',
    summary: {}
  })

  const tabs: VehicleQueryTab[] = [
    { key: 'view', label: '车辆视图' },
    { key: 'archive', label: '车辆档案' },
    { key: 'driver', label: '司机管理' },
    { key: 'parts', label: '车辆零部件' },
    { key: 'insurance', label: '车辆保险' },
    { key: 'inspection', label: '车辆年检' },
    { key: 'violation', label: '车辆违章' },
    { key: 'accident', label: '事故记录' },
    { key: 'maintenance', label: '维修保养记录' },
    { key: 'routine', label: '例检记录' },
    { key: 'mileage', label: '里程记录' },
    { key: 'device', label: '绑定设备' }
  ]

  const panelMap = {
    view: VehicleViewPanel,
    archive: ArchivePanel,
    driver: DriverPanel,
    parts: PartsPanel,
    insurance: InsurancePanel,
    inspection: InspectionPanel,
    violation: ViolationPanel,
    accident: AccidentPanel,
    maintenance: MaintenancePanel,
    routine: RoutineInspectionPanel,
    mileage: MileagePanel,
    device: DevicePanel
  }

  const activePanel = computed(() => panelMap[page.activeTab])
  const vehicleSubtitle = computed(() => {
    if (!page.vehicle) return '集中查看车辆档案、合规、运营、维保与设备信息'
    return [page.vehicle.companyName, page.vehicle.vin].filter(Boolean).join(' / ') || '--'
  })

  const openHealthAdvisor = (): void => {
    const vehicleId = page.vehicle?.id
    const plateNo = page.vehicle?.plateNo
    if (!vehicleId || !plateNo) return
    void healthAdvisorRef.value?.handleOpen({ vehicleId, plateNo })
  }

  onMounted(() => {
    void loadVehicle()
  })

  const loadVehicle = async (): Promise<void> => {
    const id = String(route.params.id || '')
    if (!id) {
      page.error = new Error('缺少车辆档案标识')
      return
    }

    page.loading = true
    page.error = null
    try {
      const { data } = await fetchVehicleArchiveDetail(id)
      if (!data) {
        page.vehicle = undefined
        page.summary = {}
        return
      }

      const { summary } = await loadVehicleQuerySummary(id)
      page.vehicle = data
      page.summary = summary
    } catch (error) {
      page.vehicle = undefined
      page.summary = {}
      page.error = error instanceof Error ? error : new Error('车辆综合信息加载失败')
    } finally {
      page.loading = false
    }
  }

  const goBack = (): void => {
    void router.push('/vms/vehicle-query')
  }
</script>

<style scoped lang="scss">
  .vehicle-query-detail {
    min-height: 100%;
    padding: var(--art-space-4);
    background: var(--art-main-bg-color);

    &__body {
      display: grid;
      grid-template-columns: 136px minmax(0, 1fr);
      min-height: calc(100vh - 330px);
      margin-top: var(--art-space-4);
    }

    &__content {
      min-width: 0;
      padding: 28px 40px 48px;
      overflow: hidden;
    }

    :deep(.vehicle-query-summary) {
      margin-top: var(--art-space-3);
    }
  }

  @media (width <= 900px) {
    .vehicle-query-detail {
      &__body {
        grid-template-columns: 1fr;
      }

      &__content {
        padding: 20px 16px 32px;
      }
    }
  }
</style>
