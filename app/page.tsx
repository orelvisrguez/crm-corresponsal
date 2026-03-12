import { getDashboardAnalytics, getActionCenterData } from '@/lib/actions/analytics'
import { AnalyticsCards } from './_components/AnalyticsCards'
import { AnalyticsCharts } from './_components/AnalyticsCharts'
import { AIExecutiveSummary } from './_components/AIExecutiveSummary'
import { ActionCenter } from './_components/ActionCenter'
import { DateRangePicker } from './_components/DateRangePicker'
import OperationsMap from './_components/OperationsMap'
import { Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ 
    from?: string 
    to?: string 
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  let analytics: DashboardAnalytics | null = null
  let actionCenter: any = null

  try {
    const results = await Promise.all([
      getDashboardAnalytics(from && to ? { from, to } : undefined),
      getActionCenterData()
    ])
    analytics = results[0]
    actionCenter = results[1]
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }

  if (!analytics || !actionCenter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-xl font-bold">Error al cargar datos</h2>
        <p className="text-muted-foreground">Por favor, verifica la conexión con la base de datos y las variables de entorno.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Filter className="w-3 h-3" />
            Control de gestión operativa y financiera en tiempo real
          </p>
        </div>
        
        <DateRangePicker />
      </div>

      {/* 1. AI Insights (Top priority) */}
      <AIExecutiveSummary data={analytics} />

      {/* 2. Key Metrics Cards */}
      <AnalyticsCards data={analytics} />

      {/* 3. Main Operational & Financial Charts */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="w-1 h-5 bg-primary rounded-full" />
           <h2 className="text-lg font-bold text-foreground">Visualizaciones Operativas</h2>
        </div>
        
        <OperationsMap pins={analytics.mapData} />
        
        <AnalyticsCharts data={analytics} />
      </div>

      {/* 4. Action Center (Alerts, Invoices, Stars) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <div className="w-1 h-5 bg-rose-500 rounded-full" />
           <h2 className="text-lg font-bold text-foreground">Action Center & Alerts</h2>
        </div>
        <ActionCenter data={actionCenter} />
      </div>

      {/* Summary Footer */}
      <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Assistravel CRM • Business Intelligence Unit</p>
        <p className="text-[10px] text-muted-foreground italic">Datos actualizados al {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}
