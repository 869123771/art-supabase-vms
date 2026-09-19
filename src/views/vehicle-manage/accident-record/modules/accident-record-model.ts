import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehicleAccidentRecord = Api.Vms.VehicleManage.VehicleAccidentRecord
export type VehicleAccidentFieldKey = Api.Vms.VehicleManage.VehicleAccidentFieldKey

export const EDITABLE_VEHICLE_ACCIDENT_ACCESS: Api.Vms.VehicleManage.VehicleAccidentFieldAccessMap =
  {
    driverContact: 'edit',
    accidentLocation: 'edit',
    accidentNarrative: 'edit',
    lossAmounts: 'edit',
    documents: 'edit'
  }

type SensitivePayloadKey =
  | 'driverName'
  | 'driverPhone'
  | 'accidentLocation'
  | 'accidentLongitude'
  | 'accidentLatitude'
  | 'accidentSummary'
  | 'remark'
  | 'companyBearAmount'
  | 'economicLoss'
  | 'attachments'

const SENSITIVE_PAYLOAD_KEYS: Record<VehicleAccidentFieldKey, SensitivePayloadKey[]> = {
  driverContact: ['driverName', 'driverPhone'],
  accidentLocation: ['accidentLocation', 'accidentLongitude', 'accidentLatitude'],
  accidentNarrative: ['accidentSummary', 'remark'],
  lossAmounts: ['companyBearAmount', 'economicLoss'],
  documents: ['attachments']
}

export function sanitizeVehicleAccidentPayload(
  params: VehicleAccidentRecord
): VehicleAccidentRecord {
  const payload = omitWriteMetadata(params)
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
