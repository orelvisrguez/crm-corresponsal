'use server'

import * as xlsx from 'xlsx'
import { prisma } from '@/lib/prisma'
import { EstadoInterno, EstadoCaso } from '@prisma/client'
import { createNotification } from './notifications'

export async function importCasosFromExcel(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) throw new Error('No se proporcionó ningún archivo.')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse the Excel file
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('El archivo Excel no tiene hojas.')
    
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet)
    
    if (data.length === 0) throw new Error('El archivo Excel está vacío.')

    let importados = 0
    let actualizados = 0

    // Process each row
    for (const row of data) {
      if (!row.IdCasoAssistravel) continue // Skip empty rows

      // 1. Manage Corresponsal
      const nombreCorresponsal = row.nombreCorresponsal ? String(row.nombreCorresponsal).trim() : 'Desconocido'
      
      let corresponsal = await prisma.corresponsal.findFirst({
        where: { nombre: nombreCorresponsal }
      })

      if (!corresponsal) {
        corresponsal = await prisma.corresponsal.create({
          data: {
            nombre: nombreCorresponsal,
            pais: row.Pais ? String(row.Pais).trim() : null,
            notasInternas: 'Creado automáticamente desde importación Excel'
          }
        })
      }

      // 2. Map and parse data
      const estadoInternoMap: Record<string, EstadoInterno> = {
        'Abierto': 'Abierto',
        'Cerrado': 'Cerrado',
        'Pausado': 'Pausado',
        'Cancelado': 'Cancelado'
      }
      
      const estadoCasoMap: Record<string, EstadoCaso> = {
        'No Fee': 'NoFee',
        'NoFee': 'NoFee',
        'On Going': 'OnGoing',
        'OnGoing': 'OnGoing',
        'Refacturado': 'Refacturado',
        'Para Refacturar': 'ParaRefacturar',
        'ParaRefacturar': 'ParaRefacturar',
        'Cobrado': 'Cobrado'
      }

      const eiRaw = String(row.EstadoInterno || 'Abierto').trim()
      const estadoInterno = estadoInternoMap[eiRaw] || 'Abierto'

      const ecRaw = String(row.EstadoCaso || 'NoFee').trim()
      const estadoCaso = estadoCasoMap[ecRaw] || 'NoFee'

      // Dates parsing (handling native JS dates from xlsx or strings)
      const parseDate = (val: unknown) => {
        if (!val) return null

        let d: Date | null = null

        if (val instanceof Date) {
          d = val
        } else if (typeof val === 'number') {
          // Si es un número pequeño asume Excel serial (días desde 1900)
          // MS = (val - 25569) * 86400 * 1000
          if (val < 100000) {
            d = new Date((val - 25569) * 86400 * 1000)
          } else {
            // Asume epoch en milisegundos si es un numero grande
            d = new Date(val)
          }
        } else {
          d = new Date(String(val))
        }

        if (d && !isNaN(d.getTime())) {
          // Reject out of bounds years to prevent DB errors (like +082026)
          const year = d.getFullYear()
          if (year > 1900 && year < 2100) {
            return d
          }
        }
        
        return null
      }

      const casoData = {
        corresponsalId: corresponsal.id,
        idCasoCorresponsal: row.IdCasoCorresponsal ? String(row.IdCasoCorresponsal) : null,
        fechaInicio: parseDate(row.FechaInicio),
        pais: row.Pais ? String(row.Pais) : null,
        costoFee: row.CostoFee ? parseFloat(String(row.CostoFee)) : 0,
        costoUsd: row.CostoUsd ? parseFloat(String(row.CostoUsd)) : 0,
        montoAgregado: row.MontoAgregado ? parseFloat(String(row.MontoAgregado)) : 0,
        costoMonedaLocal: row.CostoMonedaLocal ? parseFloat(String(row.CostoMonedaLocal)) : 0,
        simboloMonedaLocal: row.SimboloMonedaLocal ? String(row.SimboloMonedaLocal) : null,
        informeMedico: String(row.InformeMedico).toLowerCase() === 'si' || String(row.InformeMedico).toLowerCase() === 'true',
        tieneFactura: String(row.TieneFactura).toLowerCase() === 'si' || String(row.TieneFactura).toLowerCase() === 'true',
        nroFactura: row.NroFactura ? String(row.NroFactura) : null,
        fechaEmiFact: parseDate(row.FechaEmiFact),
        fechaVtoFact: parseDate(row.FechaVtoFact),
        fechaPagFact: parseDate(row.FechaPagFact),
        estadoInterno,
        estadoCaso,
        observaciones: row.Observaciones ? String(row.Observaciones) : null,
      }

      // 3. Upsert Caso
      const idCasoAssistravel = String(row.IdCasoAssistravel).trim()
      
      const existingCaso = await prisma.caso.findUnique({
        where: { idCasoAssistravel }
      })

      if (existingCaso) {
        await prisma.caso.update({
          where: { id: existingCaso.id },
          data: casoData
        })
        actualizados++
      } else {
        await prisma.caso.create({
          data: {
            idCasoAssistravel,
            ...casoData
          }
        })
        importados++
      }
    }

    return { 
      success: true, 
      message: `Proceso completado: ${importados} casos nuevos importados, ${actualizados} casos actualizados.` 
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error importing Excel:', error)
    await createNotification({
      tipo: 'error',
      titulo: 'Error en Importación Excel',
      mensaje: `Ocurrió un error al procesar el archivo Excel: ${message}.`
    })
    return { success: false, error: message }
  }
}
