<template>
  <div class="vehicle-type-tab">
    <div class="vehicle-type-tab__toolbar">
      <div>
        <h3>车型配置</h3>
        <p>按车型分类维护规格、容积和载重，车辆参选后自动带入。</p>
      </div>
      <span v-if="selectedTenantId" class="vehicle-type-tab__total">
        已配置 {{ profiles.length }} 项规格
      </span>
      <ElSelect
        v-if="isAllTenants"
        v-model="selectedTenantId"
        class="vehicle-type-tab__tenant"
        filterable
        placeholder="选择配置所属租户"
        aria-label="配置所属租户"
      >
        <ElOption
          v-for="tenant in tenantOptions"
          :key="tenant.id"
          :label="tenant.tenantName"
          :value="tenant.id"
        />
      </ElSelect>
    </div>

    <ArtAsyncState
      v-if="!selectedTenantId"
      empty
      empty-text="请先选择租户"
      empty-description="车型配置属于具体租户，选定租户后即可查看和维护。"
    />
    <ArtAsyncState v-else :loading="loading" :error="error" :min-height="360" @retry="loadProfiles">
      <div class="vehicle-type-tab__layout">
        <ArtSectionCard title="车型层级" subtitle="选择分类或具体规格">
          <div class="vehicle-type-tab__tree">
            <div v-for="category in categories" :key="category" class="min-w-0">
              <button
                type="button"
                class="vehicle-type-tab__category"
                :class="{ 'is-active': selectedCategory === category && !selectedId }"
                :aria-current="selectedCategory === category && !selectedId ? 'true' : undefined"
                @click="selectCategory(category)"
              >
                <VehicleTypeArt :category="category" />
                <span>{{ category }}</span>
                <small>{{ categoryProfiles(category).length }}</small>
              </button>
              <button
                v-for="profile in categoryProfiles(category)"
                :key="profile.id"
                type="button"
                class="vehicle-type-tab__profile"
                :class="{ 'is-active': selectedId === profile.id }"
                :aria-current="selectedId === profile.id ? 'true' : undefined"
                @click="selectProfile(profile)"
              >
                <span class="truncate">{{ vehicleTypeProfileLabel(profile) }}</span>
                <small>{{ profile.status === '1' ? '启用' : '禁用' }}</small>
              </button>
            </div>
          </div>
        </ArtSectionCard>

        <div class="vehicle-type-tab__workspace">
          <ArtSectionCard :title="selectedCategory" subtitle="已配置的车型规格">
            <template #actions>
              <ElButton
                v-auth="'VehicleArchive:TypeAdd'"
                type="primary"
                plain
                @click="selectCategory(selectedCategory, true)"
              >
                <ArtSvgIcon icon="ri:add-line" aria-hidden="true" />
                新增规格
              </ElButton>
            </template>
            <div class="vehicle-type-tab__spec-list">
              <button
                v-for="profile in categoryProfiles(selectedCategory)"
                :key="profile.id"
                type="button"
                class="vehicle-type-tab__spec"
                :class="{ 'is-active': selectedId === profile.id }"
                :aria-pressed="selectedId === profile.id"
                @click="selectProfile(profile)"
              >
                <span class="vehicle-type-tab__spec-heading">
                  <strong>{{ vehicleTypeProfileLabel(profile) }}</strong>
                  <ElTag
                    :type="profile.status === '1' ? 'success' : 'info'"
                    size="small"
                    effect="light"
                    round
                  >
                    {{ profile.status === '1' ? '启用' : '禁用' }}
                  </ElTag>
                </span>
                <span>{{ profile.volumeM3 }} 立方米 · {{ profile.loadTons }} 吨</span>
              </button>
              <div
                v-if="!categoryProfiles(selectedCategory).length"
                class="vehicle-type-tab__spec-empty"
              >
                当前分类暂无规格，点击右上角新增。
              </div>
            </div>
          </ArtSectionCard>

          <ArtSectionCard
            :title="selectedId ? '规格详情' : '新增车型规格'"
            :subtitle="
              selectedId ? '维护当前规格参数与展示信息' : `为${selectedCategory}配置新规格`
            "
          >
            <template #actions>
              <ElButton
                v-if="selectedId"
                v-auth="'VehicleArchive:TypeDelete'"
                type="danger"
                plain
                :disabled="saving"
                @click="handleDelete"
              >
                删除规格
              </ElButton>
              <ElButton
                v-auth="selectedId ? 'VehicleArchive:TypeEdit' : 'VehicleArchive:TypeAdd'"
                type="primary"
                :loading="saving"
                @click="handleSave"
              >
                {{ selectedId ? '保存更改' : '创建规格' }}
              </ElButton>
            </template>
            <div class="vehicle-type-tab__detail">
              <div class="vehicle-type-tab__form">
                <ArtForm
                  ref="formRef"
                  v-model="form"
                  :items="formItems"
                  :rules="rules"
                  :span="12"
                  :gutter="16"
                  label-position="top"
                  :disabled="!canEdit"
                  :show-reset="false"
                  :show-submit="false"
                >
                  <template #lengthM>
                    <div class="vehicle-type-tab__metric-field">
                      <div class="vehicle-type-tab__metric-input">
                        <ElInputNumber
                          v-model="form.lengthM"
                          :min="0.01"
                          :precision="2"
                          :step="0.1"
                          :controls="false"
                          :disabled="!canEdit"
                          placeholder="输入实际车长"
                          aria-label="车长，单位米"
                        />
                        <span>米</span>
                      </div>
                      <div v-if="selectedCategory === '半挂车'" class="vehicle-type-tab__presets">
                        <span>常用车长</span>
                        <div>
                          <ElButton
                            v-for="value in SEMI_TRAILER_LENGTHS"
                            :key="value"
                            class="vehicle-type-tab__preset-button"
                            :type="form.lengthM === value ? 'primary' : 'default'"
                            :disabled="!canEdit"
                            @click="applyPreset(value)"
                          >
                            {{ value }} 米
                          </ElButton>
                          <ElButton
                            class="vehicle-type-tab__preset-button"
                            :disabled="!canEdit"
                            @click="form.lengthM = null"
                          >
                            其他 / 自定义
                          </ElButton>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template #loadTons>
                    <div class="vehicle-type-tab__metric-field">
                      <div class="vehicle-type-tab__metric-input">
                        <ElInputNumber
                          v-model="form.loadTons"
                          :min="0.01"
                          :precision="2"
                          :step="0.1"
                          :controls="false"
                          :disabled="!canEdit"
                          placeholder="输入实际载重"
                          aria-label="载重，单位吨"
                        />
                        <span>吨</span>
                      </div>
                      <div v-if="selectedCategory === '按载重'" class="vehicle-type-tab__presets">
                        <span>常用载重</span>
                        <div>
                          <ElButton
                            v-for="value in LOAD_CAPACITY_PRESETS"
                            :key="value"
                            class="vehicle-type-tab__preset-button"
                            :type="form.loadTons === value ? 'primary' : 'default'"
                            :disabled="!canEdit"
                            @click="applyPreset(value)"
                          >
                            {{ value }} 吨
                          </ElButton>
                          <ElButton
                            class="vehicle-type-tab__preset-button"
                            :disabled="!canEdit"
                            @click="form.loadTons = null"
                          >
                            其他 / 自定义
                          </ElButton>
                        </div>
                      </div>
                    </div>
                  </template>
                </ArtForm>
              </div>

              <aside class="vehicle-type-tab__visual">
                <div class="vehicle-type-tab__visual-heading">
                  <strong>车型图片</strong>
                  <span>参选弹窗展示</span>
                </div>
                <div class="vehicle-type-tab__preview">
                  <ElImage v-if="form.imageUrl" :src="form.imageUrl" fit="contain" />
                  <VehicleTypeArt v-else :category="selectedCategory" />
                </div>
                <p>未上传时使用这套共用车型插画。</p>
                <ArtUploadImage
                  v-model="form.imageUrl"
                  title="上传自定义车型图片"
                  :size="88"
                  :limit="1"
                  :readonly="!canEdit"
                />
              </aside>
            </div>
          </ArtSectionCard>
        </div>
      </div>
    </ArtAsyncState>
  </div>
</template>

<script setup lang="ts">
  import { ElButton, ElImage, ElInputNumber, ElOption, ElSelect, ElTag } from 'element-plus'
  import type { FormRules } from 'element-plus'
  import ArtAsyncState from '@/components/core/feedback/art-async-state/index.vue'
  import ArtSectionCard from '@/components/core/surfaces/art-section-card/index.vue'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtUploadImage from '@/components/core/forms/art-upload-image/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import VehicleTypeArt from './vehicle-type-art.vue'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTenantScopeStore } from '@/store/modules/tenantScope'
  import { useUserStore } from '@/store/modules/user'
  import { storeToRefs } from 'pinia'
  import {
    deleteVehicleTypeProfile,
    fetchVehicleTypeProfiles,
    saveVehicleTypeProfile
  } from '@vms/api'
  import {
    LOAD_CAPACITY_PRESETS,
    SEMI_TRAILER_LENGTHS,
    vehicleTypeProfileLabel,
    type VehicleTypeCategory,
    type VehicleTypeProfile
  } from './vehicle-type-catalog'

  interface ProfileForm {
    category: VehicleTypeCategory
    lengthM: number | null
    volumeM3: number | null
    loadTons: number | null
    status: '1' | '2'
    sort: number
    schemeColor: string
    tagStyle: string
    remark: string
    imageUrl: string
  }

  const emit = defineEmits<{ changed: [] }>()
  const { confirmAction } = useArtFeedback()
  const { hasAuth } = useAuth()
  const tenantScopeStore = useTenantScopeStore()
  const userStore = useUserStore()
  const { getDictMap } = storeToRefs(userStore)
  const { effectiveTenantId, isAllTenants, tenantOptions } = storeToRefs(tenantScopeStore)
  const categories = computed(() =>
    (getDictMap.value.vehicleTypeCategory ?? []).map((option) => option.value).filter(Boolean)
  )
  const selectedTenantId = ref(effectiveTenantId.value || '')
  const selectedCategory = ref<VehicleTypeCategory>('半挂车')
  const selectedId = ref<string>()
  const profiles = ref<VehicleTypeProfile[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<Error | null>(null)
  const formRef = ref<InstanceType<typeof ArtForm>>()

  const initialForm = (): ProfileForm => ({
    category: '半挂车',
    lengthM: null,
    volumeM3: null,
    loadTons: null,
    status: '1',
    sort: 10,
    schemeColor: '',
    tagStyle: 'primary',
    remark: '',
    imageUrl: ''
  })
  const form = reactive<ProfileForm>(initialForm())
  const canEdit = computed(() =>
    hasAuth(selectedId.value ? 'VehicleArchive:TypeEdit' : 'VehicleArchive:TypeAdd')
  )

  const categoryProfiles = (category: VehicleTypeCategory): VehicleTypeProfile[] =>
    profiles.value
      .filter((profile) => profile.category === category)
      .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))

  const rules = computed<FormRules<ProfileForm>>(() => ({
    lengthM:
      selectedCategory.value === '按载重'
        ? []
        : [{ required: true, message: '请输入车长', trigger: 'change' }],
    loadTons: [{ required: true, message: '请输入载重', trigger: 'change' }],
    volumeM3: [{ required: true, message: '请输入容积', trigger: 'change' }],
    remark: [{ max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }]
  }))

  const formItems = computed<FormItem[]>(() => [
    {
      label: '车长（米）',
      key: 'lengthM',
      type: 'number',
      span: 24
    },
    {
      label: '容积（立方米）',
      key: 'volumeM3',
      type: 'number',
      span: 12,
      props: { min: 0, precision: 2, step: 0.1, controls: false, class: '!w-full' }
    },
    {
      label: '载重（吨）',
      key: 'loadTons',
      type: 'number',
      span: 12
    },
    {
      label: '排序',
      key: 'sort',
      type: 'number',
      span: 12,
      props: { min: 0, precision: 0, controls: false, class: '!w-full' }
    },
    {
      label: '状态',
      key: 'status',
      type: 'segment',
      span: 12,
      options: [
        { label: '启用', value: '1' },
        { label: '禁用', value: '2' }
      ]
    },
    { label: '方案颜色', key: 'schemeColor', type: 'colorPicker', span: 12 },
    { label: '标签样式', key: 'tagStyle', type: 'tagStyleSelect', span: 12 },
    {
      label: '备注',
      key: 'remark',
      type: 'textarea',
      span: 24,
      props: { rows: 3, maxlength: 500, showWordLimit: true }
    }
  ])

  const selectCategory = (category: VehicleTypeCategory, createNew = false): void => {
    selectedCategory.value = category
    const firstProfile = categoryProfiles(category)[0]
    if (firstProfile && !createNew) {
      selectProfile(firstProfile)
      return
    }
    selectedId.value = undefined
    Object.assign(form, initialForm(), {
      category,
      sort: Math.max(0, ...categoryProfiles(category).map((profile) => profile.sort)) + 10
    })
    void nextTick(() => formRef.value?.clearValidate())
  }

  const applyPreset = (value: number): void => {
    if (selectedCategory.value === '按载重') form.loadTons = value
    else form.lengthM = value
  }

  const selectProfile = (profile: VehicleTypeProfile): void => {
    selectedCategory.value = profile.category
    selectedId.value = profile.id
    Object.assign(form, {
      category: profile.category,
      lengthM: profile.lengthM,
      volumeM3: profile.volumeM3,
      loadTons: profile.loadTons,
      status: profile.status,
      sort: profile.sort,
      schemeColor: profile.schemeColor || '',
      tagStyle: profile.tagStyle || 'primary',
      remark: profile.remark || '',
      imageUrl: profile.imageUrl || ''
    })
    void nextTick(() => formRef.value?.clearValidate())
  }

  const loadProfiles = async (): Promise<void> => {
    if (!selectedTenantId.value) return
    loading.value = true
    error.value = null
    try {
      const result = await fetchVehicleTypeProfiles({
        tenantId: selectedTenantId.value,
        includeDisabled: true
      })
      if (result.error) throw result.error
      profiles.value = result.data ?? []
      const current = profiles.value.find((profile) => profile.id === selectedId.value)
      if (current) selectProfile(current)
      else selectCategory(selectedCategory.value)
    } catch (cause) {
      error.value = cause instanceof Error ? cause : new Error('车型配置加载失败')
    } finally {
      loading.value = false
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!selectedTenantId.value || !canEdit.value || saving.value) return
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    saving.value = true
    try {
      const result = await saveVehicleTypeProfile({
        id: selectedId.value,
        ...(isAllTenants.value ? { tenantId: selectedTenantId.value } : {}),
        category: selectedCategory.value,
        lengthM: form.lengthM,
        volumeM3: form.volumeM3,
        loadTons: form.loadTons,
        status: form.status,
        sort: form.sort,
        schemeColor: form.schemeColor || null,
        tagStyle: form.tagStyle || null,
        remark: form.remark || null,
        imageUrl: form.imageUrl || null
      })
      if (result.error) throw result.error
      selectedId.value = result.data?.id
      await loadProfiles()
      emit('changed')
    } finally {
      saving.value = false
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!selectedId.value || saving.value) return
    try {
      await confirmAction(
        '确定删除当前车型规格吗？已被车辆档案使用的配置不能删除。',
        '删除车型配置',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
    saving.value = true
    try {
      const result = await deleteVehicleTypeProfile(selectedId.value)
      if (result.error) throw result.error
      selectedId.value = undefined
      await loadProfiles()
      emit('changed')
    } finally {
      saving.value = false
    }
  }

  watch(selectedTenantId, () => void loadProfiles())
  watch(effectiveTenantId, (tenantId) => {
    selectedTenantId.value = tenantId || ''
  })
  onMounted(async () => {
    if (isAllTenants.value) await tenantScopeStore.loadTenantOptions()
    await loadProfiles()
  })
</script>

<style scoped lang="scss">
  .vehicle-type-tab {
    display: grid;
    gap: 18px;
    min-width: 0;

    &__toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      align-items: center;
      justify-content: flex-start;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      p {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    &__total {
      padding: 6px 10px;
      margin-left: auto;
      font-size: 12px;
      color: var(--el-color-primary);
      white-space: nowrap;
      background: var(--el-color-primary-light-9);
      border-radius: 999px;
    }

    &__tenant {
      width: min(100%, 280px);
    }

    &__layout {
      display: grid;
      grid-template-columns: minmax(218px, 258px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
      min-width: 0;
    }

    &__workspace {
      display: grid;
      gap: 16px;
      min-width: 0;
    }

    &__tree {
      display: grid;
      gap: 4px;
    }

    &__category,
    &__profile {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
      min-width: 0;
      min-height: 40px;
      padding: 7px 10px;
      color: var(--el-text-color-primary);
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: var(--art-control-radius);
      transition:
        background-color var(--art-motion-fast) ease,
        color var(--art-motion-fast) ease;

      :deep(.vehicle-type-art) {
        flex: none;
        width: 36px;
        height: 26px;
      }

      span {
        flex: 1;
        min-width: 0;
      }

      small {
        color: var(--el-text-color-secondary);
      }

      &:hover {
        background: var(--el-color-primary-light-9);
      }

      &.is-active {
        font-weight: 600;
        color: var(--theme-color);
        background: var(--el-color-primary-light-8);
      }

      &:focus-visible {
        outline: 2px solid var(--theme-color);
        outline-offset: 2px;
      }
    }

    &__profile {
      min-height: 30px;
      padding: 5px 8px 5px 55px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__spec-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
      min-height: 66px;
    }

    &__spec {
      display: grid;
      gap: 7px;
      align-content: center;
      min-width: 0;
      min-height: 72px;
      padding: 10px 12px;
      text-align: left;
      cursor: pointer;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--art-control-radius);
      transition:
        border-color var(--art-motion-fast) ease,
        background-color var(--art-motion-fast) ease;

      > span:last-child {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      &:hover,
      &.is-active {
        border-color: var(--theme-color);
      }

      &.is-active {
        background: var(--el-color-primary-light-9);
      }

      &:focus-visible {
        outline: 2px solid var(--theme-color);
        outline-offset: 2px;
      }
    }

    &__spec-heading {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      justify-content: space-between;
      min-width: 0;

      strong {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
        color: var(--el-text-color-primary);
        white-space: nowrap;
      }

      :deep(.el-tag) {
        flex: none;
      }
    }

    &__spec-empty {
      display: flex;
      align-items: center;
      padding: 12px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-extra-light);
      border: 1px dashed var(--el-border-color);
      border-radius: var(--art-control-radius);
    }

    &__detail {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(190px, 238px);
      gap: 24px;
      min-width: 0;
    }

    &__form {
      display: grid;
      gap: 16px;
      align-content: start;
      min-width: 0;

      :deep(.art-form) {
        padding: 0;
      }

      :deep(.el-form-item) {
        margin-bottom: 16px;
      }

      :deep(.el-input-number .el-input__inner) {
        text-align: left;
      }
    }

    &__metric-field {
      display: grid;
      gap: 10px;
      width: 100%;
      min-width: 0;
    }

    &__metric-input {
      position: relative;
      width: 100%;

      :deep(.el-input-number) {
        width: 100%;
      }

      :deep(.el-input__inner) {
        padding-right: 42px;
        text-align: left;
      }

      > span {
        position: absolute;
        top: 50%;
        right: 14px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        pointer-events: none;
        transform: translateY(-50%);
      }
    }

    &__presets {
      display: grid;
      gap: 8px;

      > span {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      > div {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      :deep(.el-button + .el-button) {
        margin-left: 0;
      }

      :deep(.vehicle-type-tab__preset-button) {
        min-width: 58px;
        height: 32px;
        padding: 0 10px;
        font-size: 12px;
        line-height: 32px;
      }
    }

    &__visual {
      display: grid;
      gap: 10px;
      align-content: start;
      align-self: start;
      justify-items: center;
      min-width: 0;
      padding: 14px;
      background: var(--el-fill-color-extra-light);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--art-control-radius);
    }

    &__visual-heading {
      display: flex;
      gap: 8px;
      align-items: baseline;
      justify-content: space-between;
      width: 100%;

      strong {
        font-size: 13px;
        color: var(--el-text-color-primary);
      }

      span {
        font-size: 11px;
        color: var(--el-text-color-secondary);
      }
    }

    &__preview {
      display: grid;
      place-items: center;
      width: 100%;
      height: 134px;
      padding: 8px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--art-control-radius);

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    &__visual > p {
      width: 100%;
      margin: 0;
      font-size: 11px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
    }

    @media (width <= 1080px) {
      &__detail {
        grid-template-columns: minmax(0, 1fr);
      }

      &__visual {
        grid-template-columns: minmax(0, 1fr) auto;
        justify-items: start;
      }

      &__visual-heading,
      &__visual > p {
        grid-column: 1 / -1;
      }

      &__preview {
        max-width: 260px;
      }
    }

    @media (width <= 800px) {
      &__layout {
        grid-template-columns: minmax(0, 1fr);
      }

      &__tree {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        align-items: start;
      }

      &__tree > div {
        min-width: 0;
        padding: 4px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--art-control-radius);
      }

      &__profile {
        width: calc(100% - 12px);
        padding-left: 8px;
        margin-left: 12px;
        border-left: 2px solid var(--el-border-color-light);

        &.is-active {
          border-left-color: var(--theme-color);
        }
      }
    }

    @media (width <= 600px) {
      &__tree {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      &__category {
        gap: 5px;
        min-height: 34px;
        padding: 4px 6px;
        font-size: 12px;

        :deep(.vehicle-type-art) {
          width: 28px;
          height: 22px;
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &__profile {
        min-height: 28px;
        font-size: 11px;
      }
    }

    @media (width <= 480px) {
      &__visual {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  }
</style>
