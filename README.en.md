# Art Supabase VMS

An independently runnable, buildable, and deployable vehicle management application. This repository owns the VMS business UI and its vehicle-domain Edge Function; authentication, tenants, menus, RBAC, dictionaries, and cross-domain contracts are provided by the `art-supabase-pro` platform.

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The default development URL is `http://localhost:3015`, with the runtime identity fixed to:

```dotenv
VITE_APP_CODE = vms
```

The application requests `get_menus_for_current_application('vms')` after login. Platform super users can access all VMS menus, while ordinary tenant users receive only the VMS menus assigned to their roles.

## Cross-domain data

VMS does not import HR, TMS, FMS, or SMIS frontend source code.

- TMS carrier and driver references are read through tenant-safe TMS RPC contracts.
- HR employees are read through `vms_list_hr_employee_options_secure`, which returns only the minimum business projection and excludes identity-card and contact fields.
- Writes remain owned by the source domain and require explicit governed command contracts.

## Quality gates

```bash
pnpm boundary:audit
pnpm ui:audit
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e:vms
```

See [Independent business application architecture](architecture/modular-applications.md) for repository and deployment boundaries.
