/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.on('/dashboard').render('pages/dashboard').as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())

router
  .group(() => {
    router.get('/admin', [controllers.Admin, 'index']).as('admin.index')
    router
      .post('/admin/users/:id/toggle-admin', [controllers.Admin, 'toggleAdmin'])
      .as('admin.users.toggle')
    router.post('/admin/users/:id/delete', [controllers.Admin, 'destroy']).as('admin.users.destroy')
  })
  .use(middleware.auth())
  .use(middleware.admin())

router
  .group(() => {
    router
      .post('/events/:id/registrations/:registrationId/delete', [
        controllers.Events,
        'destroyRegistration',
      ])
      .as('events.registrations.destroy')
    router.post('/events/:id/delete', [controllers.Events, 'destroy']).as('events.destroy')
  })
  .use(middleware.auth())
  .use(middleware.admin())

// 1. Afficher la liste des événements (accessible à tout le monde sur l'accueil ou une page dédiée)
router.get('/events', [controllers.Events, 'index']).as('events.index')

// 2. Routes protégées (nécessite d'être connecté pour créer un événement)
router
  .group(() => {
    // Afficher le formulaire de création
    router.get('/events/create', [controllers.Events, 'create']).as('events.create')
    // Enregistrer le nouvel événement
    router.post('/events', [controllers.Events, 'store']).as('events.store')
    // Inscrire l'utilisateur connecté à un événement
    router.post('/events/:id/register', [controllers.Events, 'register']).as('events.register')
    // Désinscrire l'utilisateur connecté d'un événement
    router
      .post('/events/:id/unregister', [controllers.Events, 'unregister'])
      .as('events.unregister')
  })
  .use(middleware.auth())
