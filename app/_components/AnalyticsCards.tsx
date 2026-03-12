'use client'

import { 
  DollarSign, 
  Clock, 
  FileCheck, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react'
import { DashboardAnalytics } from '@/lib/actions/analytics'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'

interface Props {
  data: DashboardAnalytics
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendType = 'positive',
  color = 'primary'
}: { 
  title: string
  value: string | number
  description: string
  icon: any
  trend?: number
  trendType?: 'positive' | 'negative'
  color?: 'primary' | 'emerald' | 'amber' | 'blue' | 'rose'
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  }

  return (
    <Card className="hover:shadow-md transition-all border-border/50 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-xl border", colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
              trendType === 'positive' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
          <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
          <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsCards({ data }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Total Revenue / Revenue Growth */}
      <MetricCard 
        title="Total Revenue"
        value={formatCurrency(data.financial.totalRevenue)}
        description="Suma de Costos + Fees"
        icon={DollarSign}
        trend={data.financial.revenueGrowth}
        trendType={data.financial.revenueGrowth >= 0 ? 'positive' : 'negative'}
        color="emerald"
      />

      {/* 2. Efficiency Rate (SLA) */}
      <MetricCard 
        title="Efficiency Rate"
        value={`${data.operational.documentationRate.toFixed(1)}%`}
        description="Casos con Informe Médico"
        icon={FileCheck}
        color="blue"
      />

      {/* 3. Pending Collection */}
      <MetricCard 
        title="Pending Collection"
        value={formatCurrency(data.financial.pendingCollection)}
        description="En proceso de facturación"
        icon={Clock}
        color="amber"
      />

      {/* 4. Active Operations */}
      <MetricCard 
        title="Active Operations"
        value={data.funnel.abierto + data.funnel.ongoing}
        description="Casos abiertos actualmente"
        icon={Zap}
        color="primary"
      />

      {/* Row 2 - Secondary Metrics */}
      <div className="md:col-span-1">
        <MetricCard 
          title="T. Resolución (SLA)"
          value={`${data.operational.avgResolutionDays.toFixed(1)}d`}
          description="Promedio apertura -> cierre"
          icon={Target}
          color="blue"
        />
      </div>
      <div className="md:col-span-1">
        <MetricCard 
          title="Ticket Promedio"
          value={formatCurrency(data.financial.avgTicket)}
          description="Costo promedio por caso"
          icon={TrendingUp}
          color="emerald"
        />
      </div>
      <div className="md:col-span-1">
        <MetricCard 
          title="Margen de Fee"
          value={`${data.financial.feeMargin.toFixed(1)}%`}
          description="Ingresos vs Costo Operativo"
          icon={Zap}
          color="primary"
        />
      </div>
      <div className="md:col-span-1">
        <MetricCard 
          title="Casos Críticos"
          value={data.operational.agingCases30}
          description="Más de 30 días abiertos"
          icon={AlertCircle}
          color="rose"
          trendType="negative"
        />
      </div>
    </div>
  )
}
