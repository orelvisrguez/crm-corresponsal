import { prisma } from '@/lib/prisma'
import { DashboardMetrics } from './_components/DashboardMetrics'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  
  // 1. Data Fetching
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const alertThreshold = new Date(now)
  alertThreshold.setDate(alertThreshold.getDate() + 2) // Next 48hs

  const [
    casosMesAction,
    casosAbiertosCount,
    facturasVencidasL,
    todosCasos,
    corresponsales,
    actividadReciente
  ] = await Promise.all([
    // Casos for this month calculations
    prisma.caso.findMany({
      where: { fechaInicio: { gte: firstDayOfMonth } }
    }),
    
    // Casos Abiertos (Total)
    prisma.caso.count({
      where: { estadoInterno: 'Abierto' }
    }),

    // Facturas vencidas o por vencer (próximas 48hs) y NO PAGADAS
    prisma.caso.findMany({
      where: {
        tieneFactura: true,
        fechaVtoFact: { lte: alertThreshold },
        fechaPagFact: null
      },
      include: { corresponsal: true },
      orderBy: { fechaVtoFact: 'asc' },
      take: 10
    }),

    // Todos los casos report stats/charts
    prisma.caso.findMany({
      select: {
        costoUsd: true,
        estadoCaso: true,
        corresponsalId: true
      }
    }),

    // Corresponsales para nombre mapping
    prisma.corresponsal.findMany({ select: { id: true, nombre: true } }),

    // Actividad reciente (Ultimos 5 casos creados/actualizados)
    prisma.caso.findMany({
      include: { corresponsal: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  // 2. Data Processing para las tarjetas principales
  const totalUsdMes = casosMesAction.reduce((acc, curr) => acc + (curr.costoUsd || 0), 0)
  
  // Margen: Promedio o Total ((Fee - CostoUsd) / Fee * 100) -> Vamos a hacer una suma total para el margen promedio ponderado.
  const diffFeeUsd = casosMesAction.reduce((acc, curr) => acc + ((curr.costoFee || 0) - (curr.costoUsd || 0)), 0)
  const totalFee = casosMesAction.reduce((acc, curr) => acc + (curr.costoFee || 0), 0)
  const margenBeneficio = totalFee > 0 ? (diffFeeUsd / totalFee) * 100 : 0

  const stats = {
    totalUsdMes,
    casosAbiertos: casosAbiertosCount,
    facturasVencidas: facturasVencidasL.length,
    margenBeneficio
  }

  // 3. Process chart data (Corresponsales)
  const volumenPorCorresponsal: Record<number, number> = {}
  todosCasos.forEach(c => {
    if (c.costoUsd) {
      volumenPorCorresponsal[c.corresponsalId] = (volumenPorCorresponsal[c.corresponsalId] || 0) + c.costoUsd
    }
  })

  const chartDataCorresponsales = corresponsales
    .map(c => ({
      nombre: c.nombre.length > 15 ? c.nombre.substring(0, 15) + '...' : c.nombre,
      volumenUsd: volumenPorCorresponsal[c.id] || 0
    }))
    .filter(c => c.volumenUsd > 0)
    .sort((a, b) => b.volumenUsd - a.volumenUsd) // Mayor a menor
    .slice(0, 10) // Top 10

  // 4. Process chart data (Estados)
  const countPorEstado: Record<string, number> = {}
  todosCasos.forEach(c => {
      countPorEstado[c.estadoCaso] = (countPorEstado[c.estadoCaso] || 0) + 1
  })

  const estadosLabels: Record<string, string> = {
    NoFee: 'No Fee', OnGoing: 'On Going', Refacturado: 'Refacturado', 
    ParaRefacturar: 'Para Refacturar', Cobrado: 'Cobrado'
  }

  const chartDataEstados = Object.entries(countPorEstado)
    .map(([key, value]) => ({
      name: estadosLabels[key] || key,
      value
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de control y métricas clave de la operación.
        </p>
      </div>

      <DashboardMetrics 
        stats={stats}
        chartDataCorresponsales={chartDataCorresponsales}
        chartDataEstados={chartDataEstados}
        alertasFacturas={facturasVencidasL}
        actividadReciente={actividadReciente}
      />
    </div>
  )
}
