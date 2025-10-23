import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  ZAR: 'R',
};

const CURRENCY_FORMATS: Record<string, Intl.NumberFormatOptions> = {
  USD: { style: 'currency', currency: 'USD' },
  EUR: { style: 'currency', currency: 'EUR' },
  GBP: { style: 'currency', currency: 'GBP' },
  JPY: { style: 'currency', currency: 'JPY', minimumFractionDigits: 0 },
  CAD: { style: 'currency', currency: 'CAD' },
  AUD: { style: 'currency', currency: 'AUD' },
  ZAR: { style: 'currency', currency: 'ZAR' },
};

export function useCurrency() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const currency = settings?.currency || 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  const formatCurrency = (amount: number): string => {
    const formatOptions = CURRENCY_FORMATS[currency] || CURRENCY_FORMATS.USD;
    
    try {
      return new Intl.NumberFormat('en-US', formatOptions).format(amount);
    } catch (error) {
      // Fallback to simple formatting if Intl fails
      return `${symbol}${amount.toFixed(currency === 'JPY' ? 0 : 2)}`;
    }
  };

  return {
    currency,
    symbol,
    formatCurrency,
  };
}
