export const DEFAULT_TREASURY_POLICY = {
  id: 'default-1',
  policy_name: 'Default Enterprise Guardrails',
  max_sweep_percentage: 0.50,
  max_transaction_usd: 100000.00,
  min_yield_spread_bps: 25,
  auto_approve_below_usd: 10000.00,
  is_active: true,
  policy_note: 'Standard risk limits designed to balance high-yield optimization with tight liquidity buffers for operating reserves.',
};

// Helper to simulate API latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeDB = () => {
  if (!localStorage.getItem('sweepfx_policies')) {
    localStorage.setItem('sweepfx_policies', JSON.stringify([DEFAULT_TREASURY_POLICY]));
  }
};

export const fetchAllPolicies = async () => {
  await delay();
  const stored = localStorage.getItem('sweepfx_policies');
  if (!stored) return [DEFAULT_TREASURY_POLICY];
  const data = JSON.parse(stored);
  return data.length > 0 ? data : [DEFAULT_TREASURY_POLICY];
};

export const createPolicy = async (policyData) => {
  await delay();
  const newPolicy = {
    ...policyData,
    id: crypto.randomUUID(),
    is_active: false,
  };
  const policies = await fetchAllPolicies();
  const updatedPolicies = [newPolicy, ...policies]; // Adds new policy to the top
  localStorage.setItem('sweepfx_policies', JSON.stringify(updatedPolicies));
  return newPolicy;
};

export const updatePolicy = async (id, policyData) => {
  await delay();
  let policies = await fetchAllPolicies();
  let updatedPolicy = null;
  policies = policies.map(p => {
    if (p.id === id) {
      updatedPolicy = { ...p, ...policyData };
      return updatedPolicy;
    }
    return p;
  });
  localStorage.setItem('sweepfx_policies', JSON.stringify(policies));
  return updatedPolicy;
};

export const setActivePolicy = async (id) => {
  await delay();
  let policies = await fetchAllPolicies();
  let activePolicy = null;
  policies = policies.map(p => {
    if (p.id === id) {
      activePolicy = { ...p, is_active: true };
      return activePolicy;
    }
    return { ...p, is_active: false }; // Deactivates all other policies
  });
  localStorage.setItem('sweepfx_policies', JSON.stringify(policies));
  return activePolicy;
};

// Deactivates a currently active policy
export const deactivatePolicy = async (id) => {
  await delay();
  let policies = await fetchAllPolicies();
  let deactivatedPolicy = null;
  policies = policies.map(p => {
    if (p.id === id) {
      deactivatedPolicy = { ...p, is_active: false };
      return deactivatedPolicy;
    }
    return p;
  });
  localStorage.setItem('sweepfx_policies', JSON.stringify(policies));
  return deactivatedPolicy;
};

// Deletes a policy permanently
export const deletePolicy = async (id) => {
  await delay();
  const policies = await fetchAllPolicies();
  const filteredPolicies = policies.filter(p => p.id !== id);
  localStorage.setItem('sweepfx_policies', JSON.stringify(filteredPolicies));
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
