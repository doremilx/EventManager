import vine from '@vinejs/vine'

export const eventValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(255),
  description: vine.string().trim().maxLength(2000).nullable(),
  location: vine.string().trim().minLength(2).maxLength(255),
  eventDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  maxCapacity: vine.number().min(1).max(10000),
  category: vine.string().trim().minLength(2).maxLength(100),
})
