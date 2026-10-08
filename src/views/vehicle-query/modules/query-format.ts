import dayjs from 'dayjs'
import { isEmpty, isNil, maxBy } from 'lodash-es'
import type { ArtDescriptionItem } from '@/components/core/base/art-descriptions/types'
import type { InfoItem } from './types'

export const EMPTY_TEXT = '--'

export const formatValue = (value?: unknown, suffix = ''): string => {
  if (isNil(value) || value === '') return EMPTY_TEXT
  if (Array.isArray(value) && isEmpty(value)) return EMPTY_TEXT
  return `${value}${suffix}`
}

export const formatDate = (value?: string | null): string => {
  if (isNil(value) || value === '') return EMPTY_TEXT
  return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : EMPTY_TEXT
}

export const formatDateTime = (value?: string | null): string => {
  if (isNil(value) || value === '') return EMPTY_TEXT
  return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : EMPTY_TEXT
}

export const formatMileage = (value?: number | null): string => {
  if (isNil(value)) return EMPTY_TEXT
  return `${Number(value).toLocaleString()}公里`
}

export const formatNumber = (value?: number | null, suffix = ''): string => {
  if (isNil(value)) return EMPTY_TEXT
  return `${Number(value).toLocaleString()}${suffix}`
}

export const formatMoney = (value?: number | null): string => {
  if (isNil(value)) return EMPTY_TEXT
  return Number(value).toFixed(1)
}

export const formatBoolean = (value?: boolean | null): string => {
  if (isNil(value)) return EMPTY_TEXT
  return value ? '是' : '否'
}

export const createDescriptionItems = (items: InfoItem[]): ArtDescriptionItem[] =>
  items.map((item, index) => ({
    key: `${item.label}-${index}`,
    label: item.label,
    value: item.value,
    dictCode: item.dictCode,
    formatter: item.dictCode ? undefined : () => formatValue(item.value, item.suffix)
  }))

export const getLatestByDate = <TRecord>(
  records: TRecord[],
  getDate: (record: TRecord) => string | null | undefined
): TRecord | undefined =>
  maxBy(records, (record) => {
    const value = getDate(record)
    const date = value ? dayjs(value) : null
    return date?.isValid() ? date.valueOf() : 0
  })

export const getExpireDateByYears = (
  startDate?: string | null,
  years?: number | null
): string | null => {
  if (isNil(startDate) || startDate === '' || isNil(years)) return null
  if (!dayjs(startDate).isValid()) return null
  return dayjs(startDate).add(years, 'year').format('YYYY-MM-DD')
}
