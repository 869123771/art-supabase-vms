import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type VehicleInsurance = Api.Vms.VehicleManage.VehicleInsurance
export type VehicleInsuranceFieldKey = Api.Vms.VehicleManage.VehicleInsuranceFieldKey

export const EDITABLE_VEHICLE_INSURANCE_ACCESS: Api.Vms.VehicleManage.VehicleInsuranceFieldAccessMap =
  {
    policyNumbers: 'edit',
    premiumAmounts: 'edit',
    documents: 'edit'
  }

type SensitivePayloadKey =
  | 'commercialPolicyNo'
  | 'compulsoryPolicyNo'
  | 'commercialPremium'
  | 'compulsoryPremium'
  | 'attachments'

const SENSITIVE_PAYLOAD_KEYS: Record<VehicleInsuranceFieldKey, SensitivePayloadKey[]> = {
  policyNumbers: ['commercialPolicyNo', 'compulsoryPolicyNo'],
  premiumAmounts: ['commercialPremium', 'compulsoryPremium'],
  documents: ['attachments']
}

export function sanitizeVehicleInsurancePayload(params: VehicleInsurance): VehicleInsurance {
  const payload = omitWriteMetadata(params)
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
