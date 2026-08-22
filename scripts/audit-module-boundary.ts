import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const repositoryRoot = process.cwd()
const viewsRoot = path.join(repositoryRoot, 'src', 'views')
const allowedViewRoots = new Set(['auth', 'exception', 'index', 'outside', 'vms'])
const forbiddenApiModules = ['finance', 'fms', 'hr', 'smis', 'tms']
const forbiddenApiBarrels = forbiddenApiModules.map((name) => `${name}.ts`)
const sourceExtensions = new Set(['.ts', '.tsx', '.vue'])
const forbiddenRuntimeImport = /@\/(?:api|views)\/(?:finance|fms|hr|smis|tms)(?:['"/])/g

const violations: string[] = []

for (const entry of readdirSync(viewsRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && !allowedViewRoots.has(entry.name)) {
    violations.push(`不允许的业务页面目录: src/views/${entry.name}`)
  }
}

for (const moduleName of forbiddenApiModules) {
  if (existsSync(path.join(repositoryRoot, 'src', 'api', 'modules', moduleName))) {
    violations.push(`不允许的业务 API 目录: src/api/modules/${moduleName}`)
  }
}

for (const barrelName of forbiddenApiBarrels) {
  if (existsSync(path.join(repositoryRoot, 'src', 'api', barrelName))) {
    violations.push(`不允许的业务 API 入口: src/api/${barrelName}`)
  }
}

const filesToAudit = [path.join(repositoryRoot, 'src')]

function collectSourceFiles(target: string): string[] {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return [target]

  return readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    collectSourceFiles(path.join(target, entry.name))
  )
}

for (const filePath of filesToAudit.flatMap(collectSourceFiles)) {
  if (!sourceExtensions.has(path.extname(filePath))) continue
  const source = readFileSync(filePath, 'utf8')
  const matches = [...source.matchAll(forbiddenRuntimeImport)]
  for (const match of matches) {
    violations.push(`${path.relative(repositoryRoot, filePath)} 直接引用其他业务模块: ${match[0]}`)
  }
}

const environmentFile = readFileSync(path.join(repositoryRoot, '.env'), 'utf8')
if (!/^VITE_APP_CODE\s*=\s*vms\s*$/m.test(environmentFile)) {
  violations.push('.env 必须声明 VITE_APP_CODE = vms')
}

if (violations.length > 0) {
  console.error(['VMS 模块边界审计失败：', ...violations.map((item) => `- ${item}`)].join('\n'))
  process.exitCode = 1
} else {
  console.log('VMS module boundary audit passed.')
}
