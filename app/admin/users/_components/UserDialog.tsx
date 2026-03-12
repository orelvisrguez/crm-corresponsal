'use client'

import { useState, useTransition } from 'react'
import { UserRole } from '@prisma/client'
import { X, UserPlus, Mail, Shield, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserDialog({ open, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<UserRole>('visor')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const { createAdminUser } = await import('@/lib/actions/users')
        await createAdminUser({ email, nombreCompleto: nombre, rol })
        toast.success('Usuario invitado correctamente')
        onSuccess()
        onClose()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        toast.error('Error', { description: message })
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nuevo Usuario</h2>
              <p className="text-xs text-muted-foreground">Envía una invitación de acceso.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Nombre Completo</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Juan Pérez"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  className="w-full bg-background border border-border rounded-xl px-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="email@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Rol en el Sistema</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'operador', 'visor'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRol(r)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      rol === r 
                        ? "bg-primary/10 border-primary text-primary shadow-sm" 
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{r}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isPending ? 'Invitando...' : 'Invitar Usuario'}
            </button>
          </div>
        </form>
        
        <div className="px-6 py-4 bg-amber-500/5 border-t border-amber-500/10">
          <p className="text-[10px] text-amber-600/80 leading-relaxed italic">
            * El usuario recibirá un correo con las instrucciones para configurar su contraseña y acceder al portal.
          </p>
        </div>
      </div>
    </div>
  )
}
