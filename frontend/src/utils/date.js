import { format, parseISO } from 'date-fns'

/**
 * Safely formats dates without ever throwing RangeError: Invalid time value.
 * @param {string|Date|number} dateValue
 * @param {string} formatStr
 * @param {string} fallback
 * @returns {string}
 */
export function safeFormat(dateValue, formatStr = 'dd MMM yyyy', fallback = '—') {
  if (!dateValue) return fallback
  
  // If it's already a clean month-year string like "Jun 24" or "Oct 23", return it directly
  if (typeof dateValue === 'string' && /^[A-Za-z]{3}\s\d{2}$/.test(dateValue.trim())) {
    return dateValue.trim()
  }

  try {
    let d
    if (typeof dateValue === 'string') {
      d = (dateValue.includes('T') || dateValue.includes('-')) ? parseISO(dateValue) : new Date(dateValue)
    } else if (dateValue instanceof Date) {
      d = dateValue
    } else {
      d = new Date(dateValue)
    }

    if (d instanceof Date && !isNaN(d.getTime())) {
      return format(d, formatStr)
    }
  } catch {
    // Non-fatal, return string representation or fallback
  }

  return typeof dateValue === 'string' ? dateValue : fallback
}
