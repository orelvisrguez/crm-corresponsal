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

export async function getCorresponsal(id: number) {
  return await prisma.corresponsal.findUnique({ where: { id } })
}

export async function createCorresponsal(data: CorresponsalFormData) {
  const validated = corresponsalSchema.parse(data)
  const corresponsal = await prisma.corresponsal.create({ data: validated })
  revalidatePath('/corresponsales')
  revalidatePath('/casos')
  return { success: true, data: corresponsal }
}

export async function updateCorresponsal(id: number, data: CorresponsalFormData) {
  const validated = corresponsalSchema.parse(data)
  const corresponsal = await prisma.corresponsal.update({ where: { id }, data: validated })
  revalidatePath('/corresponsales')
  revalidatePath('/casos')
  return { success: true, data: corresponsal }
}

export async function deleteCorresponsal(id: number) {
  await prisma.corresponsal.delete({ where: { id } })
  revalidatePath('/corresponsales')
  return { success: true }
}
