'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Corresponsal } from '@prisma/client'
import { toast } from 'sonner'
import { X } from 'lucide-react'
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CorresponsalFormData>({
    resolver: zodResolver(corresponsalSchema),
  })

  useEffect(() => {
    if (corresponsal) {
      reset({
        nombre: corresponsal.nombre,
        email: corresponsal.email ?? '',
        telefono: corresponsal.telefono ?? '',
        paisBase: corresponsal.paisBase ?? '',
        notas: corresponsal.notas ?? '',
      })
    } else {
      reset({ nombre: '', email: '', telefono: '', paisBase: '', notas: '' })
    }
  }, [corresponsal, reset])

  const onSubmit = (data: CorresponsalFormData) => {
    startTransition(async () => {
      try {
        if (isEdit && corresponsal) {
          await updateCorresponsal(corresponsal.id, data)
          toast.success('Corresponsal actualizado')
        } else {
          await createCorresponsal(data)
          toast.success('Corresponsal creado')
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
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? 'Editar Corresponsal' : 'Nuevo Corresponsal'}
            </h2>
            <p className="text-xs text-muted-foreground">Datos del corresponsal médico</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nombre <span className="text-destructive">*</span>
            </label>
            <Input placeholder="Nombre del corresponsal" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <Input type="email" placeholder="email@ejemplo.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Teléfono</label>
              <Input placeholder="+1 555 0000" {...register('telefono')} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">País Base</label>
            <Select {...register('paisBase')}>
              <option value="">Seleccionar país...</option>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notas</label>
            <textarea
              rows={3}
              placeholder="Información adicional del corresponsal..."
              className={cn(
                'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                'resize-none'
              )}
              {...register('notas')}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm flex items-center justify-center"
            >
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Corresponsal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
