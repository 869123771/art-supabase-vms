export type VehicleTypeCategory = string

export interface VehicleTypeProfile {
  id: string
  tenantId: string
  category: VehicleTypeCategory
  imageUrl: string | null
  lengthM: number | null
  volumeM3: number | null
  loadTons: number | null
  status: '1' | '2'
  sort: number
  schemeColor: string | null
  tagStyle: string | null
  remark: string | null
}

export type VehicleTypeProfileWriteInput = Omit<VehicleTypeProfile, 'id' | 'tenantId'> & {
  id?: string
  tenantId?: string
}
