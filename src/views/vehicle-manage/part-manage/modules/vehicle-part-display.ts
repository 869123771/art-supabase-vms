type WarrantyRecord = Pick<
  Api.Vms.VehicleManage.VehiclePartUsage,
  'warrantyMode' | 'warrantyMileage' | 'warrantyDuration' | 'lifecycleLimitsMasked'
>

/** Keep all part surfaces consistent without exposing masked lifecycle limits. */
export function formatVehiclePartWarranty(record?: WarrantyRecord): string {
  if (record?.lifecycleLimitsMasked) return '***'
  if (record?.warrantyMode === 'vehicle') return '随整车质保'
  return (
    [
      record?.warrantyMileage ? `${record.warrantyMileage}公里` : '',
      record?.warrantyDuration ? `${record.warrantyDuration}个月` : ''
    ]
      .filter(Boolean)
      .join(' / ') || '--'
  )
}
