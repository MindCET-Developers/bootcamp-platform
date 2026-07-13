import type { CollectionConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  orderable: true,
  admin: {
    group: 'Engagement',
    useAsTitle: 'title',
    defaultColumns: ['title', 'event', 'priority', 'startsAt', 'published'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: anyone,
    update: adminsAndEditors,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Information', value: 'info' },
        { label: 'Schedule change', value: 'schedule' },
        { label: 'Important', value: 'important' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', admin: { width: '50%' } },
        { name: 'endsAt', type: 'date', admin: { width: '50%' } },
      ],
    },
    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
}
