'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { AlertCircle, TrendingUp, FileText, CheckCircle2, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate, PAISES } from '@/lib/utils'

interface DashboardProps {
  stats: {
    totalUsdMes: number
    casosAbiertos: number
    facturasVencidas: number
    margenBeneficio: number
  }
  chartDataCorresponsales: any[]
  chartDataEstados: any[]
  alertasFacturas: any[]
  actividadReciente: any[]
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']

export function DashboardMetrics({ stats, chartDataCorresponsales, chartDataEstados, alertasFacturas, actividadReciente }: DashboardProps) {

  return (
    <div className="space-y-6">
      
      {/* 1. Tarjetas de Resumen (KPIs) */}
      <h2 className="text-xl font-bold text-foreground">Resumen Operativo (Mes Actual)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Facturado Mes */}
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Facturado USD</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(stats.totalUsdMes, 'USD')}
          </p>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <TrendingUp className="w-24 h-24" />
          </div>
        </div>

        {/* Casos Abiertos */}
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Casos Abiertos</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {stats.casosAbiertos}
          </p>
        </div>

        {/* Facturas Vencidas */}
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Facturas Vencidas</h3>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-500">
            {stats.facturasVencidas}
          </p>
        </div>

        {/* Margen */}
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Margen Promedio</h3>
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {stats.margenBeneficio.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 2. Gráficos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Volumen por Corresponsal (Ocupa 2 columnas) */}
        <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-foreground mb-6">Volumen por Corresponsal (USD)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataCorresponsales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  cursor={{fill: '#334155', opacity: 0.2}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value: any) => [formatCurrency(value as number, 'USD'), 'Volumen USD']}
                />
                <Bar dataKey="volumenUsd" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Estados (Pie Chart) */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Estados de Casos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartDataEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Alertas y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerta de Facturas Vencidas / Por vencer */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-red-500">Facturas en Alerta (48hs o vencidas)</h3>
          </div>
          
          <div className="space-y-4">
            {alertasFacturas.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                No hay facturas en estado crítico. Todo al día 👍
              </p>
            ) : (
              alertasFacturas.map(caso => (
                <div key={caso.id} className="flex justify-between items-center p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground">{caso.idCasoAssistravel}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{caso.corresponsal.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-bold text-sm">Vence: {formatDate(caso.fechaVtoFact)}</p>
                    <p className="text-xs text-muted-foreground">Fac: {caso.nroFactura || 'S/N'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-foreground" />
            <h3 className="text-lg font-bold text-foreground">Últimos Casos Creados</h3>
          </div>

          <div className="space-y-4">
            {actividadReciente.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                Aún no hay casos registrados.
              </p>
            ) : (
              actividadReciente.map(caso => (
                <div key={caso.id} className="flex justify-between items-center p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-mono text-xs font-semibold text-foreground">{caso.idCasoAssistravel}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                       {caso.corresponsal.nombre} • {caso.pais || 'Sin País'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(caso.fechaInicio)}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground mt-1">
                      {caso.estadoInterno}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
