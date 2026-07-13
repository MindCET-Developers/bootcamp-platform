import type { CollectionConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'

export const EventDays: CollectionConfig = {
  slug: 'event-days',
  labels: { singular: 'Event day', plural: 'Event days' },
  orderable: true,
  admin: {
    group: 'Program',
    useAsTitle: 'label',
    defaultColumns: ['label', 'title', 'date', 'event'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: anyone,
    update: adminsAndEditors,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', required: true, admin: { width: '25%' } },
        { name: 'title', type: 'text', required: true, admin: { width: '45%' } },
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: { width: '30%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    { name: 'summary', type: 'textarea' },
  ],
}
