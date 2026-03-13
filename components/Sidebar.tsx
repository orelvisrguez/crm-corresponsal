'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Users, LayoutDashboard, HeartPulse, Menu, X, LogOut, ShieldAlert, User, FileText, Settings, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { signOut, getCurrentUser } from '@/lib/actions/users'
import { Profile } from '@prisma/client'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ profile: Profile } | null>(null)

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) setUser(u as unknown as { profile: Profile })
    })
  }, [])

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <p className="font-bold text-sm text-foreground">Assistravel</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:bg-accent rounded-md"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-foreground">Assistravel</p>
              <p className="text-[11px] text-muted-foreground">CRM Médico</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1 text-muted-foreground hover:bg-accent rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 flex items-center justify-between border-b border-border bg-muted/10">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notificaciones</p>
          <NotificationBell />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/casos"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/casos') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Briefcase className="w-4 h-4" />
            Casos Médicos
          </Link>
          <Link
            href="/corresponsales"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/corresponsales') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            Corresponsales
          </Link>
          <Link
            href="/finanzas"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/finanzas') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Landmark className="w-4 h-4" />
            Inteligencia
          </Link>
          <Link
            href="/informes"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/informes') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <FileText className="w-4 h-4" />
            Informes Ejecutivos
          </Link>

          <Link
            href="/perfil"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/perfil' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <User className="w-4 h-4" />
            Mi Perfil
          </Link>

          {user?.profile?.rol === 'admin' && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Administración</p>
              </div>
              <Link
                href="/admin/users"
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname.startsWith('/admin/users') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <ShieldAlert className="w-4 h-4" />
                Dpt. Usuarios
              </Link>
              <Link
                href="/admin/settings"
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname.startsWith('/admin/settings') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border p-4 bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <Link href="/perfil" onClick={closeSidebar} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                  {user?.profile?.nombreCompleto || 'Cargando...'}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wide">
                  {user?.profile?.rol || '...'}
                </span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
          
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}
