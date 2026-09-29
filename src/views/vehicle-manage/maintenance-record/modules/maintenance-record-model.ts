import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehicleMaintenanceRecord = Api.Vms.VehicleManage.VehicleMaintenanceRecord
export type VehicleMaintenanceFieldKey = Api.Vms.VehicleManage.VehicleMaintenanceFieldKey

export const EDITABLE_VEHICLE_MAINTENANCE_ACCESS: Api.Vms.VehicleManage.VehicleMaintenanceFieldAccessMap =
  {
    maintenanceIdentifiers: 'edit',
    totalCost: 'edit',
    maintenanceItems: 'edit',
    documents: 'edit'
  }

type SensitivePayloadKey = 'maintenanceNo' | 'costAmount' | 'items' | 'attachments'

const SENSITIVE_PAYLOAD_KEYS: Record<VehicleMaintenanceFieldKey, SensitivePayloadKey[]> = {
  maintenanceIdentifiers: ['maintenanceNo'],
  totalCost: ['costAmount'],
  maintenanceItems: ['items'],
  documents: ['attachments']
}

export function sanitizeVehicleMaintenancePayload(
  params: VehicleMaintenanceRecord
): VehicleMaintenanceRecord {
  const payload = omitWriteMetadata(params)
  for (const key of [
    'tripStartTime',
    'tripEndTime',
    'driverName',
    'waybillNo',
    'departureMileage',
    'arrivalMileage',
    'drivingMileage'
  ] as const) {
    delete payload[key]
  }
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
