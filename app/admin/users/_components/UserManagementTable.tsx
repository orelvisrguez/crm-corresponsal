'use client'

import { useState, useTransition } from 'react'
import { Profile, UserRole, UserStatus } from '@prisma/client'
import { Shield, ShieldAlert, ShieldCheck, MoreHorizontal, UserCog, Power, UserMinus } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { updateUser } from '@/lib/actions/users'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  visor: 'Visor',
}

const ROLE_ICONS: Record<UserRole, any> = {
  admin: ShieldAlert,
  operador: ShieldCheck,
  visor: Shield,
}

export function UserManagementTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()

  const handleUpdate = (userId: string, data: { rol?: UserRole; estado?: UserStatus }) => {
    startTransition(async () => {
      try {
        const updated = await updateUser(userId, data)
        setUsers(users.map(u => u.id === userId ? { ...u, ...updated } : u))
        toast.success('Usuario actualizado', {
          description: `El ${data.rol ? 'rol' : 'estado'} ha sido modificado correctamente.`
        })
      } catch (err: any) {
        toast.error('Error al actualizar', { description: err.message })
      }
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usuario</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rol</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estado</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/10 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{user.nombreCompleto}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = ROLE_ICONS[user.rol as UserRole]
                    return <Icon className={cn("w-3.5 h-3.5", user.rol === 'admin' ? "text-red-500" : "text-primary")} />
                  })()}
                  <span className="text-xs font-medium">{ROLE_LABELS[user.rol as UserRole]}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                  user.estado === 'activo' 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                )}>
                  {user.estado}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={isPending}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground px-3">Cambiar Rol</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleUpdate(user.id, { rol: 'admin' })} className="text-xs font-medium text-red-600">
                      Administrador
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdate(user.id, { rol: 'operador' })} className="text-xs font-medium">
                      Operador
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdate(user.id, { rol: 'visor' })} className="text-xs font-medium">
                      Visor
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleUpdate(user.id, { estado: user.estado === 'activo' ? 'inactivo' : 'activo' })}
                      className={cn("text-xs font-medium", user.estado === 'activo' ? "text-amber-600" : "text-emerald-600")}
                    >
                      {user.estado === 'activo' ? (
                        <><Power className="w-3.5 h-3.5 mr-2" /> Desactivar</>
                      ) : (
                        <><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Activar</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
