import { supabase } from '../config/supabase';

/**
 * Writes an immutable execution record directly to Supabase audit_ledger
 */
export const recordLedgerEntry = async (entry) => {
  const payload = {
    recommendation_id: entry.recommendationId || null,
    action_type: entry.actionType || 'SWEEP_YIELD',
    source_currency: entry.sourceCurrency,
    target_currency: entry.targetCurrency,
    source_amount: Number(entry.sourceAmount),
    target_amount: Number(entry.targetAmount),
    applied_fx_rate: Number(entry.appliedFxRate),
    realized_yield_usd: Number(entry.realizedYieldUsd || 0),
    executed_by: entry.executedBy || 'CFO_APPROVAL_MANUAL',
  };

  const { data, error } = await supabase
    .from('audit_ledger')
    .insert([payload])
    .select();

  if (error) {
    console.error('Ledger insertion error:', error.message);
    throw new Error('Ledger Error: ' + error.message);
  }

  return data;
};

/**
 * Fetches historical settlement logs from audit_ledger
 */
export const fetchAuditTrail = async () => {
  const { data, error } = await supabase
    .from('audit_ledger')
    .select('*')
    .order('executed_at', { ascending: false });

  if (error) {
    console.error('Audit trail load error:', error.message);
    return [];
  }

  return data || [];
};