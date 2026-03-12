'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LogIn, Loader2, ShieldCheck, Globe, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Error al iniciar sesión', {
          description: error.message
        })
      } else {
        toast.success('¡Bienvenido al sistema!')
        router.push('/')
        router.refresh()
      }
    } catch {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden font-sans">
      {/* Lado Izquierdo: Visual & Branding */}
      <div className="hidden lg:flex relative bg-slate-950 items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500 blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8">
            <Globe className="w-3 h-3" />
            Global Network
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
            Gestión Inteligente de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Corresponsalía</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
            Plataforma centralizada para la red de corresponsales de Assistravel. 
            Optimización operativa, control financiero y analítica avanzada.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white mb-1">24/7</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Disponibilidad</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-white mb-1">AES-256</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Seguridad</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute bottom-10 left-12 right-12 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Assistravel Business Intelligence</p>
          <div className="flex gap-4">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            <div className="w-1 h-1 rounded-full bg-blue-500/50" />
            <div className="w-1 h-1 rounded-full bg-blue-500/20" />
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 mx-auto lg:mx-0">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic">
              Corresponsal <span className="text-primary not-italic">ASSISTRAVEL</span>
            </h2>
            <p className="text-muted-foreground font-medium">
              Accede a tu panel de control ejecutivo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">Contraseña</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl h-12 pl-10 bg-muted/30 border-none focus-visible:ring-primary/30 transition-all font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 mt-4 bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="pt-8 border-t border-border/50 text-center lg:text-left">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-1">
              Portal de Acceso Restringido
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              El uso no autorizado de este sistema está estrictamente prohibido y sujeto a monitoreo de seguridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
