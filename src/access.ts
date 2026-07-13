import type { Access } from 'payload'

export const anyone: Access = () => true
export const authenticated: Access = ({ req }) => Boolean(req.user)
export const adminsOnly: Access = ({ req }) => req.user?.role === 'admin'
export const adminsAndEditors: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
