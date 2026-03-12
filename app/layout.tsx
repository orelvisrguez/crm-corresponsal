import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/Sidebar'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Assistravel CRM',
  description: 'Sistema de Gestión de Asistencias Médicas y Corresponsales',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="es" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {user ? (
            <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto w-full">
                <div className="p-3 md:p-6 w-full max-w-full overflow-x-hidden">
                  {children}
                </div>
              </main>
            </div>
          ) : (
            <div className="h-screen bg-background overflow-hidden">
              {children}
            </div>
          )}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
