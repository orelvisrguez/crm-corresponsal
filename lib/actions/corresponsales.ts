'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { corresponsalSchema, CorresponsalFormData } from '@/lib/validations'

export async function getCorresponsales() {
  return await prisma.corresponsal.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { casos: true } } },
  })
}

export async function getCorresponsal(id: string) {
  return await prisma.corresponsal.findUnique({ 
    where: { id },
    include: {
      casos: {
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { casos: true } }
    }
  })
}

export async function getCorresponsalStats(id: string) {
  const casos = await prisma.caso.findMany({
    where: { corresponsalId: id },
    select: {
      costoUsd: true,
      costoFee: true,
      montoAgregado: true,
      estadoCaso: true,
    }
  })

  return casos.reduce((acc: { cobrado: number; pendiente: number }, caso) => {
    const total = (caso.costoUsd || 0) + (caso.costoFee || 0) + (caso.montoAgregado || 0)
    if (caso.estadoCaso === 'Cobrado') {
      acc.cobrado += total
    } else {
      acc.pendiente += total
    }
    return acc
  }, { cobrado: 0, pendiente: 0 })
}

export async function createCorresponsal(data: CorresponsalFormData) {
  try {
    const validated = corresponsalSchema.parse(data)
    const corresponsal = await prisma.corresponsal.create({ data: validated })
    revalidatePath('/corresponsales')
    revalidatePath('/casos')
    return { success: true, data: corresponsal }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && 'meta' in error && typeof error.meta === 'object' && error.meta !== null && 'target' in error.meta && Array.isArray(error.meta.target) && error.meta.target.includes('email')) {
      return { success: false, error: 'Ya existe un corresponsal registrado con este correo electrónico.' }
    }
    return { success: false, error: 'Error al crear el corresponsal. Por favor intente nuevamente.' }
  }
}

export async function updateCorresponsal(id: string, data: CorresponsalFormData) {
  try {
    const validated = corresponsalSchema.parse(data)
    const corresponsal = await prisma.corresponsal.update({ where: { id }, data: validated })
    revalidatePath('/corresponsales')
    revalidatePath(`/corresponsales/${id}`)
    revalidatePath('/casos')
    return { success: true, data: corresponsal }
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002' && 'meta' in error && typeof error.meta === 'object' && error.meta !== null && 'target' in error.meta && Array.isArray(error.meta.target) && error.meta.target.includes('email')) {
      return { success: false, error: 'Ya existe un corresponsal registrado con este correo electrónico.' }
    }
    return { success: false, error: 'Error al actualizar el corresponsal. Por favor intente nuevamente.' }
  }
}

export async function deleteCorresponsal(id: string) {
  await prisma.corresponsal.delete({ where: { id } })
  revalidatePath('/corresponsales')
  return { success: true }
}
