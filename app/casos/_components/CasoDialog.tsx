'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Caso, Corresponsal } from '@prisma/client'
import { toast } from 'sonner'
import { X, Calculator, RefreshCw } from 'lucide-react'
import { casoSchema, CasoFormData } from '@/lib/validations'
import { createCaso, updateCaso } from '@/lib/actions/casos'
import { getExchangeRate } from '@/lib/actions/currency'
import { cn, PAISES, ESTADO_CASO_LABELS, formatCurrency } from '@/lib/utils'

type CasoWithCorresponsal = Caso & { corresponsal: Corresponsal }
type CorresponsalWithCount = Corresponsal & { _count: { casos: number } }

interface Props {
  open: boolean
  onClose: () => void
  caso: CasoWithCorresponsal | null
  corresponsales: CorresponsalWithCount[]
  onSuccess: () => void
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'resize-none',
        className
      )}
      {...props}
    />
  )
}

export function CasoDialog({ open, onClose, caso, corresponsales, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [tipoCambio, setTipoCambio] = useState<number>(1)
  const [isFetchingRate, setIsFetchingRate] = useState(false)
  const isEdit = !!caso

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CasoFormData>({
    resolver: zodResolver(casoSchema),
    defaultValues: {
      estadoInterno: 'Abierto',
      estadoCaso: 'NoFee',
      informeMedico: false,
      tieneFactura: false,
      costoFee: 0,
      costoUsd: 0,
      montoAgregado: 0,
      costoMonedaLocal: 0,
    }
  })

  const costUsd = watch('costoUsd') ?? 0
  const costFee = watch('costoFee') ?? 0
  const montoAg = watch('montoAgregado') ?? 0
  const currentPais = watch('pais')
  const logicalSum = (costUsd || 0) + (costFee || 0) + (montoAg || 0)

  // Auto-fetch exchange rate when country changes
  useEffect(() => {
    if (currentPais && !isEdit) {
      handleFetchRate(currentPais)
    }
  }, [currentPais, isEdit])

  // Auto-calculate local currency when USD or rate changes
  useEffect(() => {
    const usd = parseFloat(String(costUsd)) || 0
    setValue('costoMonedaLocal', parseFloat((usd * tipoCambio).toFixed(2)))
    setValue('tasaCambio', tipoCambio)
  }, [costUsd, tipoCambio, setValue])

  const handleFetchRate = async (pais: string) => {
    setIsFetchingRate(true)
    try {
      const result = await getExchangeRate(pais)
      if (result.success && result.rate) {
        setTipoCambio(result.rate)
        if (result.currency) {
          setValue('simboloMonedaLocal', result.currency)
        }
      }
    } catch (err) {
      console.error('Error fetching rate:', err)
    } finally {
      setIsFetchingRate(false)
    }
  }

  const calcularMonedaLocal = () => {
    const usd = parseFloat(String(costUsd)) || 0
    setValue('costoMonedaLocal', parseFloat((usd * tipoCambio).toFixed(2)))
    setValue('tasaCambio', tipoCambio)
  }

  const onSubmit = (data: CasoFormData) => {
    startTransition(async () => {
      try {
        if (isEdit && caso) {
          await updateCaso(caso.id, data)
          toast.success('Caso actualizado correctamente')
        } else {
          await createCaso(data)
          toast.success('Caso creado correctamente')
        }
        onSuccess()
        onClose()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        toast.error(`Error: ${msg}`)
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Editar Caso' : 'Nuevo Caso'}</h2>
            <p className="text-xs text-muted-foreground">Complete todos los campos requeridos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Identificación */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">Identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Corresponsal</FieldLabel>
                <Select {...register('corresponsalId', { valueAsNumber: true })}>
                  <option value="">Seleccionar...</option>
                  {corresponsales.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </Select>
                {errors.corresponsalId && <p className="text-xs text-destructive mt-1">{errors.corresponsalId.message}</p>}
              </div>
              <div>
                <FieldLabel required>ID Caso Assistravel</FieldLabel>
                <Input placeholder="ASS-2024-001" {...register('idCasoAssistravel')} />
                {errors.idCasoAssistravel && <p className="text-xs text-destructive mt-1">{errors.idCasoAssistravel.message}</p>}
              </div>
              <div>
                <FieldLabel>ID Caso Corresponsal</FieldLabel>
                <Input placeholder="CORP-001" {...register('idCasoCorresponsal')} />
              </div>
              <div>
                <FieldLabel>Fecha de Inicio</FieldLabel>
                <Input type="date" {...register('fechaInicio')} />
              </div>
              <div>
                <FieldLabel>País</FieldLabel>
                <Input 
                  placeholder="Buscar o escribir país..." 
                  {...register('pais')} 
                  list="countries-list"
                />
                <datalist id="countries-list">
                  {PAISES.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>
          </section>

          {/* Costos */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">Costos y Monedas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <FieldLabel>Costo Fee</FieldLabel>
                <Input type="number" step="0.01" placeholder="0.00" {...register('costoFee', { valueAsNumber: true })} />
              </div>
              <div>
                <FieldLabel>Costo USD</FieldLabel>
                <Input type="number" step="0.01" placeholder="0.00" {...register('costoUsd', { valueAsNumber: true })} />
              </div>
              <div>
                <FieldLabel>Monto Agregado</FieldLabel>
                <Input type="number" step="0.01" placeholder="0.00" {...register('montoAgregado', { valueAsNumber: true })} />
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Suma Lógica</div>
                <div className="text-sm font-bold text-foreground">{formatCurrency(logicalSum, 'USD')}</div>
              </div>
            </div>

            {/* Moneda Local Calculator */}
            <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Calculador Moneda Local</span>
                </div>
                {isFetchingRate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Consultando API...
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <FieldLabel>Símbolo Moneda</FieldLabel>
                  <Input placeholder="ARS, EUR..." {...register('simboloMonedaLocal')} />
                </div>
                <div>
                  <FieldLabel>Tipo de Cambio</FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    value={tipoCambio}
                    onChange={e => setTipoCambio(parseFloat(e.target.value) || 1)}
                    placeholder="1.0000"
                  />
                </div>
                <div>
                  <FieldLabel>Costo Moneda Local</FieldLabel>
                  <Input type="number" step="0.01" placeholder="0.00" {...register('costoMonedaLocal', { valueAsNumber: true })} />
                </div>
                <button
                  type="button"
                  onClick={() => currentPais && handleFetchRate(currentPais)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className={cn("w-4 h-4", isFetchingRate && "animate-spin")} />
                  Actualizar Tasa
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">= USD {costUsd || 0} × {tipoCambio}</p>
            </div>
          </section>

          {/* Estados */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">Estados y Documentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Estado Interno</FieldLabel>
                <Select {...register('estadoInterno')}>
                  {['Abierto', 'Cerrado', 'Pausado', 'Cancelado'].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Estado de Caso</FieldLabel>
                <Select {...register('estadoCaso')}>
                  {Object.entries(ESTADO_CASO_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:col-span-2">
                {[
                  { label: 'Informe Médico', field: 'informeMedico' as const },
                  { label: 'Tiene Factura', field: 'tieneFactura' as const },
                ].map(({ label, field }) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(field)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Factura */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <FieldLabel>Nro. Factura</FieldLabel>
                <Input placeholder="F-00001" {...register('nroFactura')} />
              </div>
              <div>
                <FieldLabel>Fecha Emisión</FieldLabel>
                <Input type="date" {...register('fechaEmiFact')} />
              </div>
              <div>
                <FieldLabel>Fecha Vencimiento</FieldLabel>
                <Input type="date" {...register('fechaVtoFact')} />
                {errors.fechaVtoFact && <p className="text-xs text-destructive mt-1">{errors.fechaVtoFact.message}</p>}
              </div>
              <div>
                <FieldLabel>Fecha Pago</FieldLabel>
                <Input type="date" {...register('fechaPagFact')} />
              </div>
            </div>
          </section>

          {/* Observaciones */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">Observaciones</h3>
            <Textarea rows={3} placeholder="Notas adicionales sobre el caso..." {...register('observaciones')} />
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center justify-center"
            >
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Caso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
