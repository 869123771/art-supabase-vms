import { fetchVehicleQuerySummaryRecords } from '@vms/api'
import { buildVehicleQuerySummary, type LoadedVehicleQuerySummary } from './vehicle-query-summary'

export async function loadVehicleQuerySummaries(
  vehicleIds: string[]
): Promise<Record<string, LoadedVehicleQuerySummary>> {
  const records = await fetchVehicleQuerySummaryRecords(vehicleIds)
  return Object.fromEntries(
    vehicleIds.map((id) => [
      id,
      buildVehicleQuerySummary(
        records[id] ?? { insurance: [], inspection: [], maintenance: [], mileage: [] }
      )
    ])
  )
}

export async function loadVehicleQuerySummary(
  vehicleId: string
): Promise<LoadedVehicleQuerySummary> {
  const summaries = await loadVehicleQuerySummaries([vehicleId])
  return summaries[vehicleId]
}
