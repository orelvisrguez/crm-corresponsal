import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, addMinutes } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount === null || amount === undefined) return `${currency === 'USD' ? '$' : ''}0.00`
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  
  // If it's a string like "2024-03-12", parseISO will treat it correctly as a local date center or UTC
  // To avoid the "one day less" issue, we ensure we treat it as a pure date
  let dateObj = typeof date === "string" ? parseISO(date) : date
  
  // Adjust for timezone offset to ensure the day remains the same as stored in UTC
  // when displayed in local time
  const offset = dateObj.getTimezoneOffset()
  dateObj = addMinutes(dateObj, offset)
  
  return format(dateObj, "dd/MM/yyyy", { locale: es })
}

export const ESTADO_INTERNO_LABELS: Record<string, string> = {
  Abierto: "Abierto",
  Cerrado: "Cerrado",
  Pausado: "Pausado",
  Cancelado: "Cancelado",
}

export const ESTADO_INTERNO_COLORS: Record<string, string> = {
  Abierto: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Cerrado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Pausado: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Cancelado: "bg-red-500/10 text-red-500 border-red-500/20",
}

export const ESTADO_CASO_LABELS: Record<string, string> = {
  NoFee: "Sin Fee",
  OnGoing: "En Proceso",
  Refacturado: "Refacturado",
  ParaRefacturar: "Para Refacturar",
  Cobrado: "Cobrado",
}

export const ESTADO_CASO_COLORS: Record<string, string> = {
  NoFee: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  OnGoing: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  Refacturado: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ParaRefacturar: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Cobrado: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
}

export const ESTADO_CASO_ROW_COLORS: Record<string, string> = {
  NoFee: "hover:bg-slate-50/50 dark:hover:bg-slate-900/50",
  OnGoing: "bg-sky-50/30 hover:bg-sky-50/50 dark:bg-sky-950/10 dark:hover:bg-sky-950/20",
  Refacturado: "bg-purple-50/30 hover:bg-purple-50/50 dark:bg-purple-950/10 dark:hover:bg-purple-950/20",
  ParaRefacturar: "bg-orange-50/30 hover:bg-orange-50/50 dark:bg-orange-950/10 dark:hover:bg-orange-950/20",
  Cobrado: "bg-emerald-50/30 hover:bg-emerald-50/50 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20",
}

export const PAISES = [
  "Argentina", "Brasil", "Chile", "Uruguay", "Paraguay", "Bolivia", 
  "Perú", "Ecuador", "Colombia", "Venezuela", "México", "España", 
  "Estados Unidos", "Panamá", "Costa Rica", "República Dominicana"
]
