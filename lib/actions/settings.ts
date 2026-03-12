'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './users'

export type SettingGroup = 'general' | 'financial' | 'integration'

export async function getSettings() {
  return await prisma.setting.findMany({
    orderBy: { group: 'asc' }
  })
}

export async function getSetting(key: string, defaultValue: string = '') {
  const setting = await prisma.setting.findUnique({
    where: { key }
  })
  return setting?.value ?? defaultValue
}

export async function updateSetting(key: string, value: string) {
  const user = await getCurrentUser()
  if (user?.profile?.rol !== 'admin') {
    throw new Error('Solo los administradores pueden cambiar la configuración global.')
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { 
      key, 
      value,
      group: key.startsWith('fin_') ? 'financial' : key.startsWith('int_') ? 'integration' : 'general'
    }
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function seedDefaultSettings() {
  const defaults = [
    { key: 'base_currency', value: 'USD', group: 'financial' },
    { key: 'fin_default_fee', value: '150', group: 'financial' },
    { key: 'fin_tax_rate', value: '0', group: 'financial' },
    { key: 'int_slack_webhook', value: '', group: 'integration' },
    { key: 'int_email_alerts', value: 'true', group: 'integration' },
  ]

  for (const def of defaults) {
    const exists = await prisma.setting.findUnique({ where: { key: def.key } })
    if (!exists) {
      await prisma.setting.create({ data: def })
    }
  }
}
