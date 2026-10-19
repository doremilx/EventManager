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

// 1. Afficher la liste des événements (accessible à tout le monde sur l'accueil ou une page dédiée)
router.get('/events', [controllers.Events, 'index']).as('events.index')

// 2. Routes protégées (nécessite d'être connecté pour créer un événement)
router
  .group(() => {
    // Afficher le formulaire de création
    router.get('/events/create', [controllers.Events, 'create']).as('events.create')
    // Enregistrer le nouvel événement
    router.post('/events', [controllers.Events, 'store']).as('events.store')
  })
  .use(middleware.auth())
