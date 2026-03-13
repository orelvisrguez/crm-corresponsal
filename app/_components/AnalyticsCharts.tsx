'use client'

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  TooltipContentProps
} from 'recharts'
import { DashboardAnalytics } from '@/lib/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: DashboardAnalytics
}

const CustomTooltip = ({ active, payload, label }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs flex items-center gap-1.5 font-medium">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="text-sm font-bold">{formatCurrency(entry.value as number)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function AnalyticsCharts({ data }: Props) {
  // Prep Funnel Data
  const funnelData = [
    { name: 'Abierto', value: data.funnel.abierto, color: '#3b82f6' },
    { name: 'En Proceso', value: data.funnel.ongoing, color: '#0ea5e9' },
    { name: 'Para Cobrar', value: data.funnel.toInvoice, color: '#f59e0b' },
    { name: 'Cobrado', value: data.funnel.collected, color: '#10b981' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Financial Trend */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Tendencia Financiera Mensual</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Comparativa Costo Operativo vs Revenue (Fee)</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAgregado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Area 
                  type="monotone" 
                  dataKey="costUsd" 
                  name="Costo Operativo"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="fee" 
                  name="Ingreso (Fee)"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorFee)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="montoAgregado" 
                  name="Monto Agregado"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAgregado)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Top Countries */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Top 5 Países por Gasto</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Distribución de inversión operativa por región</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data.topCountries} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="country" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      return (
                        <div className="bg-card border border-border p-2 rounded shadow-lg">
                          <p className="text-xs font-bold text-foreground">{payload[0].payload.country}</p>
                          <p className="text-sm text-primary font-bold">{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.topCountries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Funnel Operativo */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Embudo Operativo (Volumen)</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Flujo de vida del caso desde apertura hasta cobro</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            {funnelData.map((item) => (
              <div key={item.name} className="p-3 bg-muted/20 rounded-xl border border-border/50 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{item.name}</div>
                <div className="text-2xl font-black" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. MoM Case Volume Comparison */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Crecimiento Mensual (Volumen Diario)</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Comparativa de casos día a día: Mes Actual vs Anterior</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={data.momVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                          <p className="text-xs font-bold text-muted-foreground mb-2">DÍA {label}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-primary font-medium">Mes Actual:</span>
                              <span className="text-sm font-bold">{payload[0].value}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-muted-foreground font-medium">Mes Anterior:</span>
                              <span className="text-sm font-bold">{payload[1]?.value || 0}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  name="Mes Actual" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="previous" 
                  name="Mes Anterior" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 5. Pareto Distribution */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold">Distribución de Pareto (Corresponsales)</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Análisis de Dependencia: Regla del 80/20</p>
          </div>
          {(() => {
            const top80 = data.pareto.filter(p => p.cumulativePercentage <= 85); // Threshold for visual clarity
            const count80 = top80.length || 1;
            return (
              <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] font-black text-orange-600 uppercase">
                Top {count80} = 80%
              </div>
            );
          })()}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={data.pareto.slice(0, 10)} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 500 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  label={{ value: 'Casos', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `${val}%`}
                  label={{ value: '% Acumulativo', angle: 90, position: 'insideRight', fontSize: 10 }}
                />
                <Tooltip 
                   content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                          <p className="text-xs font-bold text-foreground mb-2">{label}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-primary font-medium">Volumen:</span>
                              <span className="text-sm font-bold">{payload[0].value} casos</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t pt-1 mt-1">
                              <span className="text-[10px] text-muted-foreground font-medium">% Acumulado:</span>
                              <span className="text-xs font-bold text-orange-500">{(payload[1]?.value as number || 0).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="count" 
                  name="Casos" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="cumulativePercentage" 
                  name="% Acumulativo" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-border/50 text-foreground">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Insight de Concentración</p>
            <p className="text-xs font-medium leading-relaxed">
              Los primeros <span className="font-bold text-primary">{data.pareto.filter(p => p.cumulativePercentage <= 85).length || 1} corresponsales</span> concentran el <span className="font-bold text-orange-500">80%</span> de tus casos. 
              Esto indica una {data.pareto.length > 5 ? 'distribución moderada' : 'alta dependencia'} de proveedores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Heatmap style Cost Distribution */}
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden lg:col-span-2">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Mapa de Calor: Intensidad de Gasto por País</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Escala cromática basada en el costo total por territorio</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.topCountries.map((country) => {
              const maxCost = data.topCountries[0].cost;
              const intensity = country.cost / maxCost;
              const opacity = 0.2 + (intensity * 0.8);
              return (
                <div 
                  key={country.country} 
                  className="relative p-4 rounded-2xl border border-border/50 group hover:shadow-md transition-all h-24 flex flex-col justify-between overflow-hidden"
                  style={{ 
                    backgroundColor: `rgba(59, 130, 246, ${opacity * 0.1})`,
                    borderColor: `rgba(59, 130, 246, ${opacity * 0.3})`
                  }}
                >
                  <div className="absolute inset-0 bg-blue-500 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate w-3/4">
                      {country.country}
                    </span>
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }} 
                    />
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-black text-foreground">
                      {formatCurrency(country.cost)}
                    </div>
                    <div className="w-full bg-muted/30 h-1 rounded-full mt-1">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${intensity * 100}%`, opacity }} 
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
