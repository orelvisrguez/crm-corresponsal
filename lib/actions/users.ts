'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UserRole, UserStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Utility to get current user and profile
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  return { ...user, profile }
}

// Admin only: Get all users
export async function getUsers() {
  const user = await getCurrentUser()
  if (user?.profile?.rol !== 'admin') {
    throw new Error('No autorizado')
  }

  return await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

// Admin only: Update user role or status
export async function updateUser(id: string, data: { rol?: UserRole, estado?: UserStatus }) {
  const user = await getCurrentUser()
  if (user?.profile?.rol !== 'admin') {
    throw new Error('No autorizado')
  }

  const updated = await prisma.profile.update({
    where: { id },
    data
  })

  revalidatePath('/admin/users')
  return updated
}

// Sign out action
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
