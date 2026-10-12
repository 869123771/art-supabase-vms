import assert from 'node:assert/strict'
import test from 'node:test'
import { getVehicleUsageYears } from '../../src/utils/vehicle-lifecycle'

const now = Date.parse('2026-10-12T00:00:00Z')

test('usage ages reject empty or invalid dates instead of displaying NaN', () => {
  for (const date of [undefined, null, '', 'not-a-date']) {
    assert.equal(getVehicleUsageYears(date, true, now), null)
  }
})

test('usage age preserves elapsed-day rounding and date offsets', () => {
  assert.equal(getVehicleUsageYears('2024-10-12T00:00:00Z', true, now), 2)
  assert.equal(getVehicleUsageYears('2024-10-12T08:00:00+08:00', true, now), 2)
  assert.equal(getVehicleUsageYears('2024-02-29', true, Date.parse('2025-03-01')), 1)
  assert.equal(getVehicleUsageYears('2026-01-01', true, now), 0.8)
})

test('future dates preserve list arithmetic while lifecycle displays clamp to zero', () => {
  assert.equal(getVehicleUsageYears('2027-10-12', true, now), 0)
  assert.equal(getVehicleUsageYears('2027-10-12', false, now), -1)
  assert.equal(getVehicleUsageYears('2027-10-12', true, now)?.toFixed(1), '0.0')
})
