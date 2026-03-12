'use client'

import { useState, useMemo, useTransition } from 'react'
import { Caso, Corresponsal, EstadoInterno, EstadoCaso, CasoLog } from '@prisma/client'
import { toast } from 'sonner'
import { Plus, Search, Trash2, Pencil, Eye, Filter, X, Upload, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  cn, formatDate, formatCurrency,
  ESTADO_INTERNO_COLORS, ESTADO_CASO_COLORS, ESTADO_CASO_LABELS
} from '@/lib/utils'
import { deleteCaso, getCasos } from '@/lib/actions/casos'
import { importCasosFromExcel } from '@/lib/actions/import'
import { CasoDialog } from './CasoDialog'
import { CasoDetailsDialog } from './CasoDetailsDialog'

type CasoWithCorresponsal = Caso & { 
  corresponsal: Corresponsal,
  logs: CasoLog[]
}
type CorresponsalWithCount = Corresponsal & { _count: { casos: number } }

interface Props {
  initialCasos: CasoWithCorresponsal[]
  corresponsales: CorresponsalWithCount[]
}

export function CasosClient({ initialCasos, corresponsales }: Props) {
  const [casos, setCasos] = useState<CasoWithCorresponsal[]>(initialCasos)
  const [search, setSearch] = useState('')
  const [filterEstadoInterno, setFilterEstadoInterno] = useState<string>('all')
  const [filterEstadoCaso, setFilterEstadoCaso] = useState<string>('all')
  const [filterCorresponsal, setFilterCorresponsal] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewingCaso, setViewingCaso] = useState<CasoWithCorresponsal | null>(null)
  const [editingCaso, setEditingCaso] = useState<CasoWithCorresponsal | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isImporting, setIsImporting] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const filtered = useMemo(() => {
    return casos.filter(c => {
      const matchSearch = !search ||
        c.idCasoAssistravel.toLowerCase().includes(search.toLowerCase()) ||
        c.corresponsal.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.pais ?? '').toLowerCase().includes(search.toLowerCase())
      const matchEI = filterEstadoInterno === 'all' || c.estadoInterno === filterEstadoInterno
      const matchEC = filterEstadoCaso === 'all' || c.estadoCaso === filterEstadoCaso
      const matchCR = filterCorresponsal === 'all' || c.corresponsalId === parseInt(filterCorresponsal)
      return matchSearch && matchEI && matchEC && matchCR
    })
  }, [casos, search, filterEstadoInterno, filterEstadoCaso, filterCorresponsal])

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [search, filterEstadoInterno, filterEstadoCaso, filterCorresponsal])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))

  const paginatedCasos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage])

  const hasFilters = filterEstadoInterno !== 'all' || filterEstadoCaso !== 'all' || filterCorresponsal !== 'all' || search !== ''

  const refreshCasos = () => {
    startTransition(async () => {
      const fresh = await getCasos()
      setCasos(fresh as CasoWithCorresponsal[])
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('¿Eliminar este caso? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      try {
        await deleteCaso(id)
        setCasos(prev => prev.filter(c => c.id !== id))
        toast.success('Caso eliminado correctamente')
      } catch {
        toast.error('Error al eliminar el caso')
      }
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterEstadoInterno('all')
    setFilterEstadoCaso('all')
    setFilterCorresponsal('all')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await importCasosFromExcel(formData)
      if (result.success) {
        toast.success(result.message)
        refreshCasos()
      } else {
        toast.error(result.error || 'Error al importar')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al importar archivo')
    } finally {
      setIsImporting(false)
      // reset file input
      e.target.value = ''
    }
  }

  const statsOpen = casos.filter(c => c.estadoInterno === 'Abierto').length
  const statsClosed = casos.filter(c => c.estadoInterno === 'Cerrado').length
  const totalUsd = casos.reduce((acc, c) => acc + (c.costoUsd ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Casos', value: casos.length, color: 'from-blue-600 to-cyan-500' },
          { label: 'Abiertos', value: statsOpen, color: 'from-emerald-600 to-teal-500' },
          { label: 'Cerrados', value: statsClosed, color: 'from-slate-600 to-slate-500' },
          { label: 'Total USD', value: `$${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`, color: 'from-violet-600 to-indigo-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
            <div className={cn('absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full -translate-y-6 translate-x-6 bg-gradient-to-br', stat.color)} />
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por ID, corresponsal o país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="hidden sm:flex items-center justify-center p-2 rounded-md bg-muted/50 border border-border/50 text-muted-foreground">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={filterEstadoInterno}
              onChange={e => setFilterEstadoInterno(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Estado Interno</option>
              {['Abierto', 'Cerrado', 'Pausado', 'Cancelado'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <select
              value={filterEstadoCaso}
              onChange={e => setFilterEstadoCaso(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Estado Caso</option>
              {Object.entries(ESTADO_CASO_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <select
              value={filterCorresponsal}
              onChange={e => setFilterCorresponsal(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Corresponsal</option>
              {corresponsales.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors py-2 sm:py-0"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>

          <div className="md:ml-auto w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border md:border-t-0 flex flex-col sm:flex-row items-center gap-2">
            <label
              className={cn(
                "flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm cursor-pointer",
                isImporting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isImporting ? 'Importando...' : 'Importar Excel'}
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                className="hidden" 
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
            <button
              onClick={() => { setEditingCaso(null); setDialogOpen(true) }}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Caso
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['ID Assistravel', 'Corresponsal', 'País', 'Fecha Inicio', 'USD', 'M. Local', 'Estado Interno', 'Estado Caso', 'Factura', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    {hasFilters ? 'No hay casos que coincidan con los filtros.' : 'No hay casos registrados. Crea el primer caso.'}
                  </td>
                </tr>
              ) : (
                paginatedCasos.map((caso, i) => (
                  <tr
                    key={caso.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-muted/30 transition-colors',
                      i % 2 === 0 ? '' : 'bg-muted/10'
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                      {caso.idCasoAssistravel}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{caso.corresponsal.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{caso.pais ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(caso.fechaInicio)}</td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap font-mono text-xs">
                      {formatCurrency(caso.costoUsd, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap font-mono text-xs">
                      {caso.costoMonedaLocal
                        ? formatCurrency(caso.costoMonedaLocal, caso.simboloMonedaLocal ?? '')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', ESTADO_INTERNO_COLORS[caso.estadoInterno])}>
                        {caso.estadoInterno}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', ESTADO_CASO_COLORS[caso.estadoCaso])}>
                        {ESTADO_CASO_LABELS[caso.estadoCaso]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {caso.tieneFactura ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ {caso.nroFactura ?? ''}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setViewingCaso(caso); setDetailsOpen(true) }}
                          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Ver detalles"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingCaso(caso); setDialogOpen(true) }}
                          className="p-1.5 rounded-md hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(caso.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} an {Math.min(filtered.length, currentPage * itemsPerPage)} de {filtered.length} casos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Página</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setCurrentPage(val)
                    }
                  }}
                  className="w-16 px-2 py-1 text-center bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span>de {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CasoDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingCaso(null) }}
        caso={editingCaso}
        corresponsales={corresponsales}
        onSuccess={refreshCasos}
      />

      <CasoDetailsDialog
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); setViewingCaso(null) }}
        caso={viewingCaso}
      />
    </div>
  )
}
