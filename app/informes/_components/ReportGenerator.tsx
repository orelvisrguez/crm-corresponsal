'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, TrendingUp, BarChart3, Wallet, ShieldCheck, 
  Download, Printer, Sparkles, Loader2, ChevronRight, AlertCircle,
  Save, History, Trash2, Calendar, HeartPulse
} from 'lucide-react'
import { generateAIReport, ReportType, saveReport, getSavedReports, deleteReport, Report } from '@/lib/actions/reports'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ProReportPDF } from '@/components/ProReportPDF'

const REPORT_TYPES = [
  {
    id: 'economico',
    title: 'Informe Económico',
    description: 'Análisis de rentabilidad y volumen transaccional.',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  } as const,
  {
    id: 'operativo',
    title: 'Informe Operativo',
    description: 'Eficiencia de red y tiempos de resolución.',
    icon: BarChart3,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  } as const,
  {
    id: 'financiero',
    title: 'Informe Financiero',
    description: 'Flujo de caja, márgenes y proyecciones de cobro.',
    icon: Wallet,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  } as const,
  {
    id: 'contable',
    title: 'Informe Contable',
    description: 'Auditoría de facturación y conciliación administrativa.',
    icon: ShieldCheck,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  } as const
]

export function ReportGenerator() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [history, setHistory] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState<'generar' | 'historial'>('generar')

  const fetchHistory = async () => {
    const data = await getSavedReports()
    setHistory(data)
  }

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistory()
    }
  }, [activeTab])

  const handleGenerate = async () => {
    if (!selectedType) return
    setLoading(true)
    setReport(null)
    try {
      const res = await generateAIReport(selectedType)
      if (res.error) {
        toast.error(res.error)
      } else if (res.content) {
        setReport(res.content)
        toast.success('Informe generado con éxito')
      }
    } catch {
      toast.error('Error al conectar con la IA')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!report || !selectedType) return
    setSaving(true)
    try {
      const title = `Informe ${REPORT_TYPES.find(t => t.id === selectedType)?.title} - ${new Date().toLocaleDateString()}`
      const res = await saveReport({
        tipo: selectedType,
        titulo: title,
        contenido: report
      })
      if (res.success) {
        toast.success('Informe guardado en el historial')
        fetchHistory()
      } else {
        toast.error(res.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de servidor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este informe?')) return
    const res = await deleteReport(id)
    if (res.success) {
      toast.success('Informe eliminado')
      fetchHistory()
    } else {
      toast.error('Error al eliminar')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Selector Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('generar')}
              className={cn(
                "flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'generar' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Generar
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={cn(
                "flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === 'historial' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Historial
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'generar' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Asistente IA</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nueva Auditoría</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                        selectedType === type.id
                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                          : "bg-muted/30 border-border hover:border-primary/50 text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        selectedType === type.id ? "bg-white/20" : type.bgColor
                      )}>
                        <type.icon className={cn("w-5 h-5", selectedType === type.id ? "text-white" : type.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm leading-tight text-inherit">{type.title}</p>
                        <p className={cn(
                          "text-[10px] leading-tight truncate",
                          selectedType === type.id ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {type.description}
                        </p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 opacity-50", selectedType === type.id ? "text-white" : "")} />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!selectedType || loading}
                  className="w-full mt-4 py-3 bg-foreground text-background font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Generando Informe...' : 'Generar con IA'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Anteriores</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Consultas Guardadas</p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto opacity-10 mb-2" />
                    <p className="text-xs italic">No hay informes guardados aún.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      className="group bg-muted/30 border border-border rounded-xl p-3 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-500/10 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          setReport(item.contenido)
                          setSelectedType(item.tipo as ReportType)
                          setActiveTab('generar')
                        }}
                        className="w-full text-left"
                      >
                        <h4 className="text-sm font-bold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                          {item.titulo}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20 px-1.5 py-0.5 rounded-md bg-primary/5">
                            {item.tipo}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'generar' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Nota:</strong> Los informes son generados mediante IA analizando los datos actuales de la plataforma. Revise siempre las cifras críticas antes de presentarlas.
            </p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="lg:col-span-8">
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl min-h-[842px] print:min-h-0 flex flex-col print:shadow-none print:border-none print:block print:h-auto overflow-hidden group/report">
          {report ? (
            <>
              {/* Executive Header Decoration */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 no-print" />
              
              <div className="flex items-center justify-between px-8 py-4 bg-muted/30 border-b border-border/50 no-print text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Documento de Alta Dirección</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Archivar
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:opacity-90 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir
                  </button>
                  <PDFDownloadLink
                    document={<ProReportPDF title={REPORT_TYPES.find(t => t.id === selectedType)?.title || 'Informe'} content={report || ''} />}
                    fileName={`Informe_${selectedType}_${new Date().toISOString().split('T')[0]}.pdf`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-colors"
                  >
                    {({ loading: pdfLoading }) => (
                      <div className="flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" />
                        <span>{pdfLoading ? 'Preparando...' : 'Exportar Pro PDF'}</span>
                      </div>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              <div className="flex-1 p-12 md:p-20 overflow-y-auto print:overflow-visible print:p-0 print:block">
                {/* Visual Header for the Report */}
                <div className="flex justify-between items-start mb-16">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <HeartPulse className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-foreground tracking-tight">ASSISTRAVEL</h1>
                      <p className="text-[10px] uppercase font-bold text-primary tracking-[0.2em] leading-none">Global Case Management</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Clasificación</p>
                    <p className="text-sm font-black text-foreground uppercase tracking-tighter">Estrictamente Confidencial</p>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none 
                  prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h1:text-4xl prose-h1:mb-8 prose-h1:border-b prose-h1:pb-4
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-primary 
                  prose-p:text-base prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-400
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-table:border prose-table:border-border prose-table:rounded-xl prose-table:overflow-hidden 
                  prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-th:text-xs prose-th:uppercase prose-th:tracking-widest
                  prose-td:px-4 prose-td:py-3 prose-td:text-sm
                ">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>

                <div className="mt-24 pt-10 border-t-2 border-zinc-100 dark:border-zinc-800 flex items-end justify-between">
                  <div className="space-y-4">
                    <div className="w-32 h-px bg-zinc-300 dark:bg-zinc-700 mb-2" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">Dirección de Operaciones</p>
                    <p className="text-[10px] text-muted-foreground">Assistravel Corporate System v3.0</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">Fecha de Emisión</p>
                    <p className="text-sm font-bold text-foreground">{new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date())}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
                {loading ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <FileText className="w-10 h-10 text-muted-foreground/30" />
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground">Vista Previa del Informe</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2 italic">
                {loading 
                  ? "Analizando datos económicos, operativos y financieros para usted..." 
                  : "Seleccione un tipo de informe y haga clic en 'Generar con IA' para comenzar el análisis."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
