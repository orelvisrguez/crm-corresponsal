'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UserRole, UserStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Utility to get current user and profile
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    let profile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    // Auto-create profile if missing (helps with DB resets)
    if (!profile) {
      const isAdmin = user.email === 'orelvis.rguez@gmail.com'
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email!,
          nombreCompleto: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          rol: isAdmin ? 'admin' : 'visor',
          estado: 'activo'
        }
      })
    }

    return { ...user, profile }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function checkRole(requiredRoles: UserRole[]) {
  const user = await getCurrentUser()
  if (!user || !user.profile || !requiredRoles.includes(user.profile.rol)) {
    throw new Error('No tiene permisos para realizar esta acción.')
  }
  return user
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

// User update their own profile
export async function updateProfile(data: { nombreCompleto: string }) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')

  const updated = await prisma.profile.update({
    where: { id: user.id },
    data: {
      nombreCompleto: data.nombreCompleto
    }
  })

  revalidatePath('/perfil')
  revalidatePath('/')
  return updated
}

// Admin only: Invite/Create user (Requires Service Role Key)
export async function createAdminUser(data: { email: string, nombreCompleto: string, rol: UserRole }) {
  const user = await getCurrentUser()
  if (user?.profile?.rol !== 'admin') {
    throw new Error('No autorizado')
  }

  // For now, we only create the profile if we can.
  // In a real scenario, we'd use supabase.auth.admin.createUser or similar.
  // This requires SUPABASE_SERVICE_ROLE_KEY which shouldn't be in the client.
  
  throw new Error('La creación directa de usuarios requiere configurar la KEY de servicio de Supabase para omitir la confirmación de email.')
}

// Sign out action
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
