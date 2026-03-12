import { getCasos } from '@/lib/actions/casos'
import { getCorresponsales } from '@/lib/actions/corresponsales'
import { CasosClient } from './_components/CasosClient'
import { LayoutDashboard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CasosPage() {
  const [casos, corresponsales] = await Promise.all([
    getCasos(),
    getCorresponsales(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Casos</h1>
          <p className="text-sm text-muted-foreground">Gestión de asistencias médicas</p>
        </div>
      </div>
      <CasosClient initialCasos={casos} corresponsales={corresponsales} />
    </div>
  )
}
