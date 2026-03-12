'use client'

import { 
  FileWarning, 
  Trophy, 
  Calendar,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import Link from 'next/link'

interface InvoiceData {
  id: number
  idCasoAssistravel: string
  costoUsd: number | null
  fechaVtoFact: Date | null
  corresponsal: {
    nombre: string
  }
}

interface StarCorresponsal {
  id: string
  nombre: string
  pais: string | null
  _count: {
    casos: number
  }
}

interface Props {
  data: {
    upcomingInvoices: InvoiceData[]
    missingInvoiceNumbers: InvoiceData[]
    starCorresponsales: StarCorresponsal[]
  }
}

export function ActionCenter({ data }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Próximos Vencimientos */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-rose-500/5 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <CardTitle className="text-sm font-bold">Próximos Vencimientos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {data.upcomingInvoices.length > 0 ? data.upcomingInvoices.map((inv) => {
              const daysLeft = inv.fechaVtoFact 
                ? Math.ceil((new Date(inv.fechaVtoFact).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0
              return (
                <div key={inv.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{inv.corresponsal.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.idCasoAssistravel}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-black text-foreground">{formatCurrency(inv.costoUsd || 0)}</p>
                    <Badge variant={daysLeft <= 0 ? "destructive" : "outline"} className="text-[9px] py-0 h-4">
                      {daysLeft <= 0 ? 'Vencida' : `En ${daysLeft} días`}
                    </Badge>
                  </div>
                </div>
              )
            }) : (
              <div className="p-8 text-center text-xs text-muted-foreground italic">No hay facturas próximas a vencer.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Sin Nro Factura */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-amber-500/5 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-sm font-bold">Facturas Pendientes de Carga</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {data.missingInvoiceNumbers.length > 0 ? data.missingInvoiceNumbers.map((inv) => (
              <div key={inv.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{inv.corresponsal.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">{inv.idCasoAssistravel}</p>
                </div>
                <div className="flex items-center gap-3">
                   <p className="text-xs font-black text-foreground">{formatCurrency(inv.costoUsd || 0)}</p>
                   <Link href={`/casos?search=${inv.idCasoAssistravel}`} className="p-1.5 bg-muted rounded-md hover:bg-primary hover:text-white transition-colors">
                     <ExternalLink className="w-3 h-3" />
                   </Link>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-muted-foreground italic">Todas las facturas tienen Nro cargado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Corresponsales Estrella */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-emerald-500/5 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <CardTitle className="text-sm font-bold">Corresponsales del Mes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {data.starCorresponsales.length > 0 ? data.starCorresponsales.map((cor, idx) => (
              <div key={cor.id} className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                  idx === 0 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                )}>
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{cor.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">{cor.pais}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-600">{cor._count.casos}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Casos</p>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-xs text-muted-foreground italic">Sin actividad este mes.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
