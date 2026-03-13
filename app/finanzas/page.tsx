import { getDashboardAnalytics, type DashboardAnalytics } from '@/lib/actions/analytics'
import { FinanzasClient } from './_components/FinanzasClient'
import { Landmark } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ 
    from?: string 
    to?: string 
  }>
}

export default async function FinanzasPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  let analytics: DashboardAnalytics | null = null

  try {
    analytics = await getDashboardAnalytics(from && to ? { from, to } : undefined)
  } catch (error) {
    console.error('Error loading financial data:', error)
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-xl font-bold text-foreground font-sans uppercase tracking-tight italic">Error al cargar datos financieros</h2>
        <p className="text-muted-foreground">Por favor, verifica la conexión con la base de datos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Centro de Inteligencia <span className="text-primary not-italic">Assistravel</span></h1>
            <p className="text-sm text-muted-foreground font-medium">Panel avanzado de analítica financiera y operativa en tiempo real</p>
          </div>
        </div>
      </div>

      <FinanzasClient data={analytics} />
    </div>
  )
}
