import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { evaluateSweepOpportunity } from '../utils/guardrails';

export default function ScenarioSimulator() {
  const [simEurApy, setSimEurApy] = useState('3.8');
  const [simUsdApy, setSimUsdApy] = useState('4.5');
  const [simExcessEur, setSimExcessEur] = useState('50000');
  const [simResult, setSimResult] = useState(null);

  const handleRunSimulation = () => {
    // Construct simulated accounts array
    const simulatedAccounts = [
      {
        id: 'sim-usd',
        currency: 'USD',
        balance: 100000,
        min_buffer: 25000,
        yield_apy: parseFloat(simUsdApy) / 100,
      },
      {
        id: 'sim-eur',
        currency: 'EUR',
        balance: 10000 + parseFloat(simExcessEur || 0),
        min_buffer: 10000,
        yield_apy: parseFloat(simEurApy) / 100,
      },
    ];

    const opportunity = evaluateSweepOpportunity(simulatedAccounts);
    setSimResult(opportunity);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PROACTIVE SCENARIO & STRESS SIMULATOR</Text>

      <View style={styles.card}>
        <Text style={styles.cardDescription}>
          Model hypothetical interest rate moves and capital surges to preview AI agent behavior without modifying live balances.
        </Text>

        <View style={styles.formRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>EUR VAULT APY (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={simEurApy}
              onChangeText={setSimEurApy}
            />
          </View>

          <View style={styles.fieldCol}>
            <Text style={styles.label}>USD VAULT APY (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={simUsdApy}
              onChangeText={setSimUsdApy}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SIMULATED UNINVESTED EUR CAPITAL (€)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={simExcessEur}
            onChangeText={setSimExcessEur}
          />
        </View>

        <TouchableOpacity style={styles.simBtn} onPress={handleRunSimulation}>
          <Text style={styles.simBtnText}>Simulate AI Decision Model</Text>
        </TouchableOpacity>

        {simResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTag}>SIMULATION OUTPUT</Text>
            <Text style={styles.resultTitle}>
              Recommended Action: {simResult.action_type} (€{simResult.amount.toLocaleString()} ➔ USD)
            </Text>
            <Text style={styles.resultText}>{simResult.reasoning}</Text>
            <Text style={styles.resultYield}>
              Projected Annual Advantage: +${simResult.estimated_savings_usd.toLocaleString()} USD
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  sectionTitle: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardDescription: { color: '#64748B', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  fieldCol: { flex: 1 },
  formGroup: { marginBottom: 18 },
  label: { color: '#0F172A', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A', fontWeight: '600' },
  simBtn: { backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  simBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  resultBox: { marginTop: 20, padding: 18, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  resultTag: { fontSize: 10, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.8, marginBottom: 4 },
  resultTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  resultText: { color: '#334155', fontSize: 13, marginTop: 6, lineHeight: 18 },
  resultYield: { color: '#059669', fontSize: 13, fontWeight: '700', marginTop: 10 },
});