import { getUsers, getCurrentUser } from '@/lib/actions/users'
import { redirect } from 'next/navigation'
import { UserManagementTable } from './_components/UserManagementTable'
import { AdminUsersHeader } from './_components/AdminUsersHeader'

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.rol !== 'admin') {
    redirect('/')
  }

  const users = await getUsers()

  return (
    <div className="p-6 md:p-8 space-y-8">
      <AdminUsersHeader />

      <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
        <UserManagementTable initialUsers={users} />
      </div>
    </div>
  )
}
