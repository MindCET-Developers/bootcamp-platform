import type { CollectionConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    group: 'Program',
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'startsAt', 'eventState'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: anyone,
    update: adminsAndEditors,
  },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true },
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
        { name: 'city', type: 'text', required: true, admin: { width: '33%' } },
        { name: 'venue', type: 'text', required: true, admin: { width: '34%' } },
        {
          name: 'timezone',
          type: 'text',
          required: true,
          defaultValue: 'Asia/Seoul',
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Seoul · August 2026' },
        { name: 'headline', type: 'text', required: true },
        { name: 'partnerLine', type: 'text' },
      ],
    },
    {
      name: 'eventState',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
}
