import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import { DateTime } from 'luxon' // 1. Importe Luxon pour gérer les dates

export default class EventsController {
  // Afficher la liste des événements
  async index({ view }: HttpContext) {
    const events = await Event.all()
    return view.render('events/index', { events })
  }

  // Afficher le formulaire
  async create({ view }: HttpContext) {
    return view.render('events/create')
  }

  // Enregistrer un événement
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'title',
      'description',
      'location',
      'eventDate',
      'maxCapacity',
      'category',
    ])

    // 2. On crée l'événement en convertissant proprement les types
    await Event.create({
      title: data.title,
      description: data.description,
      location: data.location,
      eventDate: DateTime.fromISO(data.eventDate), // Conversion de la date HTML en DateTime
      maxCapacity: Number(data.maxCapacity), // S'assure que c'est bien un nombre
      category: data.category,
    })

    return response.redirect().toRoute('events.index')
  }
}
