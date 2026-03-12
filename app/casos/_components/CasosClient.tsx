'use client'

import { useState, useMemo, useTransition, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Caso, Corresponsal, EstadoInterno, EstadoCaso, CasoLog } from '@prisma/client'
import { toast } from 'sonner'
import { 
  Plus, Search, Trash2, Pencil, Eye, Filter, X, 
  Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Download 
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  cn, formatDate, formatCurrency,
  ESTADO_INTERNO_COLORS, ESTADO_CASO_COLORS, ESTADO_CASO_LABELS,
  ESTADO_CASO_ROW_COLORS
} from '@/lib/utils'
import { deleteCaso, getCasos, bulkUpdateEstadoInterno, bulkDeleteCasos } from '@/lib/actions/casos'
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
  const [isMounted, setIsMounted] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // State for filters initialized from URL
  const [search, setSearch] = useState('')
  const [filterEstadoInterno, setFilterEstadoInterno] = useState<string>('all')
  const [filterEstadoCaso, setFilterEstadoCaso] = useState<string>('all')
  const [filterCorresponsal, setFilterCorresponsal] = useState<string>('all')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [viewingCaso, setViewingCaso] = useState<CasoWithCorresponsal | null>(null)
  const [editingCaso, setEditingCaso] = useState<CasoWithCorresponsal | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isImporting, setIsImporting] = useState(false)

  // Initialization from URL
  useEffect(() => {
    setIsMounted(true)
    const s = searchParams.get('s') || ''
    const ei = searchParams.get('ei') || 'all'
    const ec = searchParams.get('ec') || 'all'
    const cr = searchParams.get('cr') || 'all'
    
    setSearch(s)
    setFilterEstadoInterno(ei)
    setFilterEstadoCaso(ec)
    setFilterCorresponsal(cr)
  }, [searchParams])

  // Update URL when state changes (debounced search would be better, but search is small here)
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Preserve 'open' if it exists
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, pathname, router])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    updateUrl({ s: val })
  }

  const handleEIChange = (val: string) => {
    setFilterEstadoInterno(val)
    updateUrl({ ei: val })
  }

  const handleECChange = (val: string) => {
    setFilterEstadoCaso(val)
    updateUrl({ ec: val })
  }

  const handleCRChange = (val: string) => {
    setFilterCorresponsal(val)
    updateUrl({ cr: val })
  }

  // Auto-open case if ID is in URL
  useEffect(() => {
    if (!isMounted) return
    
    const openId = searchParams.get('open')
    if (openId) {
      const idInt = parseInt(openId)
      const caseToOpen = casos.find(c => c.id === idInt)
      if (caseToOpen) {
        setViewingCaso(caseToOpen)
        setDetailsOpen(true)
        
        // Clean open param
        const params = new URLSearchParams(searchParams.toString())
        params.delete('open')
        router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
      }
    }
  }, [isMounted, searchParams, casos, pathname, router])
  
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
      const matchCR = filterCorresponsal === 'all' || c.corresponsalId === filterCorresponsal
      return matchSearch && matchEI && matchEC && matchCR
    })
  }, [casos, search, filterEstadoInterno, filterEstadoCaso, filterCorresponsal])

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1)
    setSelectedIds([]) // Clear selection when filters change
  }, [search, filterEstadoInterno, filterEstadoCaso, filterCorresponsal])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))

  const paginatedCasos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, currentPage])

  // Selection handlers
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCasos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedCasos.map(c => c.id))
    }
  }

  const hasFilters = filterEstadoInterno !== 'all' || filterEstadoCaso !== 'all' || filterCorresponsal !== 'all' || search !== ''

  const refreshCasos = () => {
    startTransition(async () => {
      const fresh = await getCasos(undefined, true)
      setCasos(fresh as CasoWithCorresponsal[])
      setSelectedIds([])
    })
  }

  const handleDelete = (id: number) => {
    const warning = `⚠️ ADVERTENCIA: ¿ESTÁ SEGURO DE ELIMINAR ESTE REGISTRO?

Esta acción es IRREVERSIBLE y conlleva las siguientes consecuencias:
1. Se eliminará permanentemente de la base de datos.
2. Se perderá todo el historial de auditoría (logs) del caso.
3. Los reportes estadísticos y financieros se verán afectados.
4. La trazabilidad contable de las facturas asociadas se romperá.

Para confirmar, escriba "ELIMINAR" a continuación:`

    const confirmation = window.prompt(warning)
    
    if (confirmation !== 'ELIMINAR') {
      if (confirmation !== null) toast.error('Confirmación incorrecta. El registro no ha sido eliminado.')
      return
    }

    startTransition(async () => {
      try {
        await deleteCaso(id)
        setCasos(prev => prev.filter(c => c.id !== id))
        toast.success('Caso eliminado definitivamente')
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
    router.replace(pathname, { scroll: false })
  }

  // Bulk Actions
  const handleBulkClose = async () => {
    if (!confirm(`¿Cerrar ${selectedIds.length} casos seleccionados?`)) return
    startTransition(async () => {
      try {
        await bulkUpdateEstadoInterno(selectedIds, 'Cerrado')
        toast.success(`${selectedIds.length} casos cerrados`)
        refreshCasos()
      } catch {
        toast.error('Error al actualizar casos')
      }
    })
  }

  const handleBulkDelete = async () => {
    const warning = `⚠️ ADVERTENCIA CRÍTICA: ¿ELIMINAR ${selectedIds.length} REGISTROS?

Está a punto de borrar masivamente ${selectedIds.length} casos. Esta acción es IRREVERSIBLE.
- Se perderán todos los datos y el historial de estos casos.
- Los balances financieros podrían verse alterados significativamente.
- No hay forma de recuperar esta información una vez eliminada.

Para confirmar la eliminación masiva, escriba "ELIMINAR" a continuación:`

    const confirmation = window.prompt(warning)
    
    if (confirmation !== 'ELIMINAR') {
      if (confirmation !== null) toast.error('Confirmación incorrecta. Los registros están a salvo.')
      return
    }

    startTransition(async () => {
      try {
        await bulkDeleteCasos(selectedIds)
        toast.success(`${selectedIds.length} casos eliminados correctamente`)
        refreshCasos()
      } catch {
        toast.error('Error al eliminar casos')
      }
    })
  }

  const handleBulkExport = () => {
    const dataToExport = casos.filter(c => selectedIds.includes(c.id))
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(c => ({
      'ID Assistravel': c.idCasoAssistravel,
      'ID Corresponsal': c.idCasoCorresponsal,
      'Corresponsal': c.corresponsal.nombre,
      'País': c.pais || '',
      'Fecha Inicio': c.fechaInicio ? formatDate(c.fechaInicio) : '',
      'Estado Interno': c.estadoInterno,
      'Estado Caso': ESTADO_CASO_LABELS[c.estadoCaso],
      'Costo USD': c.costoUsd || 0,
      'Fee USD': c.costoFee || 0,
      'Tiene Factura': c.tieneFactura ? 'Sí' : 'No',
      'Nro Factura': c.nroFactura || '',
      'Fecha Factura': c.fechaEmiFact ? formatDate(c.fechaEmiFact) : '',
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Casos')
    XLSX.writeFile(workbook, `export_casos_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Exportación completada')
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

  if (!isMounted) return <div className="p-12 text-center text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-4 relative">
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
              onChange={e => handleSearchChange(e.target.value)}
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
              onChange={e => handleEIChange(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Estado Interno</option>
              {['Abierto', 'Cerrado', 'Pausado', 'Cancelado'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <select
              value={filterEstadoCaso}
              onChange={e => handleECChange(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Estado Caso</option>
              {Object.entries(ESTADO_CASO_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <select
              value={filterCorresponsal}
              onChange={e => handleCRChange(e.target.value)}
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
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 transition-all"
                    checked={paginatedCasos.length > 0 && selectedIds.length === paginatedCasos.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < paginatedCasos.length }}
                    onChange={toggleSelectAll}
                  />
                </th>
                {['ID Assistravel', 'Corresponsal', 'País', 'Fecha Inicio', 'USD', 'Fee', 'Estado Interno', 'Estado Caso', 'Factura', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    {hasFilters ? 'No hay casos que coincidan con los filtros.' : 'No hay casos registrados. Crea el primer caso.'}
                  </td>
                </tr>
              ) : (
                paginatedCasos.map((caso) => (
                  <tr
                    key={caso.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-muted/30 transition-colors group',
                      selectedIds.includes(caso.id) ? 'bg-primary/5' : ESTADO_CASO_ROW_COLORS[caso.estadoCaso]
                    )}
                  >
                    <td className="px-4 py-3 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        checked={selectedIds.includes(caso.id)}
                        onChange={() => toggleSelect(caso.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                      {caso.idCasoAssistravel}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap font-medium">{caso.corresponsal.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{caso.pais ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(caso.fechaInicio)}</td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap font-mono text-xs font-bold">
                      {formatCurrency(caso.costoUsd, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap font-mono text-xs">
                      {formatCurrency(caso.costoFee, 'USD')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', ESTADO_INTERNO_COLORS[caso.estadoInterno])}>
                        {caso.estadoInterno}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', ESTADO_CASO_COLORS[caso.estadoCaso])}>
                        {ESTADO_CASO_LABELS[caso.estadoCaso]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {caso.tieneFactura ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ {caso.nroFactura || 'Factura'}</span>
                          {caso.fechaPagFact && <span className="text-[10px] text-muted-foreground">Pagado: {formatDate(caso.fechaPagFact)}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="font-medium text-foreground">{Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-medium text-foreground">{filtered.length}</span> casos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                  className="w-14 px-2 py-1 text-center bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                />
                <span>de {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                title="Página Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 border-r border-white/10 pr-6">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </div>
            <span className="text-sm font-medium opacity-90">seleccionados</span>
          </div>
          
          <div className="flex items-center gap-5">
            <button 
              onClick={handleBulkClose}
              disabled={isPending}
              className="flex items-center gap-2 text-sm font-medium hover:text-emerald-400 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cerrar Casos
            </button>
            
            <button 
              onClick={handleBulkExport}
              className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <button 
              onClick={handleBulkDelete}
              disabled={isPending}
              className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>

          <button 
            onClick={() => setSelectedIds([])}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            title="Cancelar selección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
        onEdit={(caso) => {
          setDetailsOpen(false)
          setViewingCaso(null)
          setEditingCaso(caso)
          setDialogOpen(true)
        }}
        caso={viewingCaso}
      />
    </div>
  )
}
