'use client'

import { useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, AreaChart, Area, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import { 
  DollarSign, TrendingUp, Zap, ArrowUpRight, ArrowDownRight, 
  Globe, Users, FileText, Landmark, Calculator, Activity, 
  Stethoscope, ShieldCheck, Clock
} from 'lucide-react'
import { DashboardAnalytics } from '@/lib/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'

interface Props {
  data: DashboardAnalytics
}

function StatCard({ title, value, subValue, icon: Icon, color, trend }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-2xl border", colors[color] || colors.blue)}>
            <Icon className="w-5 h-5" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
              trend > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            )}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-2xl font-black text-foreground tracking-tighter">{value}</h3>
          <p className="text-[10px] text-muted-foreground font-bold italic">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function FinanzasClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'finanzas' | 'operaciones'>('finanzas')
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e']

  const pieData = [
    { name: 'Costo Operativo', value: data.financial.totalCostoUsd, color: '#3b82f6' },
    { name: 'Fees', value: data.financial.totalFee, color: '#10b981' },
    { name: 'Monto Agregado', value: data.financial.totalMontoAgregado, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-8">
      {/* Custom Modern Tabs */}
      <div className="flex p-1.5 bg-muted/50 rounded-2xl w-fit border border-border/50">
        <button
          onClick={() => setActiveTab('finanzas')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
            activeTab === 'finanzas' 
              ? "bg-card text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Vista Financiera
        </button>
        <button
          onClick={() => setActiveTab('operaciones')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all",
            activeTab === 'operaciones' 
              ? "bg-card text-primary shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Activity className="w-4 h-4" />
          Vista Operativa
        </button>
      </div>

      {activeTab === 'finanzas' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* 1. Key Performance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Revenue Total (Bruto)"
              value={formatCurrency(data.financial.totalRevenue)}
              subValue="Suma total de todas las operaciones"
              icon={Landmark}
              color="emerald"
              trend={data.financial.revenueGrowth}
            />
            <StatCard 
              title="Margen de Operación"
              value={`${data.financial.feeMargin.toFixed(1)}%`}
              subValue="Relación Ganancia vs Costo Directo"
              icon={TrendingUp}
              color="blue"
            />
            <StatCard 
              title="Ticket Promedio"
              value={formatCurrency(data.financial.avgTicket)}
              subValue="Ingreso medio por caso gestionado"
              icon={Calculator}
              color="violet"
            />
            <StatCard 
              title="Pendiente de Cobro"
              value={formatCurrency(data.financial.pendingCollection)}
              subValue="Facturas en proceso o por cobrar"
              icon={FileText}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Composición del Ingreso</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/50 shadow-xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Evolución Financiera (6 Meses)</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="costUsd" name="Costo" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorC)" />
                      <Area type="monotone" dataKey="fee" name="Fee" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorF)" />
                      <Area type="monotone" dataKey="montoAgregado" name="Agregado" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de Corresponsales */}
          <Card className="border-border/50 shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-slate-950 text-white flex flex-row items-center justify-between px-8 py-6">
              <div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Ranking Financiero de Corresponsales</CardTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Análisis de rentabilidad por proveedor</p>
              </div>
              <Users className="w-6 h-6 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <th className="px-8 py-4 text-left">Corresponsal</th>
                      <th className="px-8 py-4 text-center">Casos</th>
                      <th className="px-8 py-4 text-right">Costo Directo</th>
                      <th className="px-8 py-4 text-right">Fee Acumulado</th>
                      <th className="px-8 py-4 text-right">Monto Ag.</th>
                      <th className="px-8 py-4 text-right">Revenue Total</th>
                      <th className="px-8 py-4 text-center">Margen (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.correspondentFinancials.map((cor) => (
                      <tr key={cor.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-bold text-foreground">{cor.name}</span>
                        </td>
                        <td className="px-8 py-5 text-center font-mono font-bold text-muted-foreground">{cor.casos}</td>
                        <td className="px-8 py-5 text-right font-mono text-xs">{formatCurrency(cor.costoUsd)}</td>
                        <td className="px-8 py-5 text-right font-mono text-xs text-emerald-600 font-bold">{formatCurrency(cor.fee)}</td>
                        <td className="px-8 py-5 text-right font-mono text-xs text-amber-600">{formatCurrency(cor.montoAgregado)}</td>
                        <td className="px-8 py-5 text-right font-mono text-sm font-black text-foreground">{formatCurrency(cor.total)}</td>
                        <td className="px-8 py-5 text-center">
                          <div className={cn(
                            "inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase border",
                            cor.margin >= 20 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                            cor.margin >= 10 ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : 
                            "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>
                            {cor.margin.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          {/* 1. Operational Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Eficiencia SLA"
              value={`${data.operational.documentationRate.toFixed(1)}%`}
              subValue="Casos con Informe Médico"
              icon={ShieldCheck}
              color="emerald"
            />
            <StatCard 
              title="Tiempo de Resolución"
              value={`${data.operational.avgResolutionDays.toFixed(1)}d`}
              subValue="Promedio apertura -> cierre"
              icon={Clock}
              color="blue"
            />
            <StatCard 
              title="Casos Críticos"
              value={data.operational.agingCases30}
              subValue="Más de 30 días sin resolución"
              icon={Zap}
              color="rose"
            />
            <StatCard 
              title="Total Operaciones"
              value={data.funnel.abierto + data.funnel.ongoing + data.funnel.toInvoice + data.funnel.collected}
              subValue="Volumen histórico gestionado"
              icon={Activity}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribución por Tipo de Servicio */}
            <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-rose-500" />
                  Especialidades más Requeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data.operational.serviceDistribution} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" name="Casos" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.operational.serviceDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance SLA por Corresponsal */}
            <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Top 10 Cumplimiento (Informes Médicos)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.operational.slaByCorrespondent}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{fontSize: 9, fontWeight: 700}} />
                      <Radar
                        name="SLA %"
                        dataKey="rate"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución Geográfica por Volumen */}
          <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-indigo-950 text-white flex flex-row items-center justify-between px-8 py-6">
              <div>
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Penetración de Mercado por País</CardTitle>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Volumen de casos y carga operativa regional</p>
              </div>
              <Globe className="w-6 h-6 text-cyan-400" />
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.topCountries.map((c, i) => (
                  <div key={c.country} className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">{c.country}</p>
                    <p className="text-2xl font-black text-indigo-600">{Math.floor(c.cost / 1000)}</p>
                    <p className="text-[9px] font-bold text-muted-foreground">Índice Operativo</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
