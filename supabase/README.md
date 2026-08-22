# VMS Supabase 资产

本目录只保留 VMS 专属 Edge Function。共享数据库迁移、Auth、租户、菜单、权限与公共函数由 `art-supabase-pro` 统一维护。

- `functions/ai-vehicle-health-advisor`：基于租户隔离车辆数据生成健康建议。
- `functions/_shared/vehicle-health-rules.ts`：上述函数使用的 VMS 规则。
