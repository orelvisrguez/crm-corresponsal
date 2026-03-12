'use client'

import { useState, useTransition } from 'react'
import { Corresponsal } from '@prisma/client'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Mail, Phone, FileText } from 'lucide-react'
import { deleteCorresponsal, getCorresponsales } from '@/lib/actions/corresponsales'
import { CorresponsalDialog } from './CorresponsalDialog'

type CorresponsalWithCount = Corresponsal & { _count: { casos: number } }

interface Props {
  initialCorresponsales: CorresponsalWithCount[]
}

export function CorresponsalesClient({ initialCorresponsales }: Props) {
  const [corresponsales, setCorresponsales] = useState(initialCorresponsales)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Corresponsal | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getCorresponsales()
      setCorresponsales(fresh as CorresponsalWithCount[])
    })
  }

  const handleDelete = (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar al corresponsal "${nombre}"? Sus casos no serán eliminados.`)) return
    startTransition(async () => {
      try {
        await deleteCorresponsal(id)
        setCorresponsales(prev => prev.filter(c => c.id !== id))
        toast.success('Corresponsal eliminado')
      } catch {
        toast.error('Error al eliminar. Verifique que no tenga casos asociados.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 col-span-1">
          <p className="text-sm text-muted-foreground">Total Corresponsales</p>
          <p className="text-3xl font-bold text-foreground mt-1">{corresponsales.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 col-span-1">
          <p className="text-sm text-muted-foreground">Con Casos Activos</p>
          <p className="text-3xl font-bold text-foreground mt-1">
            {corresponsales.filter(c => c._count.casos > 0).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 col-span-1 flex items-center justify-start md:justify-end">
          <button
            onClick={() => { setEditing(null); setDialogOpen(true) }}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Corresponsal
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      {corresponsales.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          No hay corresponsales registrados. Agrega el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {corresponsales.map(c => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{c.nombre}</h3>
                    <span className="text-xs text-muted-foreground">{c._count.casos} caso{c._count.casos !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(c); setDialogOpen(true) }}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.nombre)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.telefono && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.paisBase && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.paisBase}</span>
                  </div>
                )}
                {c.notas && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.notas}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CorresponsalDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
        corresponsal={editing}
        onSuccess={refresh}
      />
    </div>
  )
}
