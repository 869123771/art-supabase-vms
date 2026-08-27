<template>
  <div class="parts-category-page art-full-height">
    <BusinessWorkspaceHeader
      eyebrow="PARTS TAXONOMY"
      title="零部件类别"
      description="以清晰的层级结构治理零部件分类、编码与启用状态，提升维保数据的一致性。"
      icon="ri:node-tree"
      :tags="[
        { label: '树形分类', type: 'primary' },
        { label: currentCategory?.categoryName || '全部顶级类别', type: 'info' }
      ]"
      :metrics="workspaceMetrics"
    >
      <template #actions>
        <BusinessTableWorkspaceActions :table="tableQueryRef" />
      </template>
    </BusinessWorkspaceHeader>

    <div class="parts-category-layout">
      <ArtWorkspaceSplitter
        class="parts-category-splitter"
        primary-size="400px"
        primary-min="400px"
        primary-max="640px"
        :breakpoint="768"
        stacked-primary-size="400px"
      >
        <template #primary>
          <div class="parts-category-tree-panel">
            <PartsCategoryTree
              ref="treeRef"
              @tree-node-click="handleTreeNodeClick"
              @data-change="handleTreeDataChange"
            />
          </div>
        </template>

        <div class="parts-category-table-panel">
          <ArtTableQuery
            ref="tableQueryRef"
            v-model="searchQuery"
            :search-items="searchItems"
            :api-fn="fetchTableData"
            :columns-factory="columnsFactory"
            :header-actions="headerActions"
            header-actions-placement="workspace"
            :search-bar-props="{ span: 8, labelWidth: 90 }"
            :table-props="{
              rowKey: 'id',
              tableLayout: 'fixed',
              emptyText: '当前层级暂无零部件类别',
              emptyDescription: '可新增当前层级类别，或调整名称、编码和状态后重新查询。'
            }"
            :on-success="handleTableSuccess"
            focusable
            focus-scope-selector=".parts-category-layout"
          />
        </div>
      </ArtWorkspaceSplitter>
    </div>

    <PartsCategoryDialog ref="dialogRef" @success="handleSaveSuccess" />
  </div>
</template>

<script setup lang="tsx">
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { ElMessage } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryExpose,
    ArtTableQueryExcelColumn,
    ArtTableQueryHeaderAction,
    ArtTableQueryHeaderActionContext,
    ArtTableQueryProps
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import { ColumnOption, DialogType } from '@/types'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import {
    deletePartsCategory,
    deletePartsCategoryBatch,
    exportPartsCategoryList,
    fetchPartsCategoryList,
    importPartsCategories
  } from '@vms/api'
  import { useUserStore } from '@/store/modules/user'
  import PartsCategoryTree from './modules/parts-category-tree.vue'
  import PartsCategoryDialog from './modules/parts-category-dialog.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import ArtWorkspaceSplitter from '@/components/core/layouts/art-workspace-splitter/index.vue'

  defineOptions({ name: 'PartsCategory' })

  const { confirmAction } = useArtFeedback()

  type PartsCategory = Api.Vms.BasicInfo.PartsCategory
  type SearchParams = Api.Vms.BasicInfo.PartsCategorySearchParams
  type TableParams = SearchParams & Pick<Api.Common.PaginationParams, 'current' | 'size'>

  interface DialogExpose {
    handleOpen: (row?: PartsCategory, parent?: PartsCategory) => Promise<void>
  }

  interface TreeExpose {
    getCurrentCategory: PartsCategory | undefined
    refreshTree: () => Promise<void>
  }

  const tableQueryRef = ref<ArtTableQueryExpose>()
  const treeRef = ref<TreeExpose>()
  const dialogRef = ref<DialogExpose>()
  const currentCategory = shallowRef<PartsCategory>()
  const { getDictMap } = storeToRefs(useUserStore())
  const overview = reactive<{ total: number; rows: PartsCategory[] }>({ total: 0, rows: [] })
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '当前层级结果',
      value: overview.total,
      description: currentCategory.value
        ? `属于“${currentCategory.value.categoryName}”`
        : '全部顶级类别',
      icon: 'ri:folder-chart-line'
    },
    {
      label: '本页启用',
      value: overview.rows.filter((row) => row.status === '1').length,
      description: '可用于零部件归类',
      icon: 'ri:checkbox-circle-line',
      tone: 'success'
    },
    {
      label: '本页停用',
      value: overview.rows.filter((row) => row.status !== '1').length,
      description: '当前不可用于业务选择',
      icon: 'ri:forbid-2-line',
      tone: 'warning'
    }
  ])

  const searchQuery = ref<SearchParams>({
    categoryName: '',
    categoryCode: '',
    status: undefined
  })

  const searchItems = computed<SearchFormItem[]>(() => [
    {
      label: '类别名称',
      key: 'categoryName',
      type: 'input'
    },
    {
      label: '类别编码',
      key: 'categoryCode',
      type: 'input'
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        options: getDictMap.value.status ?? []
      }
    }
  ])

  const partsCategoryExcelColumns: ArtTableQueryExcelColumn[] = [
    { key: 'categoryName', title: '类别名称', required: true },
    { key: 'categoryCode', title: '类别编码', required: true },
    { key: 'parentId', title: '上级类别ID' },
    { key: 'sort', title: '排序' },
    { key: 'status', title: '状态' },
    { key: 'remark', title: '备注' }
  ]

  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      permission: 'PartsCategory:Add',
      type: 'add',
      onClick: () => openDialog(undefined, currentCategory.value)
    },
    {
      permission: 'PartsCategory:Import',
      type: 'import',
      importColumns: partsCategoryExcelColumns,
      importApi: async (rows) => {
        await importPartsCategories(rows as PartsCategory[])
        await treeRef.value?.refreshTree()
      },
      onImportError: handleImportError
    },
    {
      permission: 'PartsCategory:Export',
      type: 'export',
      exportFilename: '零部件类别',
      exportSheetName: '零部件类别',
      exportColumns: partsCategoryExcelColumns,
      exportApi: ({ selectedIds, searchParams, maxRows }) => {
        return exportPartsCategoryList({
          ...(searchParams as SearchParams),
          parentId: currentCategory.value?.id ?? null,
          ids: selectedIds.map(String),
          maxRows
        })
      }
    },
    {
      permission: 'PartsCategory:Delete',
      type: 'delete',
      content: ({ selectedCount }: ArtTableQueryHeaderActionContext) =>
        `确定删除选中的 ${selectedCount} 个零部件类别吗？子类别会一并删除，删除后无法恢复。`,
      onClick: async ({ selectedRows }) => {
        const ids = selectedRows
          .map((row) => row.id)
          .filter((id): id is string => typeof id === 'string')
        await deletePartsCategoryBatch(ids)
        await treeRef.value?.refreshTree()
        await tableQueryRef.value?.refreshRemove()
      }
    }
  ])

  const fetchTableData = (params: TableParams) => {
    const { from, to } = pageInfoHandler({
      current: params.current,
      size: params.size
    })

    return fetchPartsCategoryList({
      ...params,
      parentId: currentCategory.value?.id ?? null,
      from,
      to
    })
  }

  const columnsFactory = (): ColumnOption<PartsCategory>[] => [
    {
      type: 'selection',
      width: 50,
      fixed: 'left',
      reserveSelection: true
    },
    {
      type: 'globalIndex',
      label: '序号',
      width: 80
    },
    {
      prop: 'categoryName',
      label: '类别名称',
      minWidth: 180
    },
    {
      prop: 'categoryCode',
      label: '类别编码',
      minWidth: 150
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      dict: { code: 'status', display: 'auto' }
    },
    {
      prop: 'remark',
      label: '备注',
      minWidth: 180
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row) => (
        <div class="flex">
          <ArtButtonTable
            type="edit"
            permission="PartsCategory:Edit"
            onClick={() => openDialog(row)}
          />
          <ArtButtonMore
            list={getMoreActions()}
            onClick={(item: ButtonMoreItem) => handleMoreAction(item, row)}
          />
        </div>
      )
    }
  ]

  const handleTableSuccess: NonNullable<ArtTableQueryProps['onSuccess']> = (rows, response) => {
    overview.rows = rows as PartsCategory[]
    overview.total = response.total ?? rows.length
  }

  const openDialog = (row?: PartsCategory, parent?: PartsCategory): void => {
    void dialogRef.value?.handleOpen(row, parent)
  }

  const getMoreActions = (): ButtonMoreItem[] => [
    { auth: 'PartsCategory:Add', key: 'add', label: '新增下级', icon: 'ri:add-line' },
    {
      auth: 'PartsCategory:Delete',
      key: 'delete',
      label: '删除',
      icon: 'ri:delete-bin-5-line',
      color: '#f56c6c'
    }
  ]

  const handleMoreAction = (item: ButtonMoreItem, row: PartsCategory): void => {
    if (item.key === 'add') {
      openDialog(undefined, row)
      return
    }
    if (item.key === 'delete') {
      void handleDelete(row)
    }
  }

  const handleTreeNodeClick = (node?: PartsCategory): void => {
    currentCategory.value = node
    void tableQueryRef.value?.getData()
  }

  const handleTreeDataChange = (): void => {
    void tableQueryRef.value?.refreshData()
  }

  const handleSaveSuccess = async (type: DialogType): Promise<void> => {
    await treeRef.value?.refreshTree()
    await (type === 'add'
      ? tableQueryRef.value?.refreshCreate()
      : tableQueryRef.value?.refreshUpdate())
  }

  const handleDelete = async (row: PartsCategory): Promise<void> => {
    if (!row.id) return

    try {
      await confirmAction(
        `确定删除零部件类别“${row.categoryName}”吗？子类别会一并删除，删除后无法恢复。`,
        '删除确认',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
      await deletePartsCategory(row.id)
      await treeRef.value?.refreshTree()
      await tableQueryRef.value?.refreshRemove()
    } catch {
      // 用户取消删除时不需要额外提示。
    }
  }

  const handleImportError = (): void => {
    ElMessage.error('导入文件解析失败')
  }
</script>

<style scoped lang="scss">
  .parts-category-page {
    gap: 12px;
    min-width: 0;

    .parts-category-layout {
      flex: 1;
      width: 100%;
      min-height: 0;

      .parts-category-tree-panel,
      .parts-category-table-panel {
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
        min-height: 0;
      }

      .parts-category-splitter {
        height: 100%;
      }

      @media (width <= 768px) {
        height: auto;
      }
    }
  }
</style>
