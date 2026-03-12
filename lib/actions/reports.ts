'use server'

import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, endOfMonth } from 'date-fns'

// Temporary interface until prisma generate succeeds
export interface Report {
  id: string
  tipo: string
  titulo: string
  contenido: string
  createdAt: Date
  updatedAt: Date
}

export type ReportType = 'economico' | 'operativo' | 'financiero' | 'contable'

export async function getExecutiveReportData() {
  const now = new Date()
  const last6Months = startOfMonth(subMonths(now, 5))

  const [casos, corresponsales] = await Promise.all([
    prisma.caso.findMany({
      include: { corresponsal: { select: { nombre: true, pais: true } } }
    }),
    prisma.corresponsal.findMany({
      include: { _count: { select: { casos: true } } }
    })
  ])

  // Aggregated stats for the AI
  const totalCasos = casos.length
  const casosAbiertos = casos.filter((c: any) => c.estadoInterno === 'Abierto').length
  const costoTotalUsd = casos.reduce((acc: number, c: any) => acc + (c.costoUsd || 0), 0)
  const feeTotalUsd = casos.reduce((acc: number, c: any) => acc + (c.costoFee || 0), 0)
  
  const topCorresponsales = corresponsales
    .sort((a: any, b: any) => b._count.casos - a._count.casos)
    .slice(0, 5)
    .map((c: any) => ({ nombre: c.nombre, casos: c._count.casos }))

  const countries = [...new Set(casos.map((c: any) => c.pais).filter(Boolean))] as string[]
  
  return {
    summary: {
      totalCasos,
      casosAbiertos,
      costoTotalUsd,
      feeTotalUsd,
      totalCorresponsales: corresponsales.length
    },
    topCorresponsales,
    countries,
    timestamp: now.toISOString()
  }
}

export async function generateAIReport(type: ReportType) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: 'API Key no configurada' }

  const data = await getExecutiveReportData()

  const prompts: Record<ReportType, string> = {
    economico: `Genera un INFORME ECONÓMICO EJECUTIVO de alta dirección. 
      Datos: ${JSON.stringify(data.summary)}. 
      REQUERIMIENTOS:
      - Título impactante.
      - Tabla markdown con las métricas clave.
      - Análisis de rentabilidad comparando Costos vs Fees.
      - Proyecciones estratégicas.
      - Usa blockquotes (>) para conclusiones críticas.`,
    operativo: `Genera un INFORME OPERATIVO EJECUTIVO de alta dirección. 
      Datos: ${JSON.stringify(data.summary)}, Top Corresponsales: ${JSON.stringify(data.topCorresponsales)}. 
      REQUERIMIENTOS:
      - Título profesional.
      - Resumen de la red de corresponsales.
      - Tabla markdown con el Top 5 de corresponsales por volumen.
      - Análisis de cobertura geográfica en ${data.countries.length} países.
      - Sección de eficiencia operativa.`,
    financiero: `Genera un INFORME FINANCIERO EJECUTIVO de alta dirección. 
      Datos: Costos USD: ${data.summary.costoTotalUsd}, Fees USD: ${data.summary.feeTotalUsd}. 
      REQUERIMIENTOS:
      - Título formal.
      - Análisis de márgenes brutos (relación fee/costo).
      - Tabla markdown comparativa.
      - Proyecciones de flujo y liquidez operativa.
      - Recomendaciones de optimización.`,
    contable: `Genera un INFORME CONTABLE EJECUTIVO de alta dirección. 
      Datos: ${data.summary.totalCasos} casos procesados, ${data.summary.casosAbiertos} abiertos. 
      REQUERIMIENTOS:
      - Título técnico.
      - Estado de conciliación de facturas.
      - Tabla markdown del estado de los casos.
      - Análisis de cumplimiento administrativo.
      - Roadmap de auditoría.`
  }

  const systemInstruction = `Eres el Chief Operating Officer (COO) de Assistravel. 
    Tu objetivo es crear informes ejecutivos extremadamente profesionales y visuales.
    REGLAS DE FORMATO:
    - Usa Títulos (H1) y Subtítulos (H2, H3) claros.
    - USA TABLAS MARKDOWN para comparar cifras o listar rankings.
    - USA NEGRITAS para resaltar valores monetarios.
    - USA BLOCKQUOTES (>) para "Insights Estratégicos".
    - Mantén un tono ejecutivo: directo, basado en datos y propositivo.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `${systemInstruction}\n\n${prompts[type]}` }] 
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('Gemini Failure:', result)
      return { error: 'La IA no pudo generar el informe.' }
    }

    return { content: text }
  } catch (error) {
    console.error('Report Error:', error)
    return { error: 'Error de conexión con el servicio de IA.' }
  }
}

export async function saveReport(data: { tipo: string, titulo: string, contenido: string }) {
  try {
    // Ensure table exists (fallback for failed db push)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "titulo" TEXT NOT NULL,
        "contenido" TEXT NOT NULL,
        "dataSnapshot" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
      );
    `)

    const id = crypto.randomUUID()
    const now = new Date()
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO "reports" ("id", "tipo", "titulo", "contenido", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5)`,
      id, data.tipo, data.titulo, data.contenido, now
    )
    
    return { success: true, report: { id, ...data, createdAt: now, updatedAt: now } }
  } catch (error) {
    console.error('Save Report Error:', error)
    return { success: false, error: 'Error al guardar el informe en la base de datos' }
  }
}

export async function getSavedReports() {
  try {
    const reports = await prisma.$queryRawUnsafe('SELECT * FROM "reports" ORDER BY "createdAt" DESC')
    return reports as Report[]
  } catch (error) {
    console.error('Get Reports Error:', error)
    return []
  }
}

export async function deleteReport(id: string) {
  try {
    await prisma.$executeRawUnsafe('DELETE FROM "reports" WHERE "id" = $1', id)
    return { success: true }
  } catch (error) {
    console.error('Delete Report Error:', error)
    return { success: false, error: 'Error al eliminar el informe' }
  }
}
