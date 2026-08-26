import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { supabase } from './config/supabase';
import { runTreasuryEngine, executeTreasurySweep } from './services/treasuryEngine';
import AuditLedger from './AuditLedger';
import PolicySettings from './PolicySettings';
import ScenarioSimulator from './ScenarioSimulator';
import EnterpriseProfileModal from './EnterpriseProfileModal';
import LandingPage from './LandingPage';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [realizedLedgerYield, setRealizedLedgerYield] = useState(0);

  // Deposit / Spend Simulation Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [activeAccountForTx, setActiveAccountForTx] = useState(null);
  const [txType, setTxType] = useState('DEPOSIT');
  const [txAmount, setTxAmount] = useState('5000');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: accs } = await supabase.from('accounts').select('*').order('currency');
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*')
        .eq('status', 'PENDING_APPROVAL')
        .order('created_at', { ascending: false });

      // Fetch sum of realized yield from settled audit ledger entries
      const { data: ledger } = await supabase.from('audit_ledger').select('realized_yield_usd');
      const totalLedgerYield = ledger ? ledger.reduce((sum, item) => sum + Number(item.realized_yield_usd || 0), 0) : 0;
      setRealizedLedgerYield(totalLedgerYield);

      if (accs) setAccounts(accs);
      if (recs) setRecommendations(recs);
    } catch (err) {
      console.error('Data loading error:', err.message);
    }
  };

  const handleRunEngine = async () => {
    setIsScanning(true);
    try {
      const result = await runTreasuryEngine();
      if (!result.executed) {
        alert(result.reason || 'Liquidity compliant. No sweeps needed.');
      }
      await loadDashboardData();
    } catch (err) {
      alert('Engine Error: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAction = async (recId, status) => {
    setIsProcessing(true);
    try {
      await executeTreasurySweep(recId, status);
      await loadDashboardData();
    } catch (err) {
      alert('Execution Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentScreen === 'landing') {
    return <LandingPage onLaunchDashboard={() => setCurrentScreen('dashboard')} />;
  }

  const handleAdjustBuffer = async (acc, delta) => {
    setIsProcessing(true);
    try {
      const currentBuffer = Number(acc.min_buffer);
      const updatedBuffer = Math.max(0, currentBuffer + delta);

      const { error } = await supabase
        .from('accounts')
        .update({ min_buffer: updatedBuffer })
        .eq('id', acc.id);

      if (error) throw error;

      await loadDashboardData();

      const engineRes = await runTreasuryEngine();
      if (engineRes.executed) {
        alert(`Operating Limit updated to ${acc.currency === 'EUR' ? '€' : acc.currency === 'GBP' ? '£' : '$'}${updatedBuffer.toLocaleString()}! New sweep opportunity generated.`);
      }
    } catch (err) {
      alert('Buffer Update Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenTxModal = (acc, type) => {
    setActiveAccountForTx(acc);
    setTxType(type);
    setTxAmount(type === 'DEPOSIT' ? '5000' : '2000');
    setIsTxModalOpen(true);
  };

  const handleExecuteTx = async () => {
    if (!activeAccountForTx || !txAmount) return;
    setIsProcessing(true);

    try {
      const numericAmount = parseFloat(txAmount) || 0;
      const currentBalance = Number(activeAccountForTx.balance);
      const newBalance =
        txType === 'DEPOSIT' ? currentBalance + numericAmount : Math.max(0, currentBalance - numericAmount);

      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', activeAccountForTx.id);

      if (error) throw error;

      setIsTxModalOpen(false);
      await loadDashboardData();

      const result = await runTreasuryEngine();
      if (result.executed) {
        alert(`Transaction Executed! AI Treasury Engine detected balance shift and generated a sweep recommendation.`);
      } else {
        alert(`Transaction Executed! Updated Balance: ${activeAccountForTx.currency} ${newBalance.toLocaleString()}`);
      }
      await loadDashboardData();
    } catch (err) {
      alert('Transaction Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Yield Analytics Calculations (Weighted APY & Returns)
  let totalUsdLiquidity = 0;
  let weightedApySum = 0;

  accounts.forEach((acc) => {
    const bal = Number(acc.balance);
    const curr = acc.currency?.trim().toUpperCase();
    const fx = curr === 'EUR' ? 1.087 : curr === 'GBP' ? 1.27 : 1.0;
    const usdVal = bal * fx;

    totalUsdLiquidity += usdVal;
    weightedApySum += usdVal * Number(acc.yield_apy);
  });

  const blendedApy = totalUsdLiquidity > 0 ? weightedApySum / totalUsdLiquidity : 0;
  const projectedAnnualYieldUsd = totalUsdLiquidity * blendedApy;
  const traditionalBankYield = totalUsdLiquidity * 0.005; // 0.5% standard bank APY baseline
  const aiYieldLiftUsd = Math.max(0, projectedAnnualYieldUsd - traditionalBankYield);

  return (
    <View style={styles.screen}>
      {/* Navigation Header */}
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLightning}>⚡</Text>
          </View>
          <Text style={styles.logoText}>
            SweepFX <Text style={styles.logoTextHighlight}>Treasury</Text>
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>REVOLUT OS</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => setIsProfileOpen(true)}>
            <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>AG</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileTitle}>Apex Global Corp</Text>
              <Text style={styles.profileSub}>LEI: 5493001KJ...</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanButton} onPress={handleRunEngine} disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.scanButtonText}>Run Treasury Engine</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Header Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview & Vaults</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'ledger' && styles.tabItemActive]}
          onPress={() => setActiveTab('ledger')}
        >
          <Text style={[styles.tabText, activeTab === 'ledger' && styles.tabTextActive]}>Audit & Settlement Ledger</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'policies' && styles.tabItemActive]}
          onPress={() => setActiveTab('policies')}
        >
          <Text style={[styles.tabText, activeTab === 'policies' && styles.tabTextActive]}>Risk Guardrail Policies</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'simulator' && styles.tabItemActive]}
          onPress={() => setActiveTab('simulator')}
        >
          <Text style={[styles.tabText, activeTab === 'simulator' && styles.tabTextActive]}>Scenario Simulator</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main}>
        {activeTab === 'overview' && (
          <>
            {/* Enterprise Yield Performance Analytics Hero Card */}
            <View style={styles.yieldHeroCard}>
              <View style={styles.yieldHeroHeader}>
                <View>
                  <View style={styles.yieldTagRow}>
                    <Text style={styles.yieldTagText}>ENTERPRISE YIELD ANALYTICS</Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.liveBadgeText}>AUTO-OPTIMIZING</Text>
                    </View>
                  </View>
                  <Text style={styles.yieldHeroTitle}>Portfolio Yield & Accrual Performance</Text>
                </View>

                <View style={styles.blendedApyBox}>
                  <Text style={styles.blendedApyLabel}>WEIGHTED BLENDED APY</Text>
                  <Text style={styles.blendedApyVal}>{(blendedApy * 100).toFixed(2)}%</Text>
                </View>
              </View>

              <View style={styles.yieldMetricsGrid}>
                <View style={styles.yieldMetricTile}>
                  <Text style={styles.yTileLabel}>PROJECTED 365-DAY YIELD</Text>
                  <Text style={styles.yTileVal}>
                    +${projectedAnnualYieldUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.yTileSub}>Calculated on total liquid balance</Text>
                </View>

                <View style={styles.yieldMetricTile}>
                  <Text style={styles.yTileLabel}>AI OPTIMIZATION LIFT</Text>
                  <Text style={[styles.yTileVal, { color: '#059669' }]}>
                    +${aiYieldLiftUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.yTileSub}>Extra return vs static 0.5% bank rate</Text>
                </View>

                <View style={styles.yieldMetricTile}>
                  <Text style={styles.yTileLabel}>SETTLED AUDIT YIELD</Text>
                  <Text style={[styles.yTileVal, { color: '#2563EB' }]}>
                    +${realizedLedgerYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.yTileSub}>Harvested via approved sweeps</Text>
                </View>
              </View>
            </View>

            {/* Standard Dashboard Summary Cards */}
            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>TOTAL CONSOLIDATED LIQUIDITY (USD)</Text>
                <Text style={styles.cardValue}>
                  ${totalUsdLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.cardSubtext}>Automated Guardrails Enforced</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardLabel}>ACTIVE TREASURY VAULTS</Text>
                <Text style={[styles.cardValue, { color: '#0F172A' }]}>{accounts.length} Currencies</Text>
                <Text style={styles.cardSubtextMuted}>USD, EUR & GBP Operating Reserve</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>MULTI-CURRENCY OPERATING VAULTS & VIRTUAL ACCOUNTS</Text>
            {accounts.map((acc) => {
              const isExpanded = expandedAccount === acc.id;
              const symbol = acc.currency === 'EUR' ? '€' : acc.currency === 'GBP' ? '£' : '$';

              return (
                <View key={acc.id} style={styles.accountCard}>
                  <View style={styles.cardMainRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.accountName}>{acc.name}</Text>
                        <View style={styles.vIbanTag}><Text style={styles.vIbanTagText}>vIBAN ACTIVE</Text></View>
                      </View>

                      <Text style={styles.accountBalance}>
                        {symbol}{Number(acc.balance).toLocaleString()}
                      </Text>

                      <View style={styles.bufferContainer}>
                        <View style={styles.bufferBadge}>
                          <Text style={styles.bufferText}>
                            Operating Limit: <Text style={styles.bufferValue}>{symbol}{Number(acc.min_buffer).toLocaleString()}</Text>
                          </Text>
                        </View>

                        <View style={styles.bufferControls}>
                          <TouchableOpacity 
                            style={styles.bufferStepBtn} 
                            onPress={() => handleAdjustBuffer(acc, 1000)}
                            disabled={isProcessing}
                          >
                            <Text style={styles.bufferStepText}>▲ +1k</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.bufferStepBtn} 
                            onPress={() => handleAdjustBuffer(acc, -1000)}
                            disabled={isProcessing}
                          >
                            <Text style={styles.bufferStepText}>▼ -1k</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardRightCol}>
                      <View style={styles.apyBadge}>
                        <Text style={styles.apyText}>{(Number(acc.yield_apy) * 100).toFixed(1)}% APY</Text>
                      </View>

                      <View style={styles.quickActionRow}>
                        <TouchableOpacity
                          style={styles.depositBtn}
                          onPress={() => handleOpenTxModal(acc, 'DEPOSIT')}
                        >
                          <Text style={styles.depositBtnText}>+ Deposit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.spendBtn}
                          onPress={() => handleOpenTxModal(acc, 'SPEND')}
                        >
                          <Text style={styles.spendBtnText}>- Spend</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.detailsToggleBtn}
                        onPress={() => setExpandedAccount(isExpanded ? null : acc.id)}
                      >
                        <Text style={styles.detailsToggleText}>{isExpanded ? 'Hide Details ▲' : 'Account Details ▼'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.virtualDetailsBox}>
                      <Text style={styles.virtualBoxHeading}>VIRTUAL BANKING & SWIFT COORDINATES</Text>
                      <View style={styles.vGrid}>
                        <View style={styles.vItem}>
                          <Text style={styles.vLabel}>ISSUING BANK</Text>
                          <Text style={styles.vVal}>{acc.bank_name || 'JPMorgan Chase Bank, N.A.'}</Text>
                        </View>
                        <View style={styles.vItem}>
                          <Text style={styles.vLabel}>IBAN / ACCOUNT NO.</Text>
                          <Text style={styles.vValMono}>{acc.iban_account_no || 'DE89 3704 0044 0532 0130 00'}</Text>
                        </View>
                        <View style={styles.vItem}>
                          <Text style={styles.vLabel}>SWIFT / BIC / ROUTING</Text>
                          <Text style={styles.vValMono}>{acc.swift_routing || 'RTN: 021000021'}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>PENDING TREASURY SWEEP RECOMMENDATIONS</Text>
            {recommendations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Liquidity optimal. No pending sweeps required across connected vaults.</Text>
              </View>
            ) : (
              recommendations.map((rec) => (
                <View key={rec.id} style={styles.recCard}>
                  <View style={styles.recHeader}>
                    <Text style={styles.recTag}>AI OPTIMIZATION TRIGGERED</Text>
                    <Text style={styles.recSavings}>+${Number(rec.estimated_savings_usd).toLocaleString()} Net Yield</Text>
                  </View>
                  <Text style={styles.recTitle}>
                    Sweep {rec.source_currency === 'EUR' ? '€' : '$'}{Number(rec.amount).toLocaleString()} ➔ {rec.target_currency} Vault
                  </Text>
                  <Text style={styles.recReasoning}>{rec.reasoning}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleAction(rec.id, 'REJECTED')}
                      disabled={isProcessing}
                    >
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleAction(rec.id, 'APPROVED')}
                      disabled={isProcessing}
                    >
                      <Text style={styles.approveText}>Approve & Execute Settlement</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'ledger' && <AuditLedger />}
        {activeTab === 'policies' && <PolicySettings />}
        {activeTab === 'simulator' && <ScenarioSimulator />}
      </ScrollView>

      {/* Deposit & Spend Simulation Modal */}
      <Modal visible={isTxModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>
              {txType === 'DEPOSIT' ? 'Simulate Client Deposit (+)' : 'Simulate Operating Spend (-)'}
            </Text>
            <Text style={styles.modalSub}>
              {activeAccountForTx?.name} ({activeAccountForTx?.currency})
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>TRANSACTION AMOUNT ({activeAccountForTx?.currency})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={txAmount}
                onChangeText={setTxAmount}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsTxModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, txType === 'SPEND' && { backgroundColor: '#DC2626' }]}
                onPress={handleExecuteTx}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>{txType === 'DEPOSIT' ? 'Execute Deposit' : 'Execute Spend'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enterprise Profile Modal */}
      <EnterpriseProfileModal visible={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC', fontFamily: 'system-ui, sans-serif' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoIcon: { height: 38, width: 38, borderRadius: 10, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  logoLightning: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#0F172A', letterSpacing: -0.5 },
  logoTextHighlight: { color: '#2563EB', fontWeight: '500' },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', marginLeft: 8 },
  badgeText: { color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  profileAvatar: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  profileInfo: { justifyContent: 'center' },
  profileTitle: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  profileSub: { fontSize: 10, color: '#64748B', fontFamily: 'monospace' },
  scanButton: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  scanButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 28, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 24, flexWrap: 'wrap' },
  tabItem: { paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#2563EB' },
  tabText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#2563EB', fontWeight: '700' },
  main: { flex: 1, paddingHorizontal: 28, paddingVertical: 24 },

  /* Enterprise Yield Analytics Hero Styling */
  yieldHeroCard: { backgroundColor: '#0F172A', padding: 24, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12 },
  yieldHeroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  yieldTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  yieldTagText: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  liveBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveBadgeText: { color: '#34D399', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  yieldHeroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  blendedApyBox: { backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'flex-end' },
  blendedApyLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8 },
  blendedApyVal: { fontSize: 24, fontWeight: '800', color: '#38BDF8', marginTop: 2 },
  yieldMetricsGrid: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  yieldMetricTile: { flex: 1, minWidth: 160, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  yTileLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
  yTileVal: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  yTileSub: { fontSize: 11, color: '#64748B', marginTop: 4 },

  grid: { flexDirection: 'row', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  card: { flex: 1, minWidth: 280, backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  cardValue: { fontSize: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  cardSubtext: { color: '#059669', fontSize: 12, fontWeight: '600' },
  cardSubtextMuted: { color: '#64748B', fontSize: 12, marginTop: 8 },
  sectionTitle: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 14, marginTop: 12 },
  
  accountCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  cardMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  accountName: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  vIbanTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  vIbanTagText: { color: '#2563EB', fontSize: 9, fontWeight: '800' },
  accountBalance: { color: '#0F172A', fontSize: 26, fontWeight: '800', marginTop: 4 },
  
  bufferContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  bufferBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  bufferText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  bufferValue: { color: '#1E40AF', fontWeight: '800' },
  bufferControls: { flexDirection: 'row', gap: 4 },
  bufferStepBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  bufferStepText: { color: '#2563EB', fontSize: 10, fontWeight: '800' },

  cardRightCol: { alignItems: 'flex-end', gap: 8 },
  apyBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  apyText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  quickActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  depositBtn: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  depositBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  spendBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  spendBtnText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  detailsToggleBtn: { paddingVertical: 2 },
  detailsToggleText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },

  virtualDetailsBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  virtualBoxHeading: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8, marginBottom: 10 },
  vGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  vItem: { flex: 1, minWidth: 180, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  vLabel: { fontSize: 9, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  vVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  vValMono: { fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' },

  emptyContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 13 },
  recCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16 },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recTag: { fontSize: 10, fontWeight: '800', color: '#2563EB', letterSpacing: 0.8 },
  recSavings: { fontSize: 12, fontWeight: '700', color: '#059669' },
  recTitle: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
  recReasoning: { color: '#334155', fontSize: 13, marginTop: 8, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  approveBtn: { backgroundColor: '#2563EB' },
  rejectText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  approveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, width: '100%', maxWidth: 450 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});


// forcing update
