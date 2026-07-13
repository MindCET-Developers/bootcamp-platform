import type { CollectionConfig } from 'payload'

import { adminsAndEditors } from '../access'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  labels: { singular: 'Feedback response', plural: 'Feedback responses' },
  admin: {
    group: 'Engagement',
    useAsTitle: 'id',
    defaultColumns: ['session', 'rating', 'comment', 'createdAt'],
    description: 'Session feedback submitted from the attendee app.',
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: adminsAndEditors,
    update: adminsAndEditors,
  },
  fields: [
    { name: 'session', type: 'relationship', relationTo: 'sessions', required: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'comment', type: 'textarea', maxLength: 2000 },
  ],
}
