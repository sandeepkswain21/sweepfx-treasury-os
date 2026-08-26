import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchAuditTrail } from './ledgerService';

export default function AuditLedger() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditTrail();
      setLogs(data);
    } catch (err) {
      console.error('Audit trail load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>TRANSACTION & SETTLEMENT AUDIT LEDGER</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadLogs} disabled={loading}>
          <Text style={styles.refreshBtnText}>{loading ? 'Refreshing...' : '↻ Refresh Ledger'}</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ padding: 32 }} />
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No historical transactions recorded in the settlement ledger yet.</Text>
        </View>
      ) : (
        logs.map((log) => (
          <View key={log.id || log.executed_at} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.actorBadge}>
                <Text style={styles.actorBadgeText}>{log.executed_by || 'CFO_APPROVAL_MANUAL'}</Text>
              </View>
              <Text style={styles.timestamp}>
                {log.executed_at ? new Date(log.executed_at).toUTCString() : 'Just now'}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.amountCol}>
                <Text style={styles.amountText}>
                  -{Number(log.source_amount).toLocaleString()} {log.source_currency} ➔ +{Number(log.target_amount).toLocaleString()} {log.target_currency}
                </Text>
                <Text style={styles.subText}>
                  Spot Rate: 1 {log.source_currency} = {log.applied_fx_rate} {log.target_currency}
                </Text>
              </View>

              <View style={styles.yieldCol}>
                <Text style={styles.yieldLabel}>REALIZED ANNUAL YIELD</Text>
                <Text style={styles.yieldValue}>+${Number(log.realized_yield_usd).toFixed(2)} USD</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  refreshBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  refreshBtnText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  emptyContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 13 },
  logCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actorBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  actorBadgeText: { color: '#1D4ED8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  timestamp: { color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountCol: { flex: 1 },
  amountText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  subText: { color: '#64748B', fontSize: 12, marginTop: 4 },
  yieldCol: { alignItems: 'flex-end' },
  yieldLabel: { color: '#64748B', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  yieldValue: { color: '#059669', fontSize: 14, fontWeight: '800', marginTop: 2 },
});
