'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead, syncAlerts } from '@/lib/actions/notifications'
import { Notification } from '@prisma/client'
import Link from 'next/link'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      // Sync alerts first (check for expired cases, etc.)
      await syncAlerts()
      const data = await getNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications([])
    setOpen(false)
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <Info className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-accent transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-destructive-foreground rounded-full flex items-center justify-center border-2 border-background">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="text-sm font-bold text-foreground">Notificaciones</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Check className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-accent/50 transition-colors group relative">
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getIcon(n.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground mb-1">{n.titulo}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {n.mensaje}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground/60 font-medium">
                              {new Date(n.createdAt).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.link && (
                              <Link
                                href={n.link}
                                onClick={() => setOpen(false)}
                                className="text-[10px] font-bold text-primary hover:underline"
                              >
                                Ver detalle
                              </Link>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 bg-muted/30 border-t border-border text-center">
              <button 
                onClick={() => setOpen(false)}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cerrar panel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
