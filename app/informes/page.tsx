import { ReportGenerator } from './_components/ReportGenerator'
import { FileText, Sparkles } from 'lucide-react'

export default function InformesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Informes Ejecutivos</h1>
          <p className="text-sm text-muted-foreground italic">Reportes estratégicos para el Directorio alimentados por IA</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">IA Active: Gemini 3 Flash</span>
        </div>
      </div>

      <div className="w-full">
        <ReportGenerator />
      </div>
    </div>
  )
}
