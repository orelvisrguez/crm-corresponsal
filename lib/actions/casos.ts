'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { casoSchema, CasoFormData } from '@/lib/validations'
import { EstadoInterno, EstadoCaso } from '@prisma/client'
import { getCurrentUser, checkRole } from '@/lib/actions/users'

export interface CasosFilter {
  estadoInterno?: EstadoInterno
  estadoCaso?: EstadoCaso
  corresponsalId?: string
}

export async function getCasos(filters?: CasosFilter, includeLogs: boolean = false) {
  const where: Record<string, unknown> = {}
  if (filters?.estadoInterno) where.estadoInterno = filters.estadoInterno
  if (filters?.estadoCaso) where.estadoCaso = filters.estadoCaso
  if (filters?.corresponsalId) where.corresponsalId = filters.corresponsalId

  return await prisma.caso.findMany({
    where,
    include: { 
      corresponsal: true,
      logs: includeLogs ? { orderBy: { createdAt: 'desc' } } : false
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCaso(id: number) {
  return await prisma.caso.findUnique({
    where: { id },
    include: { 
      corresponsal: true,
      logs: { orderBy: { createdAt: 'desc' } }
    },
  })
}

export async function createCaso(data: CasoFormData) {
  await checkRole(['admin', 'operador'])
  const validated = casoSchema.parse(data)
  const caso = await prisma.caso.create({
    data: {
      ...validated,
      fechaInicio: data.fechaInicio ? new Date(`${data.fechaInicio}T00:00:00Z`) : null,
      fechaEmiFact: data.fechaEmiFact ? new Date(`${data.fechaEmiFact}T00:00:00Z`) : null,
      fechaVtoFact: data.fechaVtoFact ? new Date(`${data.fechaVtoFact}T00:00:00Z`) : null,
      fechaPagFact: data.fechaPagFact ? new Date(`${data.fechaPagFact}T00:00:00Z`) : null,
    },
    include: { corresponsal: true },
  })
  revalidatePath('/casos')
  revalidatePath('/')
  return { success: true, data: caso }
}

export async function updateCaso(id: number, data: CasoFormData) {
  await checkRole(['admin', 'operador'])
  const validated = casoSchema.parse(data)
  const user = await getCurrentUser()
  const userName = user?.profile?.nombreCompleto || user?.email || 'Sistema'
  
  // Get current state for comparison
  const existing = await prisma.caso.findUnique({ where: { id } })
  if (!existing) throw new Error('Caso no encontrado')

  const caso = await prisma.caso.update({
    where: { id },
    data: {
      ...validated,
      fechaInicio: data.fechaInicio ? new Date(`${data.fechaInicio}T00:00:00Z`) : null,
      fechaEmiFact: data.fechaEmiFact ? new Date(`${data.fechaEmiFact}T00:00:00Z`) : null,
      fechaVtoFact: data.fechaVtoFact ? new Date(`${data.fechaVtoFact}T00:00:00Z`) : null,
      fechaPagFact: data.fechaPagFact ? new Date(`${data.fechaPagFact}T00:00:00Z`) : null,
    },
    include: { corresponsal: true },
  })

  // Log changes
  const logs: { tipo: string; valorAnterior?: string; valorNuevo?: string }[] = []
  
  const fieldsToLog = [
    { key: 'estadoInterno', label: 'ESTADO_INTERNO' },
    { key: 'estadoCaso', label: 'ESTADO_CASO' },
    { key: 'idCasoAssistravel', label: 'ID_ASSISTRAVEL' },
    { key: 'idCasoCorresponsal', label: 'ID_CORRESPONSAL' },
    { key: 'corresponsalId', label: 'CORRESPONSAL' },
    { key: 'pais', label: 'PAIS' },
    { key: 'costoUsd', label: 'COSTO_USD' },
    { key: 'costoFee', label: 'COSTO_FEE' },
  ] as const

  fieldsToLog.forEach(({ key, label }) => {
    const oldVal = String(existing[key as keyof typeof existing] ?? '')
    const newVal = String(validated[key as keyof typeof validated] ?? '')
    
    if (oldVal !== newVal) {
      logs.push({
        tipo: label,
        valorAnterior: oldVal,
        valorNuevo: newVal,
      })
    }
  })

  // Detect invoice changes
  if (!existing.tieneFactura && validated.tieneFactura) {
    logs.push({
      tipo: 'FACTURACION',
      valorNuevo: `Factura generada: ${validated.nroFactura || 'S/N'}`,
    })
  } else if (existing.nroFactura !== validated.nroFactura) {
    logs.push({
      tipo: 'FACTURACION',
      valorAnterior: existing.nroFactura || 'S/N',
      valorNuevo: validated.nroFactura || 'S/N',
    })
  }

  if (logs.length > 0) {
    await prisma.casoLog.createMany({
      data: logs.map(l => ({ ...l, casoId: id, usuario: userName }))
    })
  }

  revalidatePath('/casos')
  revalidatePath('/')
  return { success: true, data: caso }
}

export async function deleteCaso(id: number) {
  await checkRole(['admin'])
  await prisma.caso.delete({ where: { id } })
  revalidatePath('/casos')
  revalidatePath('/')
  return { success: true }
}

export async function bulkUpdateEstadoInterno(ids: number[], estado: EstadoInterno) {
  await checkRole(['admin', 'operador'])
  
  await prisma.caso.updateMany({
    where: { id: { in: ids } },
    data: { estadoInterno: estado }
  })

  // Optional: Add logs for each case (more expensive but better audit)
  // For now, updateMany is faster for large sets.
  
  revalidatePath('/casos')
  revalidatePath('/')
  return { success: true }
}

export async function bulkDeleteCasos(ids: number[]) {
  await checkRole(['admin'])
  
  await prisma.caso.deleteMany({
    where: { id: { in: ids } }
  })

  revalidatePath('/casos')
  revalidatePath('/')
  return { success: true }
}
