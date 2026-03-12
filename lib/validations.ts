import { z } from 'zod'

export const corresponsalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  pais: z.string().min(1, 'El país es requerido'),
  taxId: z.string().optional(),
  direccionOficina: z.string().optional(),
  sitioWeb: z.string().url('URL inválida').optional().or(z.literal('')),
  calificacion: z.number().min(1).max(5).optional(),
  notasInternas: z.string().optional(),
  ciudadesCobertura: z.array(z.string()).optional(),
  especialidades: z.array(z.string()).optional(),
  contactos: z.array(z.object({
    nombre: z.string(),
    cargo: z.string(),
    email: z.string().email().optional().or(z.literal('')),
  })).optional(),
})

export type CorresponsalFormData = z.infer<typeof corresponsalSchema>

export const casoSchema = z.object({
  corresponsalId: z.string().min(1, 'Seleccione un corresponsal'),
  idCasoAssistravel: z.string().min(1, 'El ID Assistravel es requerido'),
  idCasoCorresponsal: z.string().optional(),
  fechaInicio: z.string().optional(),
  pais: z.string().optional(),
  costoFee: z.number().optional(),
  costoUsd: z.number().optional(),
  montoAgregado: z.number().optional(),
  costoMonedaLocal: z.number().optional(),
  tasaCambio: z.number().optional(),
  simboloMonedaLocal: z.string().optional(),
  informeMedico: z.boolean().optional(),
  tieneFactura: z.boolean().optional(),
  nroFactura: z.string().optional(),
  fechaEmiFact: z.string().optional(),
  fechaVtoFact: z.string().optional(),
  fechaPagFact: z.string().optional(),
  estadoInterno: z.enum(['Abierto', 'Cerrado', 'Pausado', 'Cancelado']),
  estadoCaso: z.enum(['NoFee', 'OnGoing', 'Refacturado', 'ParaRefacturar', 'Cobrado']),
  observaciones: z.string().optional(),
})
.refine(
  (data) => {
    if (data.fechaEmiFact && data.fechaVtoFact) {
      return new Date(data.fechaVtoFact) >= new Date(data.fechaEmiFact)
    }
    return true
  },
  {
    message: 'La fecha de vencimiento no puede ser menor a la de emisión',
    path: ['fechaVtoFact'],
  }
)

export type CasoFormData = z.infer<typeof casoSchema>
