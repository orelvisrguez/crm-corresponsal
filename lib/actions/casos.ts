'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { casoSchema, CasoFormData } from '@/lib/validations'
import { EstadoInterno, EstadoCaso } from '@prisma/client'

export interface CasosFilter {
  estadoInterno?: EstadoInterno
  estadoCaso?: EstadoCaso
  corresponsalId?: number
}

export async function getCasos(filters?: CasosFilter) {
  const where: Record<string, unknown> = {}
  if (filters?.estadoInterno) where.estadoInterno = filters.estadoInterno
  if (filters?.estadoCaso) where.estadoCaso = filters.estadoCaso
  if (filters?.corresponsalId) where.corresponsalId = filters.corresponsalId

  return await prisma.caso.findMany({
    where,
    include: { 
      corresponsal: true,
      logs: { orderBy: { createdAt: 'desc' } }
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
  const validated = casoSchema.parse(data)
  const caso = await prisma.caso.create({
    data: {
      ...validated,
      fechaInicio: validated.fechaInicio ? new Date(validated.fechaInicio) : null,
      fechaEmiFact: validated.fechaEmiFact ? new Date(validated.fechaEmiFact) : null,
      fechaVtoFact: validated.fechaVtoFact ? new Date(validated.fechaVtoFact) : null,
      fechaPagFact: validated.fechaPagFact ? new Date(validated.fechaPagFact) : null,
    },
    include: { corresponsal: true },
  })
  revalidatePath('/casos')
  return { success: true, data: caso }
}

export async function updateCaso(id: number, data: CasoFormData) {
  const validated = casoSchema.parse(data)
  
  // Get current state for comparison
  const existing = await prisma.caso.findUnique({ where: { id } })
  if (!existing) throw new Error('Caso no encontrado')

  const caso = await prisma.caso.update({
    where: { id },
    data: {
      ...validated,
      fechaInicio: validated.fechaInicio ? new Date(validated.fechaInicio) : null,
      fechaEmiFact: validated.fechaEmiFact ? new Date(validated.fechaEmiFact) : null,
      fechaVtoFact: validated.fechaVtoFact ? new Date(validated.fechaVtoFact) : null,
      fechaPagFact: validated.fechaPagFact ? new Date(validated.fechaPagFact) : null,
    },
    include: { corresponsal: true },
  })

  // Log changes
  const logs = []
  if (existing.estadoInterno !== validated.estadoInterno) {
    logs.push({
      tipo: 'ESTADO_INTERNO',
      valorAnterior: existing.estadoInterno,
      valorNuevo: validated.estadoInterno,
    })
  }

  if (existing.estadoCaso !== validated.estadoCaso) {
    logs.push({
      tipo: 'ESTADO_CASO',
      valorAnterior: existing.estadoCaso,
      valorNuevo: validated.estadoCaso,
    })
  }

  // Detect invoice changes
  if (!existing.tieneFactura && validated.tieneFactura) {
    logs.push({
      tipo: 'FACTURACION',
      valorNuevo: `Factura generada: ${validated.nroFactura || 'S/N'}`,
    })
  } else if (existing.nroFactura !== validated.nroFactura) {
    logs.push({
      tipo: 'FACTURACION',
      valorAnterior: existing.nroFactura,
      valorNuevo: validated.nroFactura,
    })
  }

  if (logs.length > 0) {
    await prisma.casoLog.createMany({
      data: logs.map(l => ({ ...l, casoId: id }))
    })
  }

  revalidatePath('/casos')
  return { success: true, data: caso }
}

export async function deleteCaso(id: number) {
  await prisma.caso.delete({ where: { id } })
  revalidatePath('/casos')
  return { success: true }
}
