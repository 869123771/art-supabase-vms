<template>
  <ArtPageSection title="车辆视图">
    <div class="vehicle-view-panel">
      <p class="vehicle-view-panel__description">车辆结构示意，用于查看档案中的车身资料。</p>
      <div class="vehicle-view-panel__canvas">
        <svg viewBox="0 0 980 420" aria-hidden="true" focusable="false">
          <path
            class="vehicle-view-panel__body"
            d="M150 255 L180 165 L295 165 L330 220 L760 220 L790 315 L170 315 Z"
          />
          <path class="vehicle-view-panel__body" d="M330 90 H840 Q870 90 870 120 V315 H330 Z" />
          <path class="vehicle-view-panel__line" d="M350 120 H835 V220 H350 Z" />
          <path
            class="vehicle-view-panel__line"
            d="M198 180 L280 180 Q305 180 315 220 L185 220 Z"
          />
          <circle class="vehicle-view-panel__wheel" cx="260" cy="315" r="52" />
          <circle class="vehicle-view-panel__wheel" cx="700" cy="315" r="52" />
          <circle class="vehicle-view-panel__wheel-inner" cx="260" cy="315" r="18" />
          <circle class="vehicle-view-panel__wheel-inner" cx="700" cy="315" r="18" />
        </svg>
      </div>
      <dl class="vehicle-view-panel__facts">
        <div>
          <dt>轮胎数</dt>
          <dd>{{ vehicle.tireCount ?? '--' }}</dd>
        </div>
        <div>
          <dt>例检启用日期</dt>
          <dd>{{ formatDate(vehicle.inspectionStartDate) }}</dd>
        </div>
      </dl>
      <p class="vehicle-view-panel__note">
        档案未提供实时胎压或损伤数据；灭火装置等检测结果请在“例检记录”中核验。
      </p>
    </div>
  </ArtPageSection>
</template>

<script setup lang="ts">
  import ArtPageSection from '@/components/core/layouts/art-page-section/index.vue'
  import type { VehicleArchive } from './types'
  import { formatDate } from './query-format'

  defineOptions({ name: 'VehicleQueryViewPanel' })

  defineProps<{
    vehicle: VehicleArchive
  }>()
</script>

<style scoped lang="scss">
  .vehicle-view-panel {
    display: grid;
    gap: 24px;
    padding-top: 16px;

    &__description {
      margin: 0;
      color: var(--art-gray-700);
    }

    &__canvas {
      padding: 16px;
      background: var(--art-gray-100);
      border-radius: var(--art-surface-radius);
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      max-height: 320px;
    }

    &__body {
      fill: var(--art-gray-200);
      stroke: var(--art-gray-700);
      stroke-width: 2;
    }

    &__line {
      fill: none;
      stroke: var(--art-gray-700);
      stroke-width: 2;
    }

    &__wheel {
      fill: var(--art-gray-800);
      stroke: var(--art-gray-800);
    }

    &__wheel-inner {
      fill: var(--art-gray-100);
      stroke: var(--art-gray-800);
      stroke-width: 8;
    }

    &__facts {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 32px;
      padding-bottom: 16px;
      margin: 0;
      border-bottom: 1px solid var(--art-gray-200);

      div {
        min-width: 120px;
      }

      dt {
        color: var(--art-gray-700);
      }

      dd {
        margin: 4px 0 0;
        font-weight: 600;
        color: var(--art-gray-900);
      }
    }

    &__note {
      margin: 0;
      line-height: 1.6;
      color: var(--art-gray-700);
    }
  }
</style>
