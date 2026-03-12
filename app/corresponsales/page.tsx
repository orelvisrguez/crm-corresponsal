import { getCorresponsales } from '@/lib/actions/corresponsales'
import { CorresponsalesClient } from './_components/CorresponsalesClient'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CorresponsalesPage() {
  const corresponsales = await getCorresponsales()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Corresponsales</h1>
          <p className="text-sm text-muted-foreground">Gestión del catálogo de corresponsales</p>
        </div>
      </div>
      <CorresponsalesClient initialCorresponsales={corresponsales} />
    </div>
  )
}
