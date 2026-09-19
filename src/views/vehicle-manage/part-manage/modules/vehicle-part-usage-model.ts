import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehiclePartUsage = Api.Vms.VehicleManage.VehiclePartUsage
export type VehiclePartUsageFieldKey = Api.Vms.VehicleManage.VehiclePartUsageFieldKey

export const EDITABLE_VEHICLE_PART_USAGE_ACCESS: Api.Vms.VehicleManage.VehiclePartUsageFieldAccessMap =
  {
    supplierDetails: 'edit',
    traceabilityTag: 'edit',
    lifecycleLimits: 'edit',
    dispositionNotes: 'edit'
  }

type SensitivePayloadKey =
  | 'supplierId'
  | 'supplierName'
  | 'supplierContact'
  | 'rfidEnabled'
  | 'rfidTag'
  | 'enableMode'
  | 'enableDate'
  | 'warrantyMode'
  | 'warrantyMileage'
  | 'warrantyDuration'
  | 'serviceMileageEnabled'
  | 'serviceMileage'
  | 'serviceYearsEnabled'
  | 'serviceYears'
  | 'usedMileage'
  | 'scrapReason'
  | 'remark'

const SENSITIVE_PAYLOAD_KEYS: Record<VehiclePartUsageFieldKey, SensitivePayloadKey[]> = {
  supplierDetails: ['supplierId', 'supplierName', 'supplierContact'],
  traceabilityTag: ['rfidEnabled', 'rfidTag'],
  lifecycleLimits: [
    'enableMode',
    'enableDate',
    'warrantyMode',
    'warrantyMileage',
    'warrantyDuration',
    'serviceMileageEnabled',
    'serviceMileage',
    'serviceYearsEnabled',
    'serviceYears',
    'usedMileage'
  ],
  dispositionNotes: ['scrapReason', 'remark']
}

export function sanitizeVehiclePartUsagePayload(params: VehiclePartUsage): VehiclePartUsage {
  const payload = omitWriteMetadata(params, ['lifecycleLimitsMasked'])
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
