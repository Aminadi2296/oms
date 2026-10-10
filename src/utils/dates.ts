import { format, formatRelative, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

export const normalizeDate = (val: string | null | number) => {
  try {
    if (!val) throw new Error('Invalid Date (normalizeDate): ' + val)
    const date = new Date(val)

    if (isNaN(date.getTime())) throw new Error('Invalid Date (normalizeDate): ' + val)

    return date
  } catch (error) {
    console.error(error)

    return null
  }
}

export const strToDayMonthYear = (val: string | null) => {
  try {
    const date = normalizeDate(val)

    if (!date) throw new Error('Invalid Date (strToDayMonthYear): ' + date)

    return format(date, 'dd-MM-yyyy')
  } catch (error) {
    console.error(error)

    return ''
  }
}

export const dateToYearMonthDay = (date?: Date) => {
  try {
    if (!date) throw new Error('Invalid Date (dateToYearMonthDay): ' + date)

    return format(date, 'yyyy-MM-dd')
  } catch (error) {
    console.error(error)

    return ''
  }
}

export const strToRelativeDate = (val: string) => {
  try {
    const date = normalizeDate(val)

    if (!date) throw new Error('Invalid Date (strToRelativeDate): ' + val)

    return formatRelative(date, new Date(), { locale: es })
  } catch (error) {
    console.error(error)

    return ''
  }
}

export const isExpired = (val: null | string | number | Date) => {
  try {
    if (!val) throw new Error('Invalid Date (isExpired): ' + val)

    return isPast(val)
  } catch (error) {
    console.error(error)

    return false
  }
}
