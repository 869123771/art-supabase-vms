import { omitNonEditableFieldGroups, omitWriteMetadata } from '@/utils/field-permission'

export type Supplier = Api.Vms.BasicInfo.Supplier
export type SupplierFieldKey = Api.Vms.BasicInfo.SupplierFieldKey

export const EDITABLE_SUPPLIER_ACCESS: Api.Vms.BasicInfo.SupplierFieldAccessMap = {
  contactDetails: 'edit',
  addressDetails: 'edit',
  internalNotes: 'edit'
}

type SensitivePayloadKey = 'contactPerson' | 'contactPhone' | 'region' | 'addressDetail' | 'remark'

const SENSITIVE_PAYLOAD_KEYS: Record<SupplierFieldKey, SensitivePayloadKey[]> = {
  contactDetails: ['contactPerson', 'contactPhone'],
  addressDetails: ['region', 'addressDetail'],
  internalNotes: ['remark']
}

export function sanitizeSupplierPayload(params: Supplier): Supplier {
  const payload = omitWriteMetadata(params)
  return params.id
    ? omitNonEditableFieldGroups(payload, params.fieldAccess, SENSITIVE_PAYLOAD_KEYS)
    : payload
}
