'use client'

import { useState, useEffect, useTransition } from 'react'
import { getCurrentUser, updateProfile } from '@/lib/actions/users'
import { User, Mail, Shield, ShieldCheck, ShieldAlert, Save, Loader2, Calendar } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Profile } from '@prisma/client'

const ROLE_LABELS = {
  admin: 'Administrador',
  operador: 'Operador',
  visor: 'Visor',
}

const ROLE_COLORS = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  operador: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  visor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ email: string; profile: Profile } | null>(null)
  const [nombre, setNombre] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        setUser(u as { email: string; profile: Profile })
        setNombre(u.profile?.nombreCompleto || '')
      }
      setIsLoading(false)
    })
  }, [])

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    startTransition(async () => {
      try {
        await updateProfile({ nombreCompleto: nombre.trim() })
        toast.success('Perfil actualizado correctamente')
        // Refresh local state or just trust the revalidate
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        toast.error('Error al actualizar perfil', { description: message })
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const profile = user.profile
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold">Perfil no encontrado</h2>
          <p className="text-muted-foreground mt-1">
            No se encontro un perfil asociado a tu cuenta. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  const RoleIcon = profile.rol === 'admin' ? ShieldAlert : profile.rol === 'operador' ? ShieldCheck : Shield

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información personal y revisa tus permisos en el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl shadow-sm p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 mx-auto">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-card",
                profile.rol === 'admin' ? "bg-red-500" : "bg-emerald-500"
              )}>
                <RoleIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">{profile.nombreCompleto}</h2>
            <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
            
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-4",
              ROLE_COLORS[profile.rol as keyof typeof ROLE_COLORS]
            )}>
              {ROLE_LABELS[profile.rol as keyof typeof ROLE_LABELS]}
            </div>

            <div className="pt-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Miembro desde:
                </span>
                <span className="text-foreground font-bold">{formatDate(profile.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Estado:
                </span>
                <span className="text-emerald-500 font-bold uppercase">{profile.estado}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Datos Personales</h3>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="nombre" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="nombre"
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none opacity-50">
                    Email (No editable)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <input
                      type="email"
                      className="flex h-10 w-full rounded-md border border-input bg-muted px-9 py-2 text-sm opacity-50 cursor-not-allowed"
                      value={profile.email}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isPending || nombre.trim() === profile.nombreCompleto}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-500">Privacidad y Seguridad</p>
              <p className="text-xs text-amber-600/80 mt-0.5">
                Tu rol como <strong>{ROLE_LABELS[profile.rol as keyof typeof ROLE_LABELS]}</strong> determina qué acciones puedes realizar en la plataforma. 
                Si necesitas cambiar tu nivel de acceso, por favor contacta con el administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
