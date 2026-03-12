'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Corresponsal } from '@prisma/client'
import { toast } from 'sonner'
import { X, Plus, Trash2, Tag, MapPin, Users } from 'lucide-react'
import { corresponsalSchema, CorresponsalFormData } from '@/lib/validations'
import { createCorresponsal, updateCorresponsal } from '@/lib/actions/corresponsales'
import { cn, PAISES } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  corresponsal: Corresponsal | null
  onSuccess: () => void
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
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

export function CorresponsalDialog({ open, onClose, corresponsal, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!corresponsal
  const [newEsp, setNewEsp] = useState('')
  const [newCity, setNewCity] = useState('')

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<CorresponsalFormData>({
    resolver: zodResolver(corresponsalSchema),
    defaultValues: {
      nombre: '',
      email: '',
      pais: '',
      taxId: '',
      direccionOficina: '',
      sitioWeb: '',
      calificacion: 3,
      notasInternas: '',
      ciudadesCobertura: [],
      especialidades: [],
      contactos: []
    }
  })

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'contactos'
  })

  const especialidades = watch('especialidades') || []
  const ciudades = watch('ciudadesCobertura') || []

  useEffect(() => {
    if (corresponsal) {
      reset({
        nombre: corresponsal.nombre,
        email: corresponsal.email ?? '',
        pais: corresponsal.pais ?? '',
        taxId: corresponsal.taxId ?? '',
        direccionOficina: corresponsal.direccionOficina ?? '',
        sitioWeb: corresponsal.sitioWeb ?? '',
        calificacion: corresponsal.calificacion ?? 3,
        notasInternas: corresponsal.notasInternas ?? '',
        ciudadesCobertura: Array.isArray(corresponsal.ciudadesCobertura) ? corresponsal.ciudadesCobertura : [],
        especialidades: Array.isArray(corresponsal.especialidades) ? corresponsal.especialidades : [],
        contactos: Array.isArray(corresponsal.contactos) ? (corresponsal.contactos as any) : [],
      })
    } else {
      reset({ 
        nombre: '', email: '', pais: '', taxId: '', direccionOficina: '', 
        sitioWeb: '', calificacion: 3, notasInternas: '', 
        ciudadesCobertura: [], especialidades: [], contactos: [] 
      })
    }
  }, [corresponsal, reset])

  const addEspecialidad = () => {
    if (!newEsp.trim()) return
    if (!especialidades.includes(newEsp.trim())) {
      setValue('especialidades', [...especialidades, newEsp.trim()])
    }
    setNewEsp('')
  }

  const removeEspecialidad = (val: string) => {
    setValue('especialidades', especialidades.filter(e => e !== val))
  }

  const addCiudad = () => {
    if (!newCity.trim()) return
    if (!ciudades.includes(newCity.trim())) {
      setValue('ciudadesCobertura', [...ciudades, newCity.trim()])
    }
    setNewCity('')
  }

  const removeCiudad = (val: string) => {
    setValue('ciudadesCobertura', ciudades.filter(c => c !== val))
  }

  const onSubmit = (data: CorresponsalFormData) => {
    startTransition(async () => {
      try {
        let res
        if (isEdit && corresponsal) {
          res = await updateCorresponsal(corresponsal.id, data)
        } else {
          res = await createCorresponsal(data)
        }

        if (res.success) {
          toast.success(isEdit ? 'Corresponsal actualizado' : 'Corresponsal creado')
          onSuccess()
          onClose()
        } else {
          toast.error(res.error || 'Error al procesar la solicitud')
        }
      } catch (err: unknown) {
        toast.error('Ocurrió un error inesperado. Por favor intente nuevamente.')
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? 'Editar Corresponsal' : 'Nuevo Corresponsal'}
            </h2>
            <p className="text-xs text-muted-foreground italic">Gestión de datos fiscales y operativos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-8">
          {/* Seccion 1: Identificación */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Identificación y Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre <span className="text-destructive">*</span></label>
                <Input placeholder="Ej. International SOS" {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">País <span className="text-destructive">*</span></label>
                <Select {...register('pais')}>
                  <option value="">Seleccionar...</option>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
                {errors.pais && <p className="text-xs text-destructive mt-1">{errors.pais.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tax ID / RUT</label>
                <Input placeholder="CIF/VAT/RUT" {...register('taxId')} />
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Seccion 2: Contacto & Operativa */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Contacto y Especialidades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Corporativo</label>
                <Input type="email" placeholder="contact@agency.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sitio Web</label>
                <Input placeholder="https://..." {...register('sitioWeb')} />
                {errors.sitioWeb && <p className="text-xs text-destructive mt-1">{errors.sitioWeb.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dirección de Oficina</label>
                <Input placeholder="Calle, Ciudad, Código Postal" {...register('direccionOficina')} />
              </div>

              {/* Especialidades */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Especialidades (Tags)</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Escriba y presione +(Ej. Pediatría)" 
                    value={newEsp} 
                    onChange={e => setNewEsp(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEspecialidad())}
                  />
                  <button type="button" onClick={addEspecialidad} className="bg-primary text-white p-2 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {especialidades.map(e => (
                    <span key={e} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider border border-primary/20">
                      {e}
                      <button type="button" onClick={() => removeEspecialidad(e)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Ciudades */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ciudades de Cobertura (Tags)</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Escriba y presione +(Ej. Madrid)" 
                    value={newCity} 
                    onChange={e => setNewCity(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCiudad())}
                  />
                  <button type="button" onClick={addCiudad} className="bg-secondary text-secondary-foreground p-2 rounded-lg border border-border">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ciudades.map(c => (
                    <span key={c} className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider border border-border">
                      {c}
                      <button type="button" onClick={() => removeCiudad(c)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Seccion 3: Contactos Adicionales */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contactos Adicionales
            </h3>
            <div className="space-y-3">
              {contactFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl relative border border-border/50">
                  <button 
                    type="button" 
                    onClick={() => removeContact(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full shadow-sm hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Nombre</label>
                    <Input {...register(`contactos.${index}.nombre` as const)} placeholder="Nombre completo" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Cargo</label>
                    <Input {...register(`contactos.${index}.cargo` as const)} placeholder="Puesto" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Email</label>
                    <Input {...register(`contactos.${index}.email` as const)} placeholder="Email directo" />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendContact({ nombre: '', cargo: '', email: '' })}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Añadir Otro Contacto
              </button>
            </div>
          </section>

          <hr className="border-border/50" />

          {/* Seccion 4: Scoring e Internos */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary/70">Calificación y Auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confiabilidad (Scoring)</label>
                <Select {...register('calificacion', { valueAsNumber: true })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notas Internas de Desempeño</label>
                <textarea
                  rows={2}
                  placeholder="Detalle sobre nivel de servicio..."
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                    'resize-none'
                  )}
                  {...register('notasInternas')}
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-6 pb-2 border-t border-border mt-auto sticky bottom-0 bg-card z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg active:scale-95 flex items-center justify-center min-w-[140px]"
            >
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Corresponsal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
