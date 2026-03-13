'use server'

import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, endOfMonth, differenceInDays } from 'date-fns'
import { COUNTRY_COORDS } from '@/lib/geo'

export interface DashboardAnalytics {
  operational: {
    avgResolutionDays: number
    documentationRate: number
    agingCases15: number
    agingCases30: number
  }
  financial: {
    avgTicket: number
    totalRevenue: number
    revenueGrowth: number
    pendingCollection: number
    feeMargin: number
    totalFee: number
    totalCostoUsd: number
    totalMontoAgregado: number
  }
  pipeline: {
    onGoing: number
    toInvoice: number
    collected: number
  }
  funnel: {
    abierto: number
    ongoing: number
    toInvoice: number
    collected: number
  }
  topCountries: { country: string; cost: number }[]
  monthlyTrend: { month: string; year: number; costUsd: number; fee: number; montoAgregado: number }[]
  concentration: { name: string; value: number }[]
  momVolume: { day: string; current: number; previous: number }[]
  pareto: { name: string; count: number; cumulativePercentage: number }[]
  mapData: { id: number; displayId?: string; lat: number; lng: number; country: string; cost: number; city?: string; status: string }[]
  allTimeMapData: { id: number; displayId?: string; lat: number; lng: number; country: string; cost: number; city?: string; status: string }[]
  localCurrencyBreakdown: { country: string; symbol: string; totalLocal: number; totalUsd: number }[]
}

export async function getDashboardAnalytics(dateRange?: { from: Date; to: Date }) {
  const now = new Date()
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  
  // Cases for filtered metrics
  const where = dateRange ? {
    fechaInicio: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  } : {}

  const [allCasos, allCasosGlobal] = await Promise.all([
    prisma.caso.findMany({
      where,
      select: {
        id: true,
        idCasoAssistravel: true,
        fechaInicio: true,
        updatedAt: true,
        estadoInterno: true,
        estadoCaso: true,
        informeMedico: true,
        costoUsd: true,
        costoFee: true,
        montoAgregado: true,
        costoMonedaLocal: true,
        simboloMonedaLocal: true,
        pais: true,
        corresponsalId: true,
        corresponsal: { select: { nombre: true } }
      }
    }),
    prisma.caso.findMany({
      select: {
        id: true,
        idCasoAssistravel: true,
        pais: true,
        costoUsd: true,
        estadoCaso: true,
      }
    })
  ])

  // 1. Operational Metrics
  const closedCasos = allCasos.filter((c) => c.estadoInterno === 'Cerrado' && c.fechaInicio)
  const avgResolutionDays = closedCasos.length > 0
    ? closedCasos.reduce((acc: number, c) => acc + differenceInDays(new Date(c.updatedAt), new Date(c.fechaInicio!)), 0) / closedCasos.length
    : 0

  const casesWithReport = allCasos.filter((c) => c.informeMedico).length
  const documentationRate = allCasos.length > 0 ? (casesWithReport / allCasos.length) * 100 : 0

  const agingCases15 = allCasos.filter((c) => c.estadoInterno !== 'Cerrado' && c.fechaInicio && differenceInDays(now, new Date(c.fechaInicio)) > 15).length
  const agingCases30 = allCasos.filter((c) => c.estadoInterno !== 'Cerrado' && c.fechaInicio && differenceInDays(now, new Date(c.fechaInicio)) > 30).length

  // 2. Financial Metrics
  const totalRevenue = allCasos.reduce((acc: number, c) => acc + (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0), 0)
  const avgTicket = allCasos.length > 0 ? totalRevenue / allCasos.length : 0
  
  const pendingCollection = allCasos
    .filter((c) => c.estadoCaso === 'ParaRefacturar' || c.estadoCaso === 'Refacturado')
    .reduce((acc: number, c) => acc + (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0), 0)
    
  const totalCostoUsd = allCasos.reduce((acc: number, c) => acc + (c.costoUsd || 0), 0)
  const totalFee = allCasos.reduce((acc: number, c) => acc + (c.costoFee || 0), 0)
  const totalMontoAgregado = allCasos.reduce((acc: number, c) => acc + (c.montoAgregado || 0), 0)
  const feeMargin = totalCostoUsd > 0 ? ((totalFee + totalMontoAgregado) / totalCostoUsd) * 100 : 0

  // Growth (MoM) - This requires fetching last month data if not range filtered
  let revenueGrowth = 0
  if (!dateRange) {
    const lastMonthCasos = await prisma.caso.findMany({
      where: {
        fechaInicio: {
          gte: lastMonthStart,
          lte: endOfMonth(subMonths(now, 1))
        }
      },
      select: { costoUsd: true, costoFee: true, montoAgregado: true }
    })
    const lastMonthRevenue = lastMonthCasos.reduce((acc: number, c) => acc + (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0), 0)
    revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
  }

  // 3. Pipeline & Funnel
  const funnel = {
    abierto: allCasos.filter((c) => c.estadoInterno === 'Abierto').length,
    ongoing: allCasos.filter((c) => c.estadoCaso === 'OnGoing').length,
    toInvoice: allCasos.filter((c) => c.estadoCaso === 'ParaRefacturar' || c.estadoCaso === 'Refacturado').length,
    collected: allCasos.filter((c) => c.estadoCaso === 'Cobrado').length
  }

  // 4. Top Countries
  const countryMap: Record<string, number> = {}
  allCasos.forEach((c) => {
    if (c.pais) {
      countryMap[c.pais] = (countryMap[c.pais] || 0) + (c.costoUsd || 0)
    }
  })
  const topCountries = Object.entries(countryMap)
    .map(([country, cost]) => ({ country, cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)

  // 5. Monthly Trend (last 6 months from the latest case or now)
  const latestCase = allCasos.length > 0 ? allCasos.reduce((max: Date, c) => {
    const d = c.fechaInicio ? new Date(c.fechaInicio) : new Date(0);
    return d > max ? d : max;
  }, new Date(0)) : now;
  
  const referenceDate = latestCase.getTime() > 0 ? latestCase : now;

  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const mStart = startOfMonth(subMonths(referenceDate, i))
    const mEnd = endOfMonth(subMonths(referenceDate, i))
    const mCasos = allCasos.filter((c) => c.fechaInicio && new Date(c.fechaInicio) >= mStart && new Date(c.fechaInicio) <= mEnd)
    
    monthlyTrend.push({
      month: mStart.toLocaleString('default', { month: 'short' }),
      year: mStart.getFullYear(),
      costUsd: mCasos.reduce((acc: number, c) => acc + (c.costoUsd || 0), 0),
      fee: mCasos.reduce((acc: number, c) => acc + (c.costoFee || 0), 0),
      montoAgregado: mCasos.reduce((acc: number, c) => acc + (c.montoAgregado || 0), 0)
    })
  }

  // 6. MoM Case Volume (Daily Comparison)
  const momVolume = []
  const currentMonthStartRef = startOfMonth(referenceDate)
  const lastMonthStartRef = startOfMonth(subMonths(referenceDate, 1))
  
  for (let i = 1; i <= 31; i++) {
    const dayCasos = allCasos.filter((c) => c.fechaInicio && new Date(c.fechaInicio).getDate() === i)
    const current = dayCasos.filter((c) => new Date(c.fechaInicio!) >= currentMonthStartRef && new Date(c.fechaInicio!) <= endOfMonth(currentMonthStartRef)).length
    const previous = allCasos.filter((c) => c.fechaInicio && new Date(c.fechaInicio).getDate() === i && new Date(c.fechaInicio) >= lastMonthStartRef && new Date(c.fechaInicio) <= endOfMonth(lastMonthStartRef)).length
    
    if (i <= new Date(endOfMonth(currentMonthStartRef)).getDate() || i <= new Date(endOfMonth(lastMonthStartRef)).getDate()) {
      momVolume.push({ day: i.toString(), current, previous })
    }
  }

  // 7. Pareto Data
  const corMap: Record<string, number> = {}
  allCasos.forEach((c) => {
    const name = c.corresponsal?.nombre || 'Unknown'
    corMap[name] = (corMap[name] || 0) + 1
  })

  const sortedCor = Object.entries(corMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const totalCases = sortedCor.reduce((acc, c) => acc + c.count, 0)
  let cumulativeCount = 0
  const pareto = sortedCor.map(c => {
    cumulativeCount += c.count
    return {
      name: c.name,
      count: c.count,
      cumulativePercentage: totalCases > 0 ? (cumulativeCount / totalCases) * 100 : 0
    }
  })

  // 7. Local Currency Breakdown
  const localMap: Record<string, { totalLocal: number; totalUsd: number; symbol: string }> = {}
  allCasos.forEach((c) => {
    if (c.pais) {
      if (!localMap[c.pais]) {
        localMap[c.pais] = { totalLocal: 0, totalUsd: 0, symbol: '—' }
      }
      localMap[c.pais].totalLocal += (c.costoMonedaLocal || 0)
      // Use full revenue for the USD equivalent
      localMap[c.pais].totalUsd += (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0)
      
      // Update symbol if we find a valid one
      if (c.simboloMonedaLocal && c.simboloMonedaLocal !== '—' && c.simboloMonedaLocal !== 'USD') {
        localMap[c.pais].symbol = c.simboloMonedaLocal
      } else if (localMap[c.pais].symbol === '—' && c.simboloMonedaLocal) {
        localMap[c.pais].symbol = c.simboloMonedaLocal
      }
    }
  })

  const localCurrencyBreakdown = Object.entries(localMap)
    .map(([country, data]) => ({
      country,
      symbol: data.symbol,
      totalLocal: data.totalLocal,
      totalUsd: data.totalUsd
    }))
    .sort((a, b) => b.totalUsd - a.totalUsd)

  return {
    operational: { avgResolutionDays, documentationRate, agingCases15, agingCases30 },
    financial: { avgTicket, totalRevenue, revenueGrowth, pendingCollection, feeMargin, totalFee, totalCostoUsd, totalMontoAgregado },
    pipeline: { 
      onGoing: allCasos.filter((c) => c.estadoCaso === 'OnGoing').reduce((acc: number, c) => acc + (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0), 0),
      toInvoice: pendingCollection,
      collected: allCasos.filter((c) => c.estadoCaso === 'Cobrado').reduce((acc: number, c) => acc + (c.costoUsd || 0) + (c.costoFee || 0) + (c.montoAgregado || 0), 0)
    },
    funnel,
    topCountries,
    monthlyTrend,
    concentration: await getParetoAnalytics(allCasos),
    momVolume,
    pareto,
    mapData: allCasos.filter((c) => c.pais && COUNTRY_COORDS[c.pais]).map((c, index) => {
      const baseCoords = COUNTRY_COORDS[c.pais!] as [number, number]
      const jitterX = ((c.id * 7) % 20 - 10) / 40 
      const jitterY = ((c.id * 13) % 20 - 10) / 40 
      
      return {
        id: c.id,
        displayId: c.idCasoAssistravel,
        lat: baseCoords[0] + jitterX,
        lng: baseCoords[1] + jitterY,
        country: c.pais!,
        cost: c.costoUsd || 0,
        status: c.estadoCaso
      }
    }),
    allTimeMapData: allCasosGlobal.filter((c) => c.pais && COUNTRY_COORDS[c.pais]).map((c, index) => {
      const baseCoords = COUNTRY_COORDS[c.pais!] as [number, number]
      const jitterX = ((c.id * 7) % 20 - 10) / 40 
      const jitterY = ((c.id * 13) % 20 - 10) / 40 
      
      return {
        id: c.id,
        displayId: c.idCasoAssistravel,
        lat: baseCoords[0] + jitterX,
        lng: baseCoords[1] + jitterY,
        country: c.pais!,
        cost: c.costoUsd || 0,
        status: c.estadoCaso
      }
    }),
    localCurrencyBreakdown
  }
}

async function getParetoAnalytics(casos: { corresponsal: { nombre: string } | null }[]) {
  const corMap: Record<string, number> = {}
  casos.forEach(c => {
    const name = c.corresponsal?.nombre || 'Unknown'
    corMap[name] = (corMap[name] || 0) + 1
  })

  const sorted = Object.entries(corMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const total = sorted.reduce((acc, c) => acc + c.count, 0)
  if (total === 0) return []

  const top3 = sorted.slice(0, 3)
  const top3Count = top3.reduce((acc, c) => acc + c.count, 0)
  const othersCount = total - top3Count

  return [
    ...top3.map(c => ({ name: c.name, value: c.count })),
    { name: 'Otros', value: othersCount }
  ].filter(v => v.value > 0)
}

export async function getActionCenterData() {
  const now = new Date()
  
  // 1. Upcoming Expiring Invoices (Next 7 days or expired)
  const upcomingInvoices = await prisma.caso.findMany({
    where: {
      estadoCaso: { in: ['Refacturado', 'ParaRefacturar'] },
      fechaVtoFact: { not: null }
    },
    include: { corresponsal: { select: { nombre: true } } },
    orderBy: { fechaVtoFact: 'asc' },
    take: 5
  })

  // 2. Cases without Invoice Number (But marked for refacturing)
  const missingInvoiceNumbers = await prisma.caso.findMany({
    where: {
      estadoCaso: { in: ['ParaRefacturar', 'Refacturado'] },
      nroFactura: { equals: '' }
    },
    include: { corresponsal: { select: { nombre: true } } },
    take: 5
  })

  // 3. Star Corresponsales (Total cases this month)
  const latestCase = await prisma.caso.findFirst({
    orderBy: { fechaInicio: 'desc' },
    select: { fechaInicio: true }
  })
  
  const referenceDate = latestCase?.fechaInicio || now
  const currentMonthStart = startOfMonth(referenceDate)
  
  const starCorresponsales = await prisma.corresponsal.findMany({
    select: {
      id: true,
      nombre: true,
      pais: true,
      _count: {
        select: {
          casos: {
            where: {
              fechaInicio: { gte: currentMonthStart }
            }
          }
        }
      }
    },
    orderBy: {
      casos: { _count: 'desc' }
    },
    take: 4
  })

  return { upcomingInvoices, missingInvoiceNumbers, starCorresponsales }
}

export async function getAIInsights(data: DashboardAnalytics) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined in environment variables')
    return "Error: Configuración de IA incompleta."
  }
  const prompt = `
    Analiza los siguientes datos operativos y financieros de Assistravel (empresa de asistencia médica) y genera un resumen ejecutivo profesional y accionable (máximo 150 palabras). 
    Enfócate en eficiencia operacional, flujo de caja y áreas de riesgo.

    DATOS:
    - SLA (Resolución): ${data.operational.avgResolutionDays.toFixed(1)} días
    - Tasa Documentación: ${data.operational.documentationRate.toFixed(1)}%
    - Casos Críticos (>30 días): ${data.operational.agingCases30}
    - Revenue Total: $${data.financial.totalRevenue.toLocaleString()}
    - Crecimiento MoM: ${data.financial.revenueGrowth.toFixed(1)}%
    - Pendiente de Cobro: $${data.financial.pendingCollection.toLocaleString()}
    - Margen de Fee: ${data.financial.feeMargin.toFixed(1)}%
    - Top Países (Costo): ${data.topCountries.map(c => `${c.country} ($${c.cost.toLocaleString()})`).join(', ')}

    Genera el análisis en español con un tono ejecutivo y orientado a la toma de decisiones.
  `

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const result = await response.json()
    
    if (result.error) {
      console.error('Gemini API Error:', result.error)
      return `Error de API: ${result.error.message || 'Error desconocido'}`
    }

    if (!result.candidates || result.candidates.length === 0) {
      console.error('Gemini API No Candidates:', result)
      return "La IA no pudo generar una respuesta. Verifica los filtros de seguridad o los datos de entrada."
    }

    const text = result.candidates[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('Gemini API Unexpected Structure:', result)
      return "La respuesta de la IA tiene un formato inesperado."
    }

    return text
  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return "Error de conexión con el servicio de IA."
  }
}
