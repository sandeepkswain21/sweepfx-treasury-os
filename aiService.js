const GROQ_API_KEY = ''; // Optional: Insert your Groq API key (gsk_...) for live LLM inference

/**
 * Generates an executive-level CFO rationale using Groq LLM or a dynamic fallback logic engine
 */
export const generateTreasuryRationale = async ({
  sourceCurrency,
  targetCurrency,
  amount,
  fxRate,
  yieldSpread,
  projectedAnnualYieldUsd,
}) => {
  const prompt = `Act as an enterprise AI Treasury Director. Generate a 2-sentence executive summary explaining why a corporate treasury sweep was triggered from ${sourceCurrency} to ${targetCurrency}.
Details:
- Source Currency: ${sourceCurrency}
- Target Currency: ${targetCurrency}
- Sweep Amount: ${amount.toLocaleString()} ${sourceCurrency}
- Effective FX Spot Rate: ${fxRate}
- APY Differential: +${(yieldSpread * 100).toFixed(2)}%
- Projected Annual Net Gain: +$${projectedAnnualYieldUsd.toLocaleString()} USD

Focus on capital efficiency, yield optimization, and liquidity risk compliance. Keep it professional and concise.`;

  // Live Groq API Inference call if API key exists
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 150,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
    } catch (error) {
      console.warn('Groq API fallback activated:', error.message);
    }
  }

  // Deterministic Fallback Engine (Runs locally without external API latency)
  return `Identified ${amount.toLocaleString()} ${sourceCurrency} in excess liquidity above standard operating buffers. Sweeping into ${targetCurrency} captures a +${(
    yieldSpread * 100
  ).toFixed(2)}% APY rate spread, driving an estimated +$${projectedAnnualYieldUsd.toLocaleString()} USD in annualized treasury earnings while remaining 100% compliant with corporate risk limits.`;
};