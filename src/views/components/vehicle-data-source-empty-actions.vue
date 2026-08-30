<template>
  <ArtDataSourceEmptyActions :resource-name="config.resourceName" :actions="config.actions" />
</template>

<script setup lang="ts">
  import ArtDataSourceEmptyActions, {
    type ArtDataSourceEmptyAction
  } from '@/components/business/art-data-source-empty-actions/index.vue'

  defineOptions({ name: 'VehicleDataSourceEmptyActions' })

  type VehicleDataSource = 'part' | 'vehicle'

  interface SourceConfig {
    resourceName: string
    actions: readonly ArtDataSourceEmptyAction[]
  }

  const props = defineProps<{ source: VehicleDataSource }>()

  const sourceConfigs: Record<VehicleDataSource, SourceConfig> = {
    part: {
      resourceName: '零部件资料',
      actions: [{ label: '去维护零部件', routeName: 'VehicleParts', icon: 'ri:settings-5-line' }]
    },
    vehicle: {
      resourceName: '车辆档案',
      actions: [
        {
          label: '去维护车辆档案',
          routeName: 'VehicleArchiveManage',
          permission: 'VehicleArchive:View',
          icon: 'ri:truck-line'
        }
      ]
    }
  }

  const config = computed(() => sourceConfigs[props.source])
</script>
