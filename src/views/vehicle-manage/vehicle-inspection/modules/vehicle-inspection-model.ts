import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehicleInspection = Api.Vms.VehicleManage.VehicleInspection
export type VehicleInspectionFieldKey = Api.Vms.VehicleManage.VehicleInspectionFieldKey

export const EDITABLE_VEHICLE_INSPECTION_ACCESS: Api.Vms.VehicleManage.VehicleInspectionFieldAccessMap =
  {
    inspectionIdentifiers: 'edit',
    monetaryAmounts: 'edit',
    documents: 'edit'
  }

type SensitivePayloadKey =
  'inspectionNo' | 'compulsoryPolicyNo' | 'inspectionAmount' | 'compulsoryPremium' | 'attachments'

const SENSITIVE_PAYLOAD_KEYS: Record<VehicleInspectionFieldKey, SensitivePayloadKey[]> = {
  inspectionIdentifiers: ['inspectionNo', 'compulsoryPolicyNo'],
  monetaryAmounts: ['inspectionAmount', 'compulsoryPremium'],
  documents: ['attachments']
}

export function sanitizeVehicleInspectionPayload(params: VehicleInspection): VehicleInspection {
  const payload = omitWriteMetadata(params)
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
