'use client'

import React from 'react'
import { Caso, Corresponsal, CasoLog } from '@prisma/client'
import { X, Calendar, Globe, DollarSign, FileText, Info, Clock, CheckCircle2, AlertCircle, TrendingUp, History, ArrowRight, Pencil } from 'lucide-react'
import { cn, formatDate, formatCurrency, ESTADO_CASO_LABELS, ESTADO_INTERNO_COLORS, ESTADO_CASO_COLORS } from '@/lib/utils'

type CasoWithCorresponsal = Caso & { 
  corresponsal: Corresponsal,
  logs: CasoLog[]
}

interface Props {
  open: boolean
  onClose: () => void
  onEdit: (caso: CasoWithCorresponsal) => void
  caso: CasoWithCorresponsal | null
}

function DetailItem({ label, value, icon: Icon, className }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className={cn("p-3 rounded-xl bg-muted/30 border border-border/50", className)}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground truncate">
        {value || <span className="text-muted-foreground/50">—</span>}
      </div>
    </div>
  )
}

export function CasoDetailsDialog({ open, onClose, onEdit, caso }: Props) {
  if (!open || !caso) return null

  // Logical Sum based on User Request: fee + costousd + montoagregado
  const logicalSum = (caso.costoFee || 0) + (caso.costoUsd || 0) + (caso.montoAgregado || 0)
  
  const ganancia = (caso.costoFee || 0) - (caso.costoUsd || 0)
  const margen = caso.costoFee ? ((ganancia / caso.costoFee) * 100).toFixed(1) : '0.0'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Detalles del Caso</h2>
              <p className="text-xs font-mono text-muted-foreground">{caso.idCasoAssistravel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 border-r border-border">
            
            {/* Main Info Grid */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Info className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Información General</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <DetailItem label="Corresponsal" value={caso.corresponsal.nombre} icon={Globe} />
                <DetailItem label="País" value={caso.pais} icon={Globe} />
                <DetailItem label="ID Assistravel" value={caso.idCasoAssistravel} className="font-mono" />
                <DetailItem label="ID Corresponsal" value={caso.idCasoCorresponsal} className="font-mono" />
                <DetailItem label="Fecha de Inicio" value={formatDate(caso.fechaInicio)} icon={Calendar} />
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Estado Interno</div>
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", ESTADO_INTERNO_COLORS[caso.estadoInterno])}>
                    {caso.estadoInterno}
                  </span>
                </div>
              </div>
            </section>

            {/* Finances Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <DollarSign className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Finanzas y Costos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <DetailItem label="Costo Fee" value={formatCurrency(caso.costoFee, 'USD')} />
                <DetailItem label="Costo USD" value={formatCurrency(caso.costoUsd, 'USD')} />
                <DetailItem label="Monto Agregado" value={formatCurrency(caso.montoAgregado, 'USD')} />
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Suma Lógica</div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(logicalSum, 'USD')}</div>
                </div>
                <DetailItem 
                  label="Moneda Local" 
                  value={`${caso.simboloMonedaLocal || ''} ${caso.costoMonedaLocal?.toLocaleString() || '0'}`} 
                  className="sm:col-span-2"
                />
                <DetailItem 
                  label="Tasa de Cambio" 
                  value={`1 USD = ${caso.tasaCambio || '—'} ${caso.simboloMonedaLocal || ''}`} 
                  icon={TrendingUp}
                  className="sm:col-span-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Margen de Beneficio</div>
                  <div className="text-lg font-bold text-foreground">{margen}%</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                   <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Informe Médico</div>
                   {caso.informeMedico ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-muted-foreground/30" />}
                </div>
              </div>
            </section>

            {/* Facturación */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-blue-500">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Facturación</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <DetailItem label="Estado de Factura" value={
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", ESTADO_CASO_COLORS[caso.estadoCaso])}>
                    {ESTADO_CASO_LABELS[caso.estadoCaso]}
                  </span>
                } />
                <DetailItem label="Tiene Factura" value={caso.tieneFactura ? 'SI' : 'NO'} />
                <DetailItem label="Nro Factura" value={caso.nroFactura} />
                <DetailItem label="Emisión" value={formatDate(caso.fechaEmiFact)} icon={Clock} />
                <DetailItem label="Vencimiento" value={formatDate(caso.fechaVtoFact)} icon={AlertCircle} className={!caso.fechaPagFact && caso.fechaVtoFact && new Date(caso.fechaVtoFact) < new Date() ? "bg-red-500/10 border-red-500/20" : ""} />
                <DetailItem label="Fecha de Pago" value={formatDate(caso.fechaPagFact)} icon={CheckCircle2} />
              </div>
            </section>

            {/* Observaciones */}
            <section className="space-y-4 pb-4">
               <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Observaciones</h3>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm text-foreground whitespace-pre-wrap min-h-[100px]">
                {caso.observaciones || 'Sin observaciones registradas.'}
              </div>
            </section>
          </div>

          {/* Timeline Sidebar */}
          <div className="w-full md:w-80 bg-muted/10 overflow-y-auto flex flex-col border-t md:border-t-0 md:border-l border-border">
            <div className="sticky top-0 bg-card/80 backdrop-blur-sm z-10 px-6 py-4 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Línea de Tiempo</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {caso.logs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-xs">No hay cambios registrados aún.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {caso.logs.map((log: CasoLog) => (
                    <div key={log.id} className="relative pl-7 group">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-card border-2 border-primary z-10 group-hover:scale-110 transition-transform shadow-sm" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{log.tipo.replace('_', ' ')}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{new Date(log.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm group-hover:border-primary/20 transition-colors">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground">
                            {log.valorAnterior && (
                              <>
                                <span className="opacity-60">{log.valorAnterior}</span>
                                <ArrowRight className="w-3 h-3 opacity-40" />
                              </>
                            )}
                            <span className="font-bold text-primary">{log.valorNuevo}</span>
                            
                            {/* Diff badge for financial values */}
                            {log.valorAnterior && log.valorNuevo && (log.tipo.includes('COSTO') || log.tipo.includes('FEE')) && !isNaN(parseFloat(log.valorAnterior)) && !isNaN(parseFloat(log.valorNuevo)) && (
                              <span className={cn(
                                "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded",
                                parseFloat(log.valorNuevo) > parseFloat(log.valorAnterior) 
                                  ? "bg-emerald-500/10 text-emerald-600" 
                                  : "bg-red-500/10 text-red-600"
                              )}>
                                {parseFloat(log.valorNuevo) > parseFloat(log.valorAnterior) ? '+' : ''}
                                {(parseFloat(log.valorNuevo) - parseFloat(log.valorAnterior)).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[9px] text-muted-foreground flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            {log.usuario || 'Sistema'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button 
            onClick={() => onEdit(caso)}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Pencil className="w-4 h-4" />
            Editar Caso
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-foreground text-background rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
