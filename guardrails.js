// Baseline spot rates against USD for liquidity conversions
export const BASE_FX_RATES = {
  USD: 1.0,
  EUR: 1.087,
  GBP: 1.27,
};

/**
 * Calculates excess capital strictly above operating buffer limits
 */
export const calculateExcessLiquidity = (balance, minBuffer) => {
  const excess = Number(balance) - Number(minBuffer);
  return excess > 0 ? excess : 0;
};

/**
 * Evaluates account balances against yield spreads to find sweep opportunities
 */
export const evaluateSweepOpportunity = (accounts) => {
  const eurAccount = accounts.find((a) => a.currency === 'EUR');
  const usdAccount = accounts.find((a) => a.currency === 'USD');

  if (!eurAccount || !usdAccount) return null;

  const excessEur = calculateExcessLiquidity(eurAccount.balance, eurAccount.min_buffer);

  // Sweep Trigger: Minimum €5,000 excess and positive APY yield delta
  if (excessEur >= 5000 && usdAccount.yield_apy > eurAccount.yield_apy) {
    const sweepAmountEur = Math.floor(excessEur * 0.5); // Safely sweep 50% of idle excess
    const sweepValUsd = sweepAmountEur * BASE_FX_RATES.EUR;
    const yieldSpread = usdAccount.yield_apy - eurAccount.yield_apy;
    const projectedAnnualYieldUsd = sweepValUsd * yieldSpread;

    return {
      sourceAccountId: eurAccount.id,
      targetAccountId: usdAccount.id,
      action_type: 'SWEEP_YIELD',
      source_currency: 'EUR',
      target_currency: 'USD',
      amount: sweepAmountEur,
      fx_rate: BASE_FX_RATES.EUR,
      estimated_savings_usd: Number(projectedAnnualYieldUsd.toFixed(2)),
      reasoning: `Discovered €${sweepAmountEur.toLocaleString()} in uninvested EUR capital above operating limit. Reallocating to USD Vault captures a +${(yieldSpread * 100).toFixed(1)}% APY yield spread, yielding +$${projectedAnnualYieldUsd.toFixed(2)} USD annualized.`,
    };
  }

  return null;
};