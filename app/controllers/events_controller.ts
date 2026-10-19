import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import EventRegistration from '#models/event_registration'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class EventsController {
  // Afficher la liste des événements
  async index({ view, auth }: HttpContext) {
    const events = await Event.query()
      .preload('registrations', (registrationQuery) => registrationQuery.preload('user'))
      .withCount('registrations')
    const registeredEventIds = new Set<number>()

    if (auth.user) {
      const registrations = await EventRegistration.query()
        .where('userId', auth.user.id)
        .select('eventId')
      registrations.forEach((registration) => registeredEventIds.add(registration.eventId))
    }

    const eventCards = events.map((event) => ({
      event,
      registrationCount: Number(event.$extras.registrations_count),
      isRegistered: registeredEventIds.has(event.id),
      participantNames: event.registrations.map(
        (registration) => registration.user.fullName || 'Participant'
      ),
    }))

    return view.render('events/index', { eventCards })
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

  async register({ request, response, auth, session }: HttpContext) {
    const user = auth.user

    if (!user) {
      session.flash('error', 'Vous devez être connecté pour vous inscrire.')
      return response.redirect().toRoute('session.create')
    }

    const eventId = Number(request.param('id'))

    if (!Number.isInteger(eventId) || eventId < 1) {
      session.flash('error', 'Cet événement est invalide.')
      return response.redirect().toRoute('events.index')
    }

    const event = await Event.find(eventId)

    if (!event) {
      session.flash('error', 'Cet événement n’existe plus.')
      return response.redirect().toRoute('events.index')
    }

    const alreadyRegistered = await EventRegistration.query()
      .where('eventId', event.id)
      .where('userId', user.id)
      .first()

    if (alreadyRegistered) {
      session.flash('error', 'Vous êtes déjà inscrit à cet événement.')
      return response.redirect().toRoute('events.index')
    }

    const registrationCount = await EventRegistration.query()
      .where('eventId', event.id)
      .count('* as total')

    if (Number(registrationCount[0].$extras.total) >= event.maxCapacity) {
      session.flash('error', 'Cet événement affiche complet.')
      return response.redirect().toRoute('events.index')
    }

    await db.transaction(async (trx) => {
      await EventRegistration.create(
        {
          eventId: event.id,
          userId: user.id,
        },
        { client: trx }
      )
    })

    session.flash('success', `Vous êtes inscrit à « ${event.title} ».`)
    return response.redirect().toRoute('events.index')
  }

  async unregister({ request, response, auth, session }: HttpContext) {
    const user = auth.user

    if (!user) {
      session.flash('error', 'Vous devez être connecté pour vous désinscrire.')
      return response.redirect().toRoute('session.create')
    }

    const eventId = Number(request.param('id'))

    if (!Number.isInteger(eventId) || eventId < 1) {
      session.flash('error', 'Cet événement est invalide.')
      return response.redirect().toRoute('events.index')
    }

    const registration = await EventRegistration.query()
      .where('eventId', eventId)
      .where('userId', user.id)
      .first()

    if (!registration) {
      session.flash('error', 'Vous n’êtes pas inscrit à cet événement.')
      return response.redirect().toRoute('events.index')
    }

    await registration.delete()

    session.flash('success', 'Vous êtes désinscrit de cet événement.')
    return response.redirect().toRoute('events.index')
  }
}
