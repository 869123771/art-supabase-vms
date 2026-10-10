import assert from 'node:assert/strict'
import test from 'node:test'
import { formatVehiclePartWarranty } from '../../src/views/vehicle-manage/part-manage/modules/vehicle-part-display'

test('masked warranty never discloses limits or inherited warranty mode', () => {
  for (const warrantyMode of ['self', 'vehicle'] as const) {
    assert.equal(
      formatVehiclePartWarranty({
        warrantyMode,
        warrantyMileage: 100000,
        warrantyDuration: 24,
        lifecycleLimitsMasked: true
      }),
      '***'
    )
  }
})

test('all part surfaces share warranty order and empty or inherited labels', () => {
  assert.equal(formatVehiclePartWarranty(), '--')
  assert.equal(formatVehiclePartWarranty({ warrantyMode: 'vehicle' }), '随整车质保')
  assert.equal(
    formatVehiclePartWarranty({
      warrantyMode: 'self',
      warrantyMileage: 100000,
      warrantyDuration: 24
    }),
    '100000公里 / 24个月'
  )
  assert.equal(formatVehiclePartWarranty({ warrantyMode: 'self', warrantyDuration: 24 }), '24个月')
  assert.equal(
    formatVehiclePartWarranty({ warrantyMode: 'self', warrantyMileage: 0, warrantyDuration: null }),
    '--'
  )
})
