import { useSupabase } from '@/hooks'
import { normalizeSupabaseFunctionError } from '@/utils/supabase'
import { TENANT_SCOPE_HEADER } from '@/utils/tenant-scope-context'

export type VehicleDocumentOcrType = 'driving_license' | 'operation_license'

export interface VehicleDocumentOcrResult {
  rawText: string
  summary: string
  confidence: number
  fieldConfidence: Record<string, number>
  missingFields: string[]
  warnings: string[]
  document: Partial<
    Record<
      | 'plateNo'
      | 'vin'
      | 'engineNo'
      | 'vehicleType'
      | 'brandModel'
      | 'ownerName'
      | 'registerDate'
      | 'issueDate'
      | 'operationCertNo'
      | 'operationType',
      string | null
    >
  >
  artifactId: string
}

const { supabase } = useSupabase()

export async function analyzeVehicleDocumentByAi(
  imageUrl: string,
  documentType: VehicleDocumentOcrType,
  selectedTenantId?: string | null
) {
  const { data, error } = await supabase.functions.invoke<VehicleDocumentOcrResult>(
    'ai-vms-vehicle-document-ocr',
    {
      body: { action: 'analyze', imageUrls: [imageUrl], documentType },
      headers: selectedTenantId ? { [TENANT_SCOPE_HEADER]: selectedTenantId } : undefined
    }
  )
  return { data: data ?? null, error: await normalizeSupabaseFunctionError(error) }
}
