import type { CollectionConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  orderable: true,
  admin: {
    group: 'Program',
    useAsTitle: 'title',
    defaultColumns: ['title', 'day', 'startsAt', 'type', 'location', 'sessionState'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: anyone,
    update: adminsAndEditors,
  },
  versions: { drafts: true },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'day', type: 'relationship', relationTo: 'event-days', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', required: true, admin: { width: '50%' } },
        { name: 'endsAt', type: 'date', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          admin: { width: '50%' },
          options: ['Talk', 'Workshop', 'Panel', 'Networking', 'Visit'],
        },
        { name: 'location', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'speakers',
      type: 'relationship',
      relationTo: 'speakers',
      hasMany: true,
      admin: { isSortable: true, appearance: 'drawer' },
    },
    {
      name: 'sessionState',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Live', value: 'live' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ],
}
