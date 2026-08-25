import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import { fetchAllPolicies, createPolicy, updatePolicy, setActivePolicy, deactivatePolicy, deletePolicy } from '../services/policyService';

export default function PolicySettings() {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    policy_name: '',
    max_sweep_percentage: '50',
    max_transaction_usd: '100000',
    min_yield_spread_bps: '25',
    auto_approve_below_usd: '10000',
    policy_note: '',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPolicies();
      setPolicies(data);
      
      if (data && data.length > 0) {
        const active = data.find((p) => p.is_active) || data[0];
        setSelectedPolicyId((prev) => (data.some((p) => p.id === prev) ? prev : active.id));
      }
    } catch (err) {
      console.error('Policy loading error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setFormData({
      policy_name: 'Custom Treasury Guardrail',
      max_sweep_percentage: '50',
      max_transaction_usd: '100000',
      min_yield_spread_bps: '25',
      auto_approve_below_usd: '10000',
      policy_note: 'Internal rationale: Standard operational reserves and yield optimization rules.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_name: policy.policy_name,
      max_sweep_percentage: String(Number(policy.max_sweep_percentage) * 100),
      max_transaction_usd: String(policy.max_transaction_usd),
      min_yield_spread_bps: String(policy.min_yield_spread_bps),
      auto_approve_below_usd: String(policy.auto_approve_below_usd || 10000),
      policy_note: policy.policy_note || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        policy_name: formData.policy_name,
        max_sweep_percentage: parseFloat(formData.max_sweep_percentage) / 100,
        max_transaction_usd: parseFloat(formData.max_transaction_usd),
        min_yield_spread_bps: parseInt(formData.min_yield_spread_bps, 10),
        auto_approve_below_usd: parseFloat(formData.auto_approve_below_usd),
        policy_note: formData.policy_note,
      };

      let savedPolicy;
      if (editingPolicy) {
        savedPolicy = await updatePolicy(editingPolicy.id, payload);
      } else {
        savedPolicy = await createPolicy(payload);
      }

      setIsModalOpen(false);
      if (savedPolicy?.id) {
        setSelectedPolicyId(savedPolicy.id);
      }
      await loadPolicies();
    } catch (err) {
      alert('Save Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await setActivePolicy(id);
      setSelectedPolicyId(id);
      await loadPolicies();
    } catch (err) {
      alert('Activation Error: ' + err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivatePolicy(id);
      await loadPolicies();
    } catch (err) {
      alert('Stop Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm ? window.confirm('Are you sure you want to permanently delete this policy?') : true;
    if (!confirmDelete) return;

    try {
      await deletePolicy(id);
      setSelectedPolicyId(null);
      await loadPolicies();
    } catch (err) {
      alert('Delete Error: ' + err.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563EB" style={{ padding: 40 }} />;
  }

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies.find((p) => p.is_active) || policies[0];

  const formattedDate = selectedPolicy?.created_at
    ? new Date(selectedPolicy.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'System Default';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>DYNAMIC RISK & POLICY GUARDRAILS</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleOpenCreate}>
          <Text style={styles.createBtnText}>+ Create Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Main Selected Policy Banner View */}
      {selectedPolicy && (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.activeTagRow}>
                <View style={selectedPolicy.is_active ? styles.greenDot : styles.grayDot} />
                <Text style={selectedPolicy.is_active ? styles.activeTag : styles.inactiveTag}>
                  {selectedPolicy.is_active ? 'ACTIVE ENFORCED POLICY' : 'PREVIEWING POLICY (STOPPED / INACTIVE)'}
                </Text>
                <Text style={styles.dateBadge}>Created: {formattedDate}</Text>
              </View>
              <Text style={styles.activeTitle}>{selectedPolicy.policy_name}</Text>
            </View>

            {/* Banner Control Action Buttons */}
            <View style={styles.bannerActionRow}>
              {selectedPolicy.is_active ? (
                <TouchableOpacity style={styles.stopBtn} onPress={() => handleDeactivate(selectedPolicy.id)}>
                  <Text style={styles.stopBtnText}>⏸ Stop Policy</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.activateBannerBtn} onPress={() => handleActivate(selectedPolicy.id)}>
                  <Text style={styles.activateBannerText}>▶ Activate Policy</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(selectedPolicy)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedPolicy.id)}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MAX SWEEP ALLOCATION</Text>
              <Text style={styles.metricVal}>{(Number(selectedPolicy.max_sweep_percentage) * 100).toFixed(0)}%</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TRANSACTION CEILING</Text>
              <Text style={styles.metricVal}>${Number(selectedPolicy.max_transaction_usd).toLocaleString()}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MIN YIELD SPREAD</Text>
              <Text style={styles.metricVal}>{selectedPolicy.min_yield_spread_bps} BPS</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>AUTO-APPROVE CAP</Text>
              <Text style={styles.metricVal}>
                ${Number(selectedPolicy.auto_approve_below_usd || 10000).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Policy Note / Strategic Rationale Section */}
          <View style={styles.noteBannerBox}>
            <Text style={styles.noteBannerLabel}>STRATEGIC RATIONALE & INTERNAL NOTE</Text>
            <Text style={styles.noteBannerText}>
              {selectedPolicy.policy_note || 'No internal note recorded for this policy configuration.'}
            </Text>
          </View>
        </View>
      )}

      {/* All Configured Policies List */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>ALL CONFIGURATION POLICIES (CLICK TO INSPECT)</Text>
      {policies.map((p) => {
        const isSelected = p.id === selectedPolicy?.id;
        const pDate = p.created_at
          ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Default';

        return (
          <TouchableOpacity
            key={p.id || p.policy_name}
            style={[styles.policyRow, isSelected && styles.selectedPolicyRow]}
            onPress={() => setSelectedPolicyId(p.id)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.rowTitleRow}>
                <Text style={styles.rowTitle}>{p.policy_name}</Text>
                {isSelected && <Text style={styles.viewingPill}>Viewing</Text>}
              </View>
              <Text style={styles.rowSub}>
                Cap: ${Number(p.max_transaction_usd).toLocaleString()} | Spread: {p.min_yield_spread_bps} BPS | Created: {pDate}
              </Text>
            </View>

            <View style={styles.rowActions}>
              {p.is_active ? (
                <View style={styles.activePill}><Text style={styles.activePillText}>Active</Text></View>
              ) : (
                <TouchableOpacity style={styles.activateBtn} onPress={(e) => handleActivate(p.id, e)}>
                  <Text style={styles.activateText}>Set Active</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.smallEditBtn} onPress={(e) => { e.stopPropagation(); handleOpenEdit(p); }}>
                <Text style={styles.smallEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Edit / Create Policy Modal */}
      <Modal visible={isModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{editingPolicy ? 'Edit Policy Guardrails' : 'Create New Guardrail Policy'}</Text>
            
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.label}>POLICY NAME</Text>
                <TextInput
                  style={styles.input}
                  value={formData.policy_name}
                  onChangeText={(val) => setFormData({ ...formData, policy_name: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>MAX SWEEP ALLOCATION (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.max_sweep_percentage}
                  onChangeText={(val) => setFormData({ ...formData, max_sweep_percentage: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>MAX TRANSACTION CEILING (USD)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.max_transaction_usd}
                  onChangeText={(val) => setFormData({ ...formData, max_transaction_usd: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>MIN YIELD SPREAD (BPS)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.min_yield_spread_bps}
                  onChangeText={(val) => setFormData({ ...formData, min_yield_spread_bps: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>AUTO-APPROVE THRESHOLD (USD)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.auto_approve_below_usd}
                  onChangeText={(val) => setFormData({ ...formData, auto_approve_below_usd: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>STRATEGIC RATIONALE / INTERNAL NOTE</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter strategic reason or compliance notes for this policy..."
                  value={formData.policy_note}
                  onChangeText={(val) => setFormData({ ...formData, policy_note: val })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveText}>Save Policy</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  createBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  activeCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE', shadowColor: '#2563EB', shadowOpacity: 0.05, shadowRadius: 10 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  activeTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  grayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' },
  activeTag: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.8 },
  inactiveTag: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 },
  dateBadge: { fontSize: 10, fontWeight: '600', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  activeTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  
  /* Banner Action Button Row */
  bannerActionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stopBtn: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
  stopBtnText: { color: '#92400E', fontWeight: '700', fontSize: 12 },
  activateBannerBtn: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#6EE7B7' },
  activateBannerText: { color: '#047857', fontWeight: '700', fontSize: 12 },
  editBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  editBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  deleteBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  deleteBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },

  metricsGrid: { flexDirection: 'row', gap: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, flexWrap: 'wrap' },
  metricItem: { flex: 1, minWidth: 120 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  noteBannerBox: { marginTop: 16, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  noteBannerLabel: { fontSize: 10, fontWeight: '800', color: '#1E40AF', letterSpacing: 0.8, marginBottom: 4 },
  noteBannerText: { fontSize: 13, color: '#1E3A8A', lineHeight: 19, fontWeight: '500' },
  policyRow: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectedPolicyRow: { borderColor: '#2563EB', backgroundColor: '#F0F6FF', borderWidth: 1.5 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  viewingPill: { fontSize: 9, fontWeight: '800', color: '#2563EB', backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activePillText: { color: '#047857', fontWeight: '700', fontSize: 11 },
  activateBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  activateText: { color: '#334155', fontWeight: '700', fontSize: 11 },
  smallEditBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  smallEditText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});