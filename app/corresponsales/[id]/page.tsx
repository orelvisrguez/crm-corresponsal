import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, 
  Globe, 
  Mail, 
  Star, 
  DollarSign,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Briefcase
} from 'lucide-react'
import { getCorresponsal, getCorresponsalStats } from '@/lib/actions/corresponsales'
import { getCasos } from '@/lib/actions/casos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate, ESTADO_CASO_ROW_COLORS } from '@/lib/utils'

import { CorresponsalDetailHeader } from './_components/CorresponsalDetailHeader'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CorresponsalDetailPage({ params }: PageProps) {
  const { id } = await params
  const corresponsal = await getCorresponsal(id)
  
  if (!corresponsal) return notFound()

  const stats = await getCorresponsalStats(id)
  const allCasos = await getCasos({ corresponsalId: id })
  const recentCasos = allCasos.slice(0, 50) 

  return (
    <div className="space-y-8 pb-12 print:p-0 animate-in fade-in duration-700">
      <CorresponsalDetailHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-card border border-border/60 rounded-[2rem] shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row items-start gap-8 p-8 md:p-10">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shrink-0">
            {corresponsal.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center gap-4 flex-wrap mb-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground">{corresponsal.nombre}</h1>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 text-xs font-bold gap-2 flex rounded-full">
                  <Star className="w-4 h-4 fill-current px-0" />
                  {corresponsal.calificacion || 3}/5 Confiabilidad
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary/60" />
                  {corresponsal.pais}
                </div>
                {corresponsal.email && (
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Mail className="w-4 h-4 text-primary/60" />
                    {corresponsal.email}
                  </div>
                )}
                {corresponsal.sitioWeb && (
                  <div className="flex items-center gap-1.5 text-sm font-medium hover:text-primary cursor-pointer transition-colors">
                    <Globe className="w-4 h-4 text-primary/60" />
                    {corresponsal.sitioWeb}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(corresponsal.especialidades || []).map((esp: string) => (
                <Badge key={esp} variant="outline" className="rounded-xl px-4 py-1 text-xs font-bold bg-primary/5 border-primary/20 text-primary uppercase tracking-wider">
                  {esp}
                </Badge>
              ))}
              {(corresponsal.especialidades || []).length === 0 && (
                <span className="text-xs text-muted-foreground italic">Sin especialidades registradas</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero Dinámico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-none shadow-xl relative overflow-hidden group col-span-1 md:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform -z-0">
            <DollarSign className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado Financiero Total</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-5xl font-black text-foreground">{formatCurrency(stats.cobrado + stats.pendiente)}</p>
                <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Volumen Operativo Histórico
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cobrado
                  </div>
                  <p className="text-2xl font-black text-emerald-500/90">{formatCurrency(stats.cobrado)}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pendiente
                  </div>
                  <p className="text-2xl font-black text-amber-500/90">{formatCurrency(stats.pendiente)}</p>
                </div>
              </div>
              
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden mt-2 p-0.5 border border-border">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                  style={{ width: `${(stats.cobrado / (stats.cobrado + stats.pendiente) * 100) || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-xl relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-foreground">{corresponsal._count.casos}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Asistencias gestionadas</p>
            <div className="mt-8 p-3 bg-primary/5 rounded-2xl flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="text-[10px] font-bold text-primary uppercase">Crecimiento Sostenido</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none shadow-xl relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Socio Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 text-center">
              <Globe className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-lg font-black text-indigo-600 uppercase tracking-tighter">Premium</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 text-center font-bold uppercase tracking-widest italic group-hover:text-primary transition-colors">
              Nivel de confianza: Alto
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8 text-foreground">
          <Card className="border-border/60 shadow-xl rounded-[2rem] overflow-hidden bg-card">
            <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
              <h2 className="font-black text-xl flex items-center gap-3 uppercase tracking-tight">
                <Briefcase className="w-6 h-6 text-primary" />
                Historial de Casos
              </h2>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                {allCasos.length} Casos Totales
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/40 border-b border-border">
                      <th className="px-8 py-4">ID Case</th>
                      <th className="px-8 py-4">Inicio</th>
                      <th className="px-8 py-4">Estado</th>
                      <th className="px-8 py-4 text-right">Monto (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {recentCasos.map((caso) => (
                      <tr 
                        key={caso.id} 
                        className={cn(
                          "hover:bg-primary/[0.02] transition-colors text-sm group border-b border-border/40",
                          ESTADO_CASO_ROW_COLORS[caso.estadoCaso as keyof typeof ESTADO_CASO_ROW_COLORS]
                        )}
                      >
                        <td className="px-8 py-5 font-black text-primary group-hover:translate-x-1 transition-transform cursor-pointer">
                          {caso.idCasoAssistravel}
                        </td>
                        <td className="px-8 py-5 text-muted-foreground font-medium">
                          {formatDate(caso.fechaInicio)}
                        </td>
                        <td className="px-8 py-5">
                          < Badge 
                            className={cn(
                              "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border",
                              caso.estadoCaso === 'Cobrado' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            )}
                          >
                            {caso.estadoCaso}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right font-black tabular-nums">
                          {formatCurrency((caso.costoUsd || 0) + (caso.costoFee || 0) + (caso.montoAgregado || 0))}
                        </td>
                      </tr>
                    ))}
                    {allCasos.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground font-bold italic">
                          No hay casos registrados para este corresponsal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {allCasos.length > 50 && (
                <div className="p-6 bg-muted/10 text-center border-t border-border">
                  <Link 
                    href={`/casos?corresponsalId=${id}`} 
                    className="text-sm font-bold text-primary hover:underline underline-offset-4 flex items-center justify-center gap-2"
                  >
                    Ver los {allCasos.length} casos completos
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <div className="px-8 py-6 border-b border-border bg-amber-500/5">
               <h3 className="text-xl font-black tracking-tight text-amber-600 flex items-center gap-3">
                 <AlertCircle className="w-6 h-6" />
                 Notas de Confiabilidad
               </h3>
            </div>
            <CardContent className="p-8">
              <div className="bg-muted/30 p-8 rounded-3xl border-2 border-dashed border-border/50 italic text-sm text-foreground/80 leading-relaxed font-medium">
                {corresponsal.notasInternas || 'No hay notas internas registradas sobre el desempeño de este socio.'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Technical Sheet */}
        <div className="space-y-8">
          <Card className="border-border/60 shadow-xl rounded-[2rem] h-fit bg-card">
            <CardHeader className="bg-muted/20 border-b border-border px-8 py-6">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Ficha Técnica</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tax ID / RUC</p>
                <p className="text-sm font-black text-foreground">{corresponsal.taxId || '---'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Dirección Comercial</p>
                <p className="text-sm font-medium leading-relaxed text-foreground/80">{corresponsal.direccionOficina || 'Dirección no especificada'}</p>
              </div>
              
              <div className="pt-6 border-t border-border space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cobertura Geográfica</p>
                <div className="flex flex-wrap gap-2">
                  {(corresponsal.ciudadesCobertura || []).map((city: string) => (
                    <Badge key={city} variant="secondary" className="text-[10px] font-bold py-1 px-3 rounded-lg border-primary/10">
                      {city}
                    </Badge>
                  ))}
                  {(corresponsal.ciudadesCobertura || []).length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic bg-muted p-2 rounded-xl w-full">
                      <Globe className="w-3.5 h-3.5" />
                      Operativa nacional: {corresponsal.pais}
                    </div>
                  )}
                </div>
              </div>

              {corresponsal.contactos && Array.isArray(corresponsal.contactos) && (corresponsal.contactos as unknown[]).length > 0 && (
                <div className="pt-6 border-t border-border space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contactos Adicionales</p>
                  <div className="space-y-3">
                    {((corresponsal.contactos as unknown) as {nombre: string, cargo: string, email: string}[]).map((c, i) => (
                      <div key={i} className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                        <p className="text-xs font-black text-foreground">{c.nombre}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{c.cargo}</p>
                        <p className="text-[10px] text-primary mt-1 font-bold">{c.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2rem] h-fit bg-gradient-to-br from-[#1a1c2e] to-[#252849] text-white p-8 relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
             <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <TrendingUp className="w-5 h-5 text-emerald-400" />
                 </div>
                 <h3 className="font-black text-xl tracking-tight italic uppercase">KPI de Lealtad</h3>
               </div>
               
               <p className="text-sm opacity-80 font-medium leading-relaxed">
                 Este socio ha procesado un volumen acumulado de **{formatCurrency(stats.cobrado)}** en nuestra red global.
               </p>

               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span>Nivel de Socio</span>
                   <span>{(stats.cobrado / 50000 * 100).toFixed(0)}% para Platinum</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                   <div 
                     className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                     style={{ width: `${Math.min((stats.cobrado / 50000) * 100, 100)}%` }} 
                   />
                 </div>
               </div>
               
               <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Miembro Estratégico desde 2024</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
