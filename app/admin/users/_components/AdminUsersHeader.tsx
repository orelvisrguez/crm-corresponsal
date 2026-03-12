'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { UserDialog } from './UserDialog'

export function AdminUsersHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los accesos, roles y estados de los operadores del sistema.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <UserDialog 
        open={open} 
        onClose={() => setOpen(false)} 
        onSuccess={() => {
          // Revalidate or refresh logic if needed
          window.location.reload()
        }}
      />
    </>
  )
}
