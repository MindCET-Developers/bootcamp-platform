import type { CollectionConfig } from 'payload'

import { adminsAndEditors } from '../access'

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    group: 'People',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'organization', 'event', 'status'],
  },
  access: {
    create: adminsAndEditors,
    delete: adminsAndEditors,
    read: adminsAndEditors,
    update: adminsAndEditors,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'role', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'organization', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    { name: 'about', type: 'textarea', required: true },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    { name: 'contactURL', type: 'text' },
    {
      name: 'editTokenHash',
      type: 'text',
      admin: { hidden: true },
      access: { read: () => false, create: () => false, update: () => false },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        { label: 'Staff managed', value: 'staff' },
        { label: 'Attendee submitted', value: 'attendee' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      access: {
        update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
      },
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
  ],
}
