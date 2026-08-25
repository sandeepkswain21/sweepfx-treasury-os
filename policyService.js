import { supabase } from '../config/supabase';

export const DEFAULT_TREASURY_POLICY = {
  policy_name: 'Default Enterprise Guardrails',
  max_sweep_percentage: 0.50,
  max_transaction_usd: 100000.00,
  min_yield_spread_bps: 25,
  auto_approve_below_usd: 10000.00,
  is_active: true,
  policy_note: 'Standard risk limits designed to balance high-yield optimization with tight liquidity buffers for operating reserves.',
};

export const fetchAllPolicies = async () => {
  const { data, error } = await supabase
    .from('treasury_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return [DEFAULT_TREASURY_POLICY];
  }
  return data;
};

export const createPolicy = async (policyData) => {
  const newPolicy = {
    ...policyData,
    is_active: false,
  };
  const { data, error } = await supabase.from('treasury_policies').insert([newPolicy]).select().single();
  if (error) throw error;
  return data;
};

export const updatePolicy = async (id, policyData) => {
  const { data, error } = await supabase
    .from('treasury_policies')
    .update(policyData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const setActivePolicy = async (id) => {
  await supabase.from('treasury_policies').update({ is_active: false }).neq('id', id);
  const { data, error } = await supabase
    .from('treasury_policies')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Deactivates a currently active policy
export const deactivatePolicy = async (id) => {
  const { data, error } = await supabase
    .from('treasury_policies')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Deletes a policy permanently from Supabase
export const deletePolicy = async (id) => {
  const { error } = await supabase.from('treasury_policies').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const validateAgainstPolicy = (proposedSweep, activePolicy = DEFAULT_TREASURY_POLICY) => {
  const violations = [];
  const amountInUsd = proposedSweep.amount * (proposedSweep.fxRate || 1.0);

  if (amountInUsd > Number(activePolicy.max_transaction_usd)) {
    violations.push(
      `Transaction ($${amountInUsd.toLocaleString()}) exceeds policy cap ($${Number(activePolicy.max_transaction_usd).toLocaleString()}).`
    );
  }

  if (proposedSweep.yieldSpread && proposedSweep.yieldSpread * 10000 < Number(activePolicy.min_yield_spread_bps)) {
    violations.push(
      `Yield spread (${(proposedSweep.yieldSpread * 100).toFixed(2)}%) below policy threshold (${activePolicy.min_yield_spread_bps} BPS).`
    );
  }

  return {
    isCompliant: violations.length === 0,
    violations,
  };
};