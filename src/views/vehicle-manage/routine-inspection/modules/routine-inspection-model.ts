import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehicleRoutineInspectionRecord = Api.Vms.VehicleManage.VehicleRoutineInspectionRecord
export type VehicleRoutineInspectionFieldKey =
  Api.Vms.VehicleManage.VehicleRoutineInspectionFieldKey

export const EDITABLE_VEHICLE_ROUTINE_INSPECTION_ACCESS: Api.Vms.VehicleManage.VehicleRoutineInspectionFieldAccessMap =
  {
    responsiblePeople: 'edit',
    inspectionFindings: 'edit',
    remediationDetails: 'edit',
    documents: 'edit'
  }

type SensitivePayloadKey =
  | 'inspector'
  | 'driverName'
  | 'checkResult'
  | 'checkCondition'
  | 'handlingMethod'
  | 'remark'
  | 'attachments'

const SENSITIVE_PAYLOAD_KEYS: Record<VehicleRoutineInspectionFieldKey, SensitivePayloadKey[]> = {
  responsiblePeople: ['inspector', 'driverName'],
  inspectionFindings: ['checkResult', 'checkCondition'],
  remediationDetails: ['handlingMethod', 'remark'],
  documents: ['attachments']
}

export function sanitizeVehicleRoutineInspectionPayload(
  params: VehicleRoutineInspectionRecord
): VehicleRoutineInspectionRecord {
  const payload = omitWriteMetadata(params, ['attachmentsMasked'])
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
