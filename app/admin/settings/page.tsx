'use client'

import { useState, useEffect, useTransition } from 'react'
import { 
  Settings, DollarSign, Bell, Slack, Mail, 
  Save, Loader2, ShieldCheck, Globe, Info, AlertCircle
} from 'lucide-react'
import { getSettings, updateSetting, seedDefaultSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      await seedDefaultSettings() // Ensure we have defaults
      const data = await getSettings()
      setSettings(data)
    } catch (err) {
      toast.error('Error al cargar ajustes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key: string, value: string) => {
    startTransition(async () => {
      try {
        await updateSetting(key, value)
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
        toast.success(`Ajuste '${key}' actualizado`)
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  const renderSettingInput = (s: any) => {
    const isFinancial = s.group === 'financial'
    const isIntegration = s.group === 'integration'

    return (
      <div key={s.id} className="p-4 bg-muted/30 border border-border/50 rounded-xl group hover:border-primary/30 transition-all">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {s.key.replace(/_/g, ' ')}
              </span>
              {isFinancial && <DollarSign className="w-3 h-3 text-emerald-500" />}
              {isIntegration && (s.key.includes('slack') ? <Slack className="w-3 h-3 text-purple-500" /> : <Mail className="w-3 h-3 text-blue-500" />)}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Controla el valor global de {s.key.replace(/_/g, ' ')} en todo el sistema.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              defaultValue={s.value}
              onBlur={(e) => {
                if (e.target.value !== s.value) {
                  handleUpdate(s.key, e.target.value)
                }
              }}
              className="flex-1 md:w-64 px-3 py-1.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Valor del ajuste..."
            />
            <div className="p-1.5 bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Save className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-2">Cargando configuración global...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Configuración Global</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ajustes de Sistema Assistravel v3.0</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Acceso Administrador</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Financial Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Finanzas y Moneda</h2>
          </div>
          <div className="space-y-3">
            {settings.filter(s => s.group === 'financial').map(renderSettingInput)}
          </div>
        </section>

        {/* Integration Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Slack className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Integraciones y Webhooks</h2>
          </div>
          <div className="space-y-3">
            {settings.filter(s => s.group === 'integration').map(renderSettingInput)}
          </div>
        </section>

        {/* General Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">General</h2>
          </div>
          <div className="space-y-3">
            {settings.filter(s => s.group === 'general').map(renderSettingInput)}
          </div>
        </section>

        {/* Warning Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">Zona de Impacto Global</h4>
            <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
              Los cambios realizados en esta sección afectan los cálculos de rentabilidad, las tasas de cambio predeterminadas y las integraciones externas de forma inmediata para todos los usuarios. Proceda con precaución.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-muted/50 border border-border rounded-2xl p-6 flex items-start gap-4">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-xs text-foreground font-medium">¿Para qué sirve este módulo?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este centro de control centraliza las variables de entorno de la aplicación. En lugar de editar código, puede ajustar dinámicamente el comportamiento financiero y de comunicación de Assistravel desde aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
