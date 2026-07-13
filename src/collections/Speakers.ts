import type { CollectionConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'

export const Speakers: CollectionConfig = {
  slug: 'speakers',
  admin: {
    group: 'People',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'organization'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: anyone,
    update: adminsAndEditors,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'role', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'organization', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'bio', type: 'textarea', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'contactURL', type: 'text' },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
