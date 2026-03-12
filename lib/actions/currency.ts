'use server'

const API_KEY = process.env.EXCHANGERATE_API_KEY

// Common Country to Currency mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'Argentina': 'ARS',
  'España': 'EUR',
  'EEUU': 'USD',
  'USA': 'USD',
  'Brasil': 'BRL',
  'Uruguay': 'UYU',
  'Chile': 'CLP',
  'Paraguay': 'PYG',
  'Bolivia': 'BOB',
  'Peru': 'PEN',
  'Colombia': 'COP',
  'Mexico': 'MXN',
  'Panama': 'USD',
  'Ecuador': 'USD',
  'Reino Unido': 'GBP',
  'Italia': 'EUR',
  'Francia': 'EUR',
  'Alemania': 'EUR',
  'Suiza': 'CHF',
  'Portugal': 'EUR',
}

export async function getExchangeRate(country: string) {
  if (!API_KEY) {
    throw new Error('EXCHANGERATE_API_KEY no configurada')
  }

  const currencyCode = COUNTRY_TO_CURRENCY[country] || 'USD' // Default to USD if not found

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/USD/${currencyCode}`)
    const data = await response.json()

    if (data.result === 'success') {
      return {
        rate: data.conversion_rate,
        currency: currencyCode,
        success: true
      }
    } else {
      return { success: false, error: data['error-type'] || 'Error desconocido API' }
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return { success: false, error: 'Error de red al consultar API' }
  }
}
