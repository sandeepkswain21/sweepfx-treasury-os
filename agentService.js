import { supabase } from '../config/supabase';
import { evaluateSweepOpportunity } from './guardrails';

/**
 * Fetches current accounts state from Supabase
 */
export const fetchAccounts = async () => {
  const { data, error } = await supabase.from('accounts').select('*').order('currency');
  if (error) throw error;
  return data || [];
};

/**
 * Fetches pending agent recommendations
 */
export const fetchRecommendations = async () => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('status', 'PENDING_APPROVAL')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

/**
 * Orchestrates an agent scan: checks balances, runs guardrails, creates database recommendation
 */
export const runAgentScan = async () => {
  const accounts = await fetchAccounts();
  const opportunity = evaluateSweepOpportunity(accounts);

  if (!opportunity) {
    return { success: true, message: 'No sweep opportunities found.' };
  }

  // Insert recommendation into Supabase
  const { error } = await supabase.from('recommendations').insert([opportunity]);
  if (error) throw error;

  return { success: true, message: 'New sweep recommendation generated.' };
};

/**
 * Executes or rejects a recommended sweep, modifying account balances atomically
 */
export const executeSweepAction = async (recommendation, status) => {
  if (status === 'REJECTED') {
    const { error } = await supabase
      .from('recommendations')
      .update({ status: 'REJECTED' })
      .eq('id', recommendation.id);
    if (error) throw error;
    return;
  }

  if (status === 'APPROVED') {
    const accounts = await fetchAccounts();
    const sourceAcc = accounts.find((a) => a.id === recommendation.sourceAccountId);
    const targetAcc = accounts.find((a) => a.id === recommendation.targetAccountId);

    if (!sourceAcc || !targetAcc) throw new Error('Target accounts not found.');

    const sourceDeduction = Number(recommendation.amount);
    const targetAddition = sourceDeduction * Number(recommendation.fx_rate);

    // Update source balance
    await supabase
      .from('accounts')
      .update({ balance: Number(sourceAcc.balance) - sourceDeduction })
      .eq('id', sourceAcc.id);

    // Update target balance
    await supabase
      .from('accounts')
      .update({ balance: Number(targetAcc.balance) + targetAddition })
      .eq('id', targetAcc.id);

    // Mark recommendation as APPROVED
    await supabase
      .from('recommendations')
      .update({ status: 'APPROVED' })
      .eq('id', recommendation.id);
  }
};
