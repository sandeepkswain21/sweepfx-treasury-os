import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { fetchEnterpriseProfile } from '../services/profileService';

export default function EnterpriseProfileModal({ visible, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) loadProfile();
  }, [visible]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchEnterpriseProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load entity profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>ENTERPRISE ENTITY PROFILE</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading || !profile ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ padding: 40 }} />
          ) : (
            <View style={styles.content}>
              <View style={styles.companyBadgeRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile.company_name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>{profile.company_name}</Text>
                  <Text style={styles.jurisdiction}>{profile.jurisdiction}</Text>
                </View>
                <View style={styles.kybBadge}>
                  <Text style={styles.kybText}>✓ KYB {profile.kyb_status}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>LEI NUMBER</Text>
                  <Text style={styles.valMono}>{profile.lei_number}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>TAX ID / EIN</Text>
                  <Text style={styles.valMono}>{profile.tax_id}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>SWIFT BIC</Text>
                  <Text style={styles.valMono}>{profile.swift_bic}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.label}>TREASURY OFFICER</Text>
                  <Text style={styles.valText}>{profile.treasury_officer}</Text>
                </View>
              </View>

              <Text style={styles.subHeading}>AUTHENTICATION & SECURITY COMPLIANCE</Text>
              <View style={styles.credBox}>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Portal Username:</Text>
                  <Text style={styles.credVal}>{profile.username}</Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Encrypted Key:</Text>
                  <Text style={styles.credVal}>••••••••••••••••</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={styles.secBadge}><Text style={styles.secText}>SOC2 Type II</Text></View>
                  <View style={styles.secBadge}><Text style={styles.secText}>ISO 27001</Text></View>
                  <View style={styles.secBadge}><Text style={styles.secText}>GDPR Compliant</Text></View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 600, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: '#64748B', fontWeight: 'bold' },
  companyBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  companyName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  jurisdiction: { fontSize: 12, color: '#64748B', marginTop: 2 },
  kybBadge: { marginLeft: 'auto', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  kybText: { color: '#047857', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoBox: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  valMono: { fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' },
  valText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  subHeading: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: 10 },
  credBox: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  credRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  credLabel: { fontSize: 12, color: '#1E40AF', fontWeight: '500' },
  credVal: { fontSize: 12, color: '#1E3A8A', fontWeight: '700', fontFamily: 'monospace' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#93C5FD' },
  secText: { color: '#1D4ED8', fontSize: 10, fontWeight: '700' },
});