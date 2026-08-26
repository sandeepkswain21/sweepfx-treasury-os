import { supabase } from '../config/supabase';
import { getLiveFxRates } from './fxService';
import { generateTreasuryRationale } from './aiService';
import { recordLedgerEntry } from './ledgerService';
import { validateAgainstPolicy, DEFAULT_TREASURY_POLICY } from './policyService';

/**
 * Runs dynamic end-to-end treasury evaluation across ALL multi-currency vaults
 */
export const runTreasuryEngine = async () => {
  // 1. Fetch live accounts from database
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*');
  if (accErr || !accounts || accounts.length === 0) {
    throw new Error('Failed to load accounts: ' + (accErr?.message || 'No accounts found'));
  }

  // 2. Fetch active corporate policy guardrails
  const { data: policies } = await supabase.from('treasury_policies').select('*').eq('is_active', true);
  const activePolicy = policies && policies.length > 0 ? policies[0] : DEFAULT_TREASURY_POLICY;

  // 3. Fetch live spot market FX rates
  const rates = await getLiveFxRates();

  const getFxToUsd = (curr) => {
    const c = curr?.trim().toUpperCase();
    if (c === 'USD') return 1.0;
    if (c === 'EUR') return rates.EUR || 1.087;
    if (c === 'GBP') return rates.GBP || 1.27;
    return 1.0;
  };

  // 4. Scan all vaults for excess liquidity and higher-yielding target vaults
  let bestSweep = null;
  let highestYieldGainUsd = 0;

  for (const sourceAcc of accounts) {
    const excessBalance = Number(sourceAcc.balance) - Number(sourceAcc.min_buffer);
    if (excessBalance <= 0) continue; // No excess liquidity in this vault

    const sourceApy = Number(sourceAcc.yield_apy);

    for (const targetAcc of accounts) {
      if (sourceAcc.id === targetAcc.id) continue;

      const targetApy = Number(targetAcc.yield_apy);
      const yieldSpread = targetApy - sourceApy;

      // Only consider target vaults offering higher APY
      if (yieldSpread <= 0) continue;

      // Apply policy allocation percentage (e.g., 50% or 100%)
      const sweepPercent = Number(activePolicy.max_sweep_percentage || 0.5);
      const rawSweepAmount = Math.floor(excessBalance * sweepPercent);

      if (rawSweepAmount <= 0) continue;

      const sourceFxToUsd = getFxToUsd(sourceAcc.currency);
      const targetFxToUsd = getFxToUsd(targetAcc.currency);
      const crossFxRate = sourceFxToUsd / targetFxToUsd; // e.g., 1 GBP = 1.168 USD / EUR cross
      const projectedAnnualYieldUsd = rawSweepAmount * sourceFxToUsd * yieldSpread;

      // Validate against policy guardrails
      const proposedSweep = {
        amount: rawSweepAmount,
        fxRate: sourceFxToUsd,
        yieldSpread,
      };

      const policyValidation = validateAgainstPolicy(proposedSweep, activePolicy);

      if (policyValidation.isCompliant && projectedAnnualYieldUsd > highestYieldGainUsd) {
        highestYieldGainUsd = projectedAnnualYieldUsd;
        bestSweep = {
          sourceAcc,
          targetAcc,
          sweepAmount: rawSweepAmount,
          crossFxRate,
          sourceFxToUsd,
          yieldSpread,
          projectedAnnualYieldUsd,
          policyValidation,
        };
      }
    }
  }

  if (!bestSweep) {
    return {
      success: true,
      executed: false,
      reason: 'Liquidity compliant across all vaults. Excess cash is already allocated in the highest-yielding vaults.',
    };
  }

  // 5. Generate AI CFO Rationale
  const reasoning = await generateTreasuryRationale({
    sourceCurrency: bestSweep.sourceAcc.currency,
    targetCurrency: bestSweep.targetAcc.currency,
    amount: bestSweep.sweepAmount,
    fxRate: Number(bestSweep.crossFxRate.toFixed(4)),
    yieldSpread: bestSweep.yieldSpread,
    projectedAnnualYieldUsd: bestSweep.projectedAnnualYieldUsd,
  });

  // 6. Record recommendation in Supabase
  const recommendationData = {
    account_id: bestSweep.sourceAcc.id,
    action_type: 'SWEEP_YIELD',
    source_currency: bestSweep.sourceAcc.currency,
    target_currency: bestSweep.targetAcc.currency,
    amount: bestSweep.sweepAmount,
    fx_rate: Number(bestSweep.crossFxRate.toFixed(4)),
    reasoning,
    estimated_savings_usd: Number(bestSweep.projectedAnnualYieldUsd.toFixed(2)),
    status: 'PENDING_APPROVAL',
  };

  const { data: insertedRec, error: recErr } = await supabase
    .from('recommendations')
    .insert([recommendationData])
    .select()
    .single();

  if (recErr) throw recErr;

  return {
    success: true,
    executed: true,
    recommendation: insertedRec,
    policyValidation: bestSweep.policyValidation,
  };
};

export const executeTreasurySweep = async (recommendationId, status) => {
  const { data: rec, error: recErr } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', recommendationId)
    .single();

  if (recErr || !rec) throw new Error('Recommendation not found');

  if (status === 'REJECTED') {
    await supabase.from('recommendations').update({ status: 'REJECTED' }).eq('id', recommendationId);
    return { success: true, status: 'REJECTED' };
  }

  if (status === 'APPROVED') {
    const { data: accounts } = await supabase.from('accounts').select('*');
    const sourceAcc = accounts.find((a) => a.currency?.trim().toUpperCase() === rec.source_currency?.trim().toUpperCase());
    const targetAcc = accounts.find((a) => a.currency?.trim().toUpperCase() === rec.target_currency?.trim().toUpperCase());

    const sourceDeduction = Number(rec.amount);
    const targetAddition = sourceDeduction * Number(rec.fx_rate);

    await supabase
      .from('accounts')
      .update({ balance: Number(sourceAcc.balance) - sourceDeduction })
      .eq('id', sourceAcc.id);

    await supabase
      .from('accounts')
      .update({ balance: Number(targetAcc.balance) + targetAddition })
      .eq('id', targetAcc.id);

    await supabase.from('recommendations').update({ status: 'APPROVED' }).eq('id', recommendationId);

    await recordLedgerEntry({
      recommendationId,
      actionType: rec.action_type,
      sourceCurrency: rec.source_currency,
      targetCurrency: rec.target_currency,
      sourceAmount: sourceDeduction,
      targetAmount: targetAddition,
      appliedFxRate: rec.fx_rate,
      realizedYieldUsd: rec.estimated_savings_usd,
      executedBy: 'CFO_APPROVAL_MANUAL',
    });

    return { success: true, status: 'APPROVED' };
  }
};
