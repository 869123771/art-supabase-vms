# Art Supabase VMS

VMS 车辆管理业务模块。这个仓库只维护 VMS 领域代码，不包含登录、租户、菜单、权限、布局、路由、公共组件、公共 store 或 Supabase 客户端。

## 仓库内容

- `src/views`：VMS 页面与页面内业务组件。仓名已经代表 VMS，因此不再嵌套 `views/vms`。
- `src/api/index.ts`：VMS API 门面。
- `src/api/providers/**/vehicle*`：VMS 领域数据访问实现。
- `src/api/integration.ts`：VMS 读取 HR/TMS 数据的安全 RPC 契约适配层。
- `supabase/functions/ai-vehicle-health-advisor`：VMS 专属 Edge Function。
- `tests/unit`：VMS 表单写入模型和车辆健康规则测试。

## 运行方式

`art-supabase-pro` 是唯一公共宿主。主仓通过 Git submodule 固定本仓提交，并以 `@vms/*` 装载 VMS 源码。启动、登录、菜单、权限和部署由主仓统一完成：

```powershell
git clone --recurse-submodules https://gitee.com/wangyanghub/art-supabase-pro.git
cd art-supabase-pro
pnpm install
pnpm dev
```

更新 VMS 后，先在本仓提交并推送，再在主仓更新 `modules/art-supabase-vms` 的提交指针。这样 VMS 业务只维护一份，同时主仓构建可复现。

## 路由与依赖边界

- 数据库菜单继续使用稳定的 `/vms/...` 路由前缀。主仓加载器负责把此前缀映射到本仓 `src/views/...`，子仓目录无需重复 VMS 名称。
- `@vms/*` 只引用本仓业务代码；`@/*` 引用主仓提供的公共运行时。
- VMS 不直接导入 HR/TMS 前端源码；跨模块数据通过租户隔离、字段最小化的 Supabase RPC 读取。
- 业务写入仍由 VMS 自己的 API/provider 负责，数据库继续以 RLS 和服务端权限作为最终边界。
