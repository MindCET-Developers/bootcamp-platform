import type { GlobalBeforeChangeHook, GlobalConfig } from 'payload'

import { adminsAndEditors, anyone } from '../access'
import { hashAccessCode } from '../lib/attendeeAccess'

const hashNewAccessCode: GlobalBeforeChangeHook = ({ data }) => {
  const code = typeof data.newAccessCode === 'string' ? data.newAccessCode.trim() : ''
  if (code) {
    data.accessCodeHash = hashAccessCode(code)
    data.accessCodeUpdatedAt = new Date().toISOString()
  }
  delete data.newAccessCode
  return data
}

export const AppSettings: GlobalConfig = {
  slug: 'app-settings',
  label: 'App settings',
  admin: { group: 'App' },
  access: {
    read: anyone,
    update: adminsAndEditors,
  },
  hooks: { beforeChange: [hashNewAccessCode] },
  fields: [
    {
      name: 'activeEvent',
      type: 'relationship',
      relationTo: 'events',
      admin: { description: 'The event currently shown in the attendee app.' },
    },
    {
      name: 'design',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', defaultValue: 'Seoul Signal' },
        { name: 'accent', type: 'text', defaultValue: '#65D5DF' },
        { name: 'secondaryAccent', type: 'text', defaultValue: '#EF4CA6' },
      ],
    },
    {
      name: 'directoryEnabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'feedbackEnabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'newAccessCode',
      label: 'Set new attendee access code',
      type: 'text',
      admin: {
        description: 'At least 8 characters. Leave blank to keep the current code.',
        placeholder: 'Enter a new shared event code',
      },
      validate: (value: null | string | undefined) =>
        !value || String(value).trim().length >= 8 || 'Use at least 8 characters.',
      access: {
        read: () => false,
        create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
      },
    },
    {
      name: 'accessCodeHash',
      type: 'text',
      admin: { hidden: true },
      access: {
        read: () => false,
        create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
      },
    },
    {
      name: 'accessCodeUpdatedAt',
      label: 'Access code last changed',
      type: 'date',
      admin: { readOnly: true },
      access: {
        read: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
      },
    },
  ],
}
