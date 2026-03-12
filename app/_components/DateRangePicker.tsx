'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentFrom = searchParams.get('from')
  const currentTo = searchParams.get('to')

  const [from, setFrom] = useState(currentFrom || '')
  const [to, setTo] = useState(currentTo || '')
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set('from', from)
    else params.delete('from')
    
    if (to) params.set('to', to)
    else params.delete('to')

    router.push(`?${params.toString()}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    setFrom('')
    setTo('')
    router.push('/')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm",
          currentFrom && currentTo ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground hover:bg-muted"
        )}
      >
        <Calendar className="w-4 h-4" />
        {currentFrom && currentTo ? `${currentFrom} - ${currentTo}` : 'Filtrar por Fecha'}
        <Filter className="w-3 h-3 ml-2 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rango de Fechas</h4>
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Desde</label>
              <input 
                type="date" 
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Hasta</label>
              <input 
                type="date" 
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-6">
            <button 
              onClick={handleClear}
              className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar
            </button>
            <button 
              onClick={handleApply}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
