'use client'

import { useState, useTransition } from 'react'
import { Corresponsal } from '@prisma/client'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Globe, Mail, Phone, FileText, Search, Star, ExternalLink, MapPin, Tag } from 'lucide-react'
import { deleteCorresponsal, getCorresponsales } from '@/lib/actions/corresponsales'
import { CorresponsalDialog } from './CorresponsalDialog'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

type CorresponsalWithCount = Corresponsal & { _count: { casos: number } }

interface Props {
  initialCorresponsales: CorresponsalWithCount[]
}

export function CorresponsalesClient({ initialCorresponsales }: Props) {
  const [corresponsales, setCorresponsales] = useState(initialCorresponsales)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Corresponsal | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getCorresponsales()
      setCorresponsales(fresh as CorresponsalWithCount[])
    })
  }

  const handleDelete = (id: string, nombre: string) => {
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

  const filtered = corresponsales.filter(c => {
    const term = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.pais?.toLowerCase() || '').includes(term) ||
      c.especialidades.some(s => s.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, país o especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border shadow-sm"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Corresponsal
        </button>
      </div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground bg-card/50 border-dashed">
          No se encontraron corresponsales.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div
              key={c.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              {/* Header with gradient */}
              <div className="h-24 bg-gradient-to-r from-violet-600/10 via-indigo-500/10 to-transparent p-6 flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(c); setDialogOpen(true) }}
                    className="p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:text-primary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.nombre)}
                    disabled={isPending}
                    className="p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 pt-2">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {c.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {c.pais}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {c.calificacion || 3}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {c.especialidades && c.especialidades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.especialidades.slice(0, 3).map(esp => (
                        <span key={esp} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] items-center gap-1 flex text-secondary-foreground font-medium">
                          <Tag className="w-2.5 h-2.5" />
                          {esp}
                        </span>
                      ))}
                      {c.especialidades.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{c.especialidades.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{c._count.casos} caso{c._count.casos !== 1 ? 's' : ''} vinculados</span>
                  </div>
                </div>

                <Link
                  href={`/corresponsales/${c.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all group/btn"
                >
                  Ver Ficha Completa
                  <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
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
