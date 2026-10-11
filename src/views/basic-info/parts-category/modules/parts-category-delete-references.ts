import { fetchPartsCategoryTree } from '@vms/api'
import TreeUtils from '@/utils/tree'
import type { RecordDeleteDependency } from '@/api/master-data-delete'
import type { DeleteReferenceContext } from '@/utils/supabase/delete-reference'

// 子类别外键为 CASCADE，通用引用 RPC 不扫描它；删除前明确列出直接子类别。
// 服务端仍须原子检查所有历史引用，客户端检查不替代数据库保护。
export async function fetchPartsCategoryChildReferences(
  context: DeleteReferenceContext
): Promise<RecordDeleteDependency[]> {
  const { data, error } = await fetchPartsCategoryTree({}, { showErrorMessage: false })
  if (error || !data) throw new Error('子类别检查失败，请重试', { cause: error })
  const references: RecordDeleteDependency[] = []
  new TreeUtils().traverse(data, (category) => {
    if (!category.id || !category.parentId || !context.ids.includes(category.parentId)) return
    references.push({
      sourceTable: 'mdm_part_category',
      resourceId: category.parentId,
      recordId: category.id,
      targetId: category.id,
      recordNo: category.categoryCode || category.categoryName,
      recordSummary: category.categoryName,
      recordStatus: category.status,
      createdAt: category.createTime ?? null
    })
  })
  return references
}
