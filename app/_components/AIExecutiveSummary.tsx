'use client'

import { useState, useEffect } from 'react'
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react'
import { getAIInsights, DashboardAnalytics } from '@/lib/actions/analytics'
import { cn } from '@/lib/utils'

interface Props {
  data: DashboardAnalytics
}

export function AIExecutiveSummary({ data }: Props) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const text = await getAIInsights(data)
      setInsight(text)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [data])

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-500 rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
      <div className="relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">AI Executive Summary</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Análisis inteligente de rendimiento</p>
            </div>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            </div>
          ) : insight ? (
            <div className="relative">
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
              <p className="text-sm text-foreground leading-relaxed pl-4 italic">
                {insight}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic pl-4">No hay datos suficientes para el análisis.</p>
          )}
          
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Powered by Gemini 3 Flash</span>
          </div>
        </div>
      </div>
    </div>
  )
}
