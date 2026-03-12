'use client'

import { ArrowLeft, Printer, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CorresponsalDetailHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
      <Link 
        href="/corresponsales" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver al Directorio
      </Link>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Exportar Ficha
        </Button>
      </div>
    </div>
  )
}
