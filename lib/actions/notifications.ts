'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  return await prisma.notification.findMany({
    where: { leida: false },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

export async function markAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { leida: true }
  })
  revalidatePath('/')
}

export async function markAllAsRead() {
  await prisma.notification.updateMany({
    where: { leida: false },
    data: { leida: true }
  })
  revalidatePath('/')
}

/**
 * Logic to check for alerts and generate notifications
 * This could be called from a cron job or when a user logs in
 */
export async function syncAlerts() {
  const now = new Date()
  const alerts = []

  // 1. Casos vencidos sin cobrar
  const expiredCasos = await prisma.caso.findMany({
    where: {
      estadoCaso: { not: 'Cobrado' },
      fechaVtoFact: { lt: now },
      tieneFactura: true
    },
    include: { corresponsal: true }
  })

  for (const caso of expiredCasos) {
    const titulo = `Factura Vencida: ${caso.idCasoAssistravel}`
    const mensaje = `La factura ${caso.nroFactura || 'S/N'} de ${caso.corresponsal.nombre} ha vencido el ${caso.fechaVtoFact?.toLocaleDateString()}.`
    
    // Check if notification already exists to avoid duplicates
    const exists = await prisma.notification.findFirst({
      where: { titulo, leida: false }
    })

    if (!exists) {
      alerts.push({
        tipo: 'warning',
        titulo,
        mensaje,
        link: `/casos?open=${caso.id}`
      })
    }
  }

  // 2. Casos abiertos sin actualizaciones por más de 15 días
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
  const stagnantCasos = await prisma.caso.findMany({
    where: {
      estadoInterno: 'Abierto',
      updatedAt: { lt: fifteenDaysAgo }
    }
  })

  for (const caso of stagnantCasos) {
    const titulo = `Caso Estancado: ${caso.idCasoAssistravel}`
    const mensaje = `Este caso no ha tenido actualizaciones en los últimos 15 días.`
    
    const exists = await prisma.notification.findFirst({
      where: { titulo, leida: false }
    })

    if (!exists) {
      alerts.push({
        tipo: 'info',
        titulo,
        mensaje,
        link: `/casos?open=${caso.id}`
      })
    }
  }

  if (alerts.length > 0) {
    await prisma.notification.createMany({
      data: alerts
    })
    revalidatePath('/')
  }

  return { success: true, count: alerts.length }
}

export async function createNotification(data: { tipo: string, titulo: string, mensaje: string, link?: string }) {
  const notif = await prisma.notification.create({
    data: {
      tipo: data.tipo,
      titulo: data.titulo,
      mensaje: data.mensaje,
      link: data.link
    }
  })
  revalidatePath('/')
  return notif
}
