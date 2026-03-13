'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

interface MapPin {
  id: number
  displayId?: string
  lat: number
  lng: number
  country: string
  cost: number
  status: string
}

interface Props {
  pins: MapPin[]
}

export default function OperationsMap({ pins }: Props) {
  const [isMounted, setIsMounted] = useState(false)
  const [L, setL] = useState<typeof import('leaflet') | null>(null)

  useEffect(() => {
    setIsMounted(true)
    // Import Leaflet for icon configuration
    import('leaflet').then((leaflet) => {
      setL(leaflet)
    })
  }, [])

  if (!isMounted || !L) {
    return (
      <Card className="shadow-sm border-border/50 bg-card overflow-hidden lg:col-span-2">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-bold">Mapa de Operaciones en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center bg-muted/5 animate-pulse">
          <p className="text-sm text-muted-foreground font-medium">Cargando Mapa Interactivo...</p>
        </CardContent>
      </Card>
    )
  }

  // Fix for default Leaflet marker icons in Next.js
  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  // Colors based on Status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cobrado': return 'text-emerald-500'
      case 'ParaRefacturar': return 'text-amber-500'
      case 'OnGoing': return 'text-blue-500'
      default: return 'text-slate-500'
    }
  }

  return (
    <Card className="shadow-sm border-border/50 bg-card overflow-hidden lg:col-span-2">
      <CardHeader className="bg-muted/10 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold">Mapa de Operaciones Geográficas</CardTitle>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Distribución global de casos activos y costos</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] font-bold text-muted-foreground">ACTIVOS</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold text-muted-foreground">COBRADOS</span>
           </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[450px]">
        <MapContainer 
          center={[10, -30]} 
          zoom={2.5} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          className="z-0"
        >
          {/* Using a sleek dark tile layer for premium look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {pins.map((pin) => (
            <Marker 
              key={`${pin.id}-${pin.country}`} 
              position={[pin.lat, pin.lng]} 
              icon={customIcon}
            >
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{pin.country}</span>
                    <span className={`text-[9px] font-bold uppercase ${getStatusColor(pin.status)}`}>
                      {pin.status}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    ID: {pin.displayId || pin.id}
                  </div>
                  <div className="text-sm font-bold text-primary mt-1">
                    Costo: {formatCurrency(pin.cost)}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 italic text-[10px] text-muted-foreground">
                    Caso registrado en {pin.country}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  )
}
