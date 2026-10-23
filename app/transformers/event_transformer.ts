import { DateTime } from 'luxon'

export type ValidatedEventData = {
  title: string
  description: string | null
  location: string
  eventDate: string
  maxCapacity: number
  category: string
}

export function transformEventData(data: ValidatedEventData) {
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    eventDate: DateTime.fromISO(data.eventDate),
    maxCapacity: data.maxCapacity,
    category: data.category,
  }
}
