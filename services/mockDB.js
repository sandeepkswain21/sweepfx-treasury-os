const defaultPolicies = [
  {
    id: "default-1",
    name: "Default Enterprise Guardrails",
    maxSweepAllocation: 50,
    transactionCeiling: 100000,
    minYieldSpread: 25,
    autoApproveCap: 10000,
    status: "Active"
  }
];

export const initializeDB = () => {
  if (!localStorage.getItem("sweepfx_policies")) {
    localStorage.setItem("sweepfx_policies", JSON.stringify(defaultPolicies));
  }
};

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPolicies = async () => {
  await delay();
  return JSON.parse(localStorage.getItem("sweepfx_policies")) || [];
};

export const createPolicy = async (newPolicy) => {
  await delay();
  const policies = await fetchPolicies();
  const policyWithId = { ...newPolicy, id: crypto.randomUUID() }; 
  const updatedPolicies = [...policies, policyWithId];
  localStorage.setItem("sweepfx_policies", JSON.stringify(updatedPolicies));
  return [policyWithId]; 
};

export const updatePolicy = async (id, updates) => {
  await delay();
  const policies = await fetchPolicies();
  const updatedPolicies = policies.map(p => p.id === id ? { ...p, ...updates } : p);
  localStorage.setItem("sweepfx_policies", JSON.stringify(updatedPolicies));
  return true;
};

export const deletePolicy = async (id) => {
  await delay();
  const policies = await fetchPolicies();
  const filteredPolicies = policies.filter(p => p.id !== id);
  localStorage.setItem("sweepfx_policies", JSON.stringify(filteredPolicies));
  return true;
};
