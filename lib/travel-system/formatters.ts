import { CurrencyCode } from './types';

// Exchange rates relative to IDR (Base)
const RATES_TO_IDR: Record<CurrencyCode, number> = {
  IDR: 1,
  USD: 16200,
  SGD: 12100,
  MYR: 3650,
};

export function formatCurrency(amountInIdr: number, currency: CurrencyCode = 'IDR'): string {
  const rate = RATES_TO_IDR[currency] || 1;
  const converted = amountInIdr / rate;

  switch (currency) {
    case 'USD':
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'SGD':
      return `S$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'MYR':
      return `RM ${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'IDR':
    default:
      return `Rp ${amountInIdr.toLocaleString('id-ID')}`;
  }
}

export function formatDate(dateString: string, lang: 'id' | 'en' = 'id'): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
