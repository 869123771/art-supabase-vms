import { useSupabase } from '@/hooks'

const { supabase, responseHandle } = useSupabase()

/** 读取平台认证会话对应的租户用户资料。 */
export async function fetchPlatformUserInfo() {
  const { data: sessionData } = await supabase.auth.getSession()
  const uid = sessionData.session?.user.id

  if (!uid) {
    return { data: null }
  }

  const [profileResult, superResult] = await Promise.all([
    responseHandle<Api.SystemManage.UserListItem>(
      () =>
        supabase
          .from('sys_user')
          .select(
            '*, tenant:sys_tenant!sys_user_tenant_id_fkey(tenant_code, tenant_name, builtin_type)'
          )
          .eq('auth_user_id', uid)
          .is('deleted_at', null)
          .single(),
      { ignoreCheck: true }
    ),
    responseHandle<boolean>(() => supabase.rpc('current_is_super'), {
      ignoreCheck: true
    })
  ])

  if (profileResult.data && typeof superResult.data === 'boolean') {
    Object.assign(profileResult.data, { platformSuper: superResult.data })
  }

  return profileResult
}

/** 检查平台是否已经建立可复用的 Supabase 会话。 */
export async function readPlatformSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/** 所有应用共享同一 Supabase 会话，因此任一应用退出即退出整个平台。 */
export async function signOutPlatformSession() {
  await supabase.auth.signOut()
}
