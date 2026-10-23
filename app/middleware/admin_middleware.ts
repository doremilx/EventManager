import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    if (!auth.user?.isAdmin) {
      return response.abort('Cette action est réservée aux administrateurs.', 403)
    }

    return next()
  }
}
