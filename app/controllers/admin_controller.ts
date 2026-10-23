import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AdminController {
  async index({ view }: HttpContext) {
    const users = await User.query().orderBy('createdAt', 'desc')

    return view.render('admin/index', { users })
  }

  async toggleAdmin({ request, response, auth, session }: HttpContext) {
    const userId = Number(request.param('id'))

    if (!Number.isInteger(userId) || userId < 1) {
      session.flash('error', 'Cet utilisateur est invalide.')
      return response.redirect().toRoute('admin.index')
    }

    if (auth.user?.id === userId) {
      session.flash('error', 'Vous ne pouvez pas modifier votre propre rôle administrateur.')
      return response.redirect().toRoute('admin.index')
    }

    const user = await User.find(userId)

    if (!user) {
      session.flash('error', 'Cet utilisateur n’existe plus.')
      return response.redirect().toRoute('admin.index')
    }

    user.isAdmin = !user.isAdmin
    await user.save()

    session.flash(
      'success',
      user.isAdmin
        ? `${user.fullName || user.email} est maintenant administrateur.`
        : `Le rôle administrateur a été retiré à ${user.fullName || user.email}.`
    )
    return response.redirect().toRoute('admin.index')
  }

  async destroy({ request, response, auth, session }: HttpContext) {
    const userId = Number(request.param('id'))

    if (!Number.isInteger(userId) || userId < 1) {
      session.flash('error', 'Cet utilisateur est invalide.')
      return response.redirect().toRoute('admin.index')
    }

    if (auth.user?.id === userId) {
      session.flash('error', 'Vous ne pouvez pas supprimer votre propre compte.')
      return response.redirect().toRoute('admin.index')
    }

    const user = await User.find(userId)

    if (!user) {
      session.flash('error', 'Cet utilisateur n’existe plus.')
      return response.redirect().toRoute('admin.index')
    }

    await user.delete()
    session.flash('success', 'Le compte utilisateur a été supprimé.')
    return response.redirect().toRoute('admin.index')
  }
}
