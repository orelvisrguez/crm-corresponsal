import { getUsers, getCurrentUser } from '@/lib/actions/users'
import { redirect } from 'next/navigation'
import { UserRole, UserStatus } from '@prisma/client'
import { UserManagementTable } from './_components/UserManagementTable'

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.rol !== 'admin') {
    redirect('/')
  }

  const users = await getUsers()

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los accesos, roles y estados de los operadores del sistema.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <UserManagementTable initialUsers={users} />
      </div>
    </div>
  )
}
