import { EventSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EventRegistration from '#models/event_registration'

export default class Event extends EventSchema {
  @hasMany(() => EventRegistration)
  declare registrations: HasMany<typeof EventRegistration>
}
