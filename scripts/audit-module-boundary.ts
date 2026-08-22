import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const repositoryRoot = process.cwd()
const sourceRoot = path.join(repositoryRoot, 'src')
const allowedSourceRoots = new Set(['api', 'views'])
const allowedRootFiles = new Set(['index.ts', 'main.ts'])
const sourceExtensions = new Set(['.ts', '.tsx', '.vue'])
const violations: string[] = []

for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && !allowedSourceRoots.has(entry.name)) {
    violations.push(`不允许的公共源码目录: src/${entry.name}`)
  }
  if (entry.isFile() && !allowedRootFiles.has(entry.name)) {
    violations.push(`不允许的应用壳文件: src/${entry.name}`)
  }
}

const requiredPaths = [
  'src/index.ts',
  'src/main.ts',
  'src/views/archive-manage',
  'src/views/basic-info',
  'src/views/vehicle-manage',
  'src/views/vehicle-query',
  'src/api/index.ts',
  'src/api/integration.ts'
]
for (const requiredPath of requiredPaths) {
  if (!existsSync(path.join(repositoryRoot, requiredPath))) {
    violations.push(`缺少 VMS 业务入口: ${requiredPath}`)
  }
}

function collectSourceFiles(target: string): string[] {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return [target]
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    collectSourceFiles(path.join(target, entry.name))
  )
}

for (const filePath of collectSourceFiles(sourceRoot)) {
  if (!sourceExtensions.has(path.extname(filePath))) continue
  const source = readFileSync(filePath, 'utf8')
  if (source.includes('@/api/vms') || source.includes('@vms/api/vms')) {
    violations.push(`${path.relative(repositoryRoot, filePath)} 必须通过 @vms/api 引用业务 API`)
  }
  if (/@\/(?:views|api)\/(?:finance|fms|hr|smis|tms)(?:['"/])/.test(source)) {
    violations.push(`${path.relative(repositoryRoot, filePath)} 直接引用了其他业务仓前端源码`)
  }
}

if (violations.length > 0) {
  console.error(['VMS 模块边界审计失败：', ...violations.map((item) => `- ${item}`)].join('\n'))
  process.exitCode = 1
} else {
  console.log('VMS business-only boundary audit passed.')
}
