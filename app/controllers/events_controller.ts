import type { HttpContext } from '@adonisjs/core/http'
import Event from '#models/event'
import EventRegistration from '#models/event_registration'
import { eventValidator } from '#validators/event'
import { transformEventData } from '../transformers/event_transformer.js'
import db from '@adonisjs/lucid/services/db'

export default class EventsController {
  // Afficher la liste des événements
  async index({ view, auth, request }: HttpContext) {
    const category = request.input('category')
    const date = request.input('date')
    const search = request.input('search')
    const categories = await Event.query().select('category').distinct().orderBy('category', 'asc')
    const eventsQuery = Event.query()
      .preload('registrations', (registrationQuery) => registrationQuery.preload('user'))
      .withCount('registrations')

    if (category) {
      eventsQuery.where('category', category)
    }

    if (date) {
      eventsQuery.whereRaw('date(event_date) = ?', [date])
    }

    if (search) {
      eventsQuery.where((query) => {
        query
          .whereILike('title', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
          .orWhereILike('location', `%${search}%`)
          .orWhereILike('category', `%${search}%`)
      })
    }

    const events = await eventsQuery
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
      participants: event.registrations.map((registration) => ({
        id: registration.id,
        name: registration.user.fullName || 'Participant',
      })),
    }))

    return view.render('events/index', {
      eventCards,
      categories: categories.map((event) => event.category),
      selectedCategory: category,
      selectedDate: date,
      search,
    })
  }

  // Afficher le formulaire
  async create({ view }: HttpContext) {
    return view.render('events/create')
  }

  // Enregistrer un événement
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(eventValidator)

    await Event.create(transformEventData(data))

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

  async destroyRegistration({ request, response, session }: HttpContext) {
    const eventId = Number(request.param('id'))
    const registrationId = Number(request.param('registrationId'))

    if (
      !Number.isInteger(eventId) ||
      eventId < 1 ||
      !Number.isInteger(registrationId) ||
      registrationId < 1
    ) {
      session.flash('error', 'Cette inscription est invalide.')
      return response.redirect().toRoute('events.index')
    }

    const registration = await EventRegistration.query()
      .where('id', registrationId)
      .where('eventId', eventId)
      .first()

    if (!registration) {
      session.flash('error', 'Cette inscription n’existe plus.')
      return response.redirect().toRoute('events.index')
    }

    await registration.delete()
    session.flash('success', 'L’inscription a été supprimée.')
    return response.redirect().toRoute('events.index')
  }

  async destroy({ request, response, session }: HttpContext) {
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

    await event.delete()
    session.flash('success', 'L’événement a été supprimé.')
    return response.redirect().toRoute('events.index')
  }
}
