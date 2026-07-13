import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'

export const AccessAttempts: CollectionConfig = {
  slug: 'access-attempts',
  admin: { hidden: true },
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: adminsOnly,
    update: adminsOnly,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'failures', type: 'number', required: true, defaultValue: 0 },
    { name: 'windowStartedAt', type: 'date', required: true },
    { name: 'blockedUntil', type: 'date' },
  ],
}

