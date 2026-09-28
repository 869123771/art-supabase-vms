import type { VehicleTypeProfile } from '@vms/types/vehicle-type'

export type { VehicleTypeCategory, VehicleTypeProfile } from '@vms/types/vehicle-type'

export const SEMI_TRAILER_LENGTHS = [13, 15, 17.5, 18, 20] as const
export const LOAD_CAPACITY_PRESETS = [5, 8, 10, 16] as const

export function vehicleTypeProfileLabel(profile: VehicleTypeProfile): string {
  const specification =
    profile.category === '按载重'
      ? profile.loadTons == null
        ? ''
        : `${profile.loadTons} 吨`
      : profile.lengthM == null
        ? ''
        : `${profile.lengthM} 米`
  return specification ? `${profile.category} · ${specification}` : profile.category
}
