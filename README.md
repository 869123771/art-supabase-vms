# Art Supabase VMS

独立运行、独立构建、独立部署的车辆管理系统。仓库只承载 VMS 业务页面；登录、租户、菜单、角色权限、数据字典和跨模块数据契约由 `art-supabase-pro` 平台基座提供。

## 运行

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认开发地址为 `http://localhost:3015`，运行身份固定为：

```dotenv
VITE_APP_CODE = vms
```

登录后应用调用 `get_menus_for_current_application('vms')`，因此：

- 平台超级用户可以看到全部 VMS 菜单；
- 普通租户用户只看到其角色已分配的 VMS 菜单；
- 未分配 VMS 菜单的用户不能通过输入 URL 绕过动态路由权限。

## 跨模块数据

VMS 不导入 HR、TMS、FMS 或 SMIS 的前端源码。

- 承运商和司机通过 TMS 所有的安全引用数据 RPC 读取，保留租户过滤和字段脱敏。
- HR 员工通过 `vms_list_hr_employee_options_secure` 读取最小投影，仅包含员工编号、姓名、组织、职务和在职状态。
- 其他模块的数据写入仍由数据所有者完成；VMS 只能调用为其用途发布的受控命令契约。

## 质量门禁

```bash
pnpm boundary:audit
pnpm ui:audit
pnpm typecheck
pnpm lint
pnpm build
```

`boundary:audit` 会阻止非 VMS 业务页面进入仓库，并阻止 VMS 运行时代码重新引用其他业务模块的 API / View 源码。

平台契约与发布顺序见 [独立业务应用架构](architecture/modular-applications.md)。
