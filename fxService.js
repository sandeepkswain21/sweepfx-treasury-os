// Fallback rates if external rates API is throttled or unreachable
const FALLBACK_RATES = {
  USD: 1.0,
  EUR: 1.087,
  GBP: 1.27,
  CHF: 1.13,
  JPY: 0.0067,
};

let rateCache = {
  rates: FALLBACK_RATES,
  lastUpdated: null,
};

/**
 * Fetches real-time spot exchange rates relative to USD
 */
export const getLiveFxRates = async () => {
  // Return cached rates if updated within the last 15 minutes
  if (rateCache.lastUpdated && Date.now() - rateCache.lastUpdated < 15 * 60 * 1000) {
    return rateCache.rates;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    if (data && data.result === 'success') {
      // Invert rates relative to USD base
      const rates = {
        USD: 1.0,
        EUR: data.rates.EUR ? 1 / data.rates.EUR : FALLBACK_RATES.EUR,
        GBP: data.rates.GBP ? 1 / data.rates.GBP : FALLBACK_RATES.GBP,
        CHF: data.rates.CHF ? 1 / data.rates.CHF : FALLBACK_RATES.CHF,
      };

      rateCache = {
        rates,
        lastUpdated: Date.now(),
      };

      return rates;
    }
    return FALLBACK_RATES;
  } catch (error) {
    console.warn('FX API Error, utilizing fallback spot rates:', error.message);
    return FALLBACK_RATES;
  }
};

/**
 * Converts any currency amount to target currency using live spot rates
 */
export const convertCurrency = (amount, sourceCurrency, targetCurrency, rates) => {
  if (sourceCurrency === targetCurrency) return amount;

  const sourceInUsd = amount * (rates[sourceCurrency] || 1.0);
  const targetRate = rates[targetCurrency] || 1.0;

  return sourceInUsd / targetRate;
};