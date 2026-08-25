import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Easing, Dimensions } from 'react-native';

export default function LandingPage({ onLaunchDashboard }) {
  const [calcCapital, setCalcCapital] = useState('250000');
  const [calcCurrency, setCalcCurrency] = useState('USD');
  const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);

  // Animation values for the USP Graphic
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous pulse for the AI node
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1500, useNativeDriver: false, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    // Simulating money moving back and forth in the USP graphic
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 100, duration: 2000, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(slideAnim, { toValue: 0, duration: 2000, useNativeDriver: false, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();
  }, []);

  const capital = parseFloat(calcCapital) || 0;
  const standardBankApy = 0.005; 
  const sweepFxApy = 0.045;     

  const standardYield = capital * standardBankApy;
  const sweepFxYield = capital * sweepFxApy;
  const netLift = sweepFxYield - standardYield;

  const scrollToSecurity = () => {
    alert('In a full web deployment, this smoothly scrolls to the Security section below!');
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLightning}>⚡</Text>
          </View>
          <Text style={styles.logoText}>
            SweepFX <Text style={styles.logoHighlight}>Treasury</Text>
          </Text>
        </View>

        <View style={styles.navRight}>
          {/* Dropdown Menu Container */}
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity 
              style={styles.navLink} 
              onPress={() => setIsFeaturesMenuOpen(!isFeaturesMenuOpen)}
            >
              <Text style={styles.navLinkText}>Product Features {isFeaturesMenuOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isFeaturesMenuOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity style={styles.dropdownItem} onPress={onLaunchDashboard}>
                  <Text style={styles.dropdownIcon}>🧠</Text>
                  <View>
                    <Text style={styles.dropdownTitle}>AI Arbitrage Engine</Text>
                    <Text style={styles.dropdownSub}>Instantly detect highest APY spreads</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={onLaunchDashboard}>
                  <Text style={styles.dropdownIcon}>🌍</Text>
                  <View>
                    <Text style={styles.dropdownTitle}>Global vIBAN Vaults</Text>
                    <Text style={styles.dropdownSub}>Hold & sweep multi-currency seamlessly</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={onLaunchDashboard}>
                  <Text style={styles.dropdownIcon}>🛡️</Text>
                  <View>
                    <Text style={styles.dropdownTitle}>Dynamic Guardrails</Text>
                    <Text style={styles.dropdownSub}>Never breach operating safety limits</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={onLaunchDashboard}>
                  <Text style={styles.dropdownIcon}>⚖️</Text>
                  <View>
                    <Text style={styles.dropdownTitle}>Immutable Ledger</Text>
                    <Text style={styles.dropdownSub}>GAAP-ready execution audit trails</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.navLink} onPress={scrollToSecurity}>
            <Text style={styles.navLinkText}>Security & Risk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginBtn} onPress={onLaunchDashboard}>
            <Text style={styles.loginBtnText}>Launch OS Dashboard →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea}>
        
        {/* TWO-COLUMN HERO SECTION */}
        <View style={styles.heroSection}>
          
          {/* Left Column: Text & CTA */}
          <View style={styles.heroLeft}>
            <View style={styles.pillBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.pillBadgeText}>NEW: APY ENGINE V2.0 LIVE</Text>
            </View>

            <Text style={styles.heroTitle}>
              The <Text style={styles.heroHighlight}>intelligent financial platform</Text> that <Text style={styles.heroHighlight}>Unleashes</Text> the Power of Idle Treasury.
            </Text>

            <Text style={styles.hookyDesc}>
              Stop letting inflation erode your corporate reserves. Traditional banking is too slow, and manual yield hunting is too risky.
            </Text>

            <Text style={styles.heroSub}>
              SweepFX uses an advanced AI routing engine and multi-currency virtual IBANs with strict risk guardrails. We automatically evaluate real-time data to capture the highest optimal interest spreads across global fiat accounts—maximizing yield effortlessly.
            </Text>

            <View style={styles.ctaRow}>
              <TouchableOpacity style={styles.primaryCta} onPress={onLaunchDashboard}>
                <Text style={styles.primaryCtaText}>Enter Platform Demo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryCta} onPress={onLaunchDashboard}>
                <Text style={styles.secondaryCtaText}>Book CFO Onboarding</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Column: AI Yield Animation Graphic */}
          <View style={styles.heroRight}>
            <Text style={styles.animationLabel}>HOW OUR AI ROUTING MULTIPLIES YIELD</Text>
            <View style={styles.animationCard}>
              <View style={styles.animNode}>
                <Text style={styles.animNodeTitle}>IDLE CAPITAL</Text>
                <Text style={styles.animNodeVal}>$100,000</Text>
                <Text style={styles.animNodeSub}>Earning 0.5%</Text>
              </View>

              <View style={styles.animPath}>
                <Animated.View style={[styles.animDot, { transform: [{ translateX: slideAnim }] }]} />
                <View style={styles.animLine} />
              </View>

              <Animated.View style={[styles.aiCoreNode, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.aiCoreIcon}>⚡</Text>
                <Text style={styles.aiCoreText}>AI GUARDRAIL</Text>
              </Animated.View>

              <View style={styles.animPath}>
                <Animated.View style={[styles.animDot, { transform: [{ translateX: slideAnim }] }]} />
                <View style={styles.animLine} />
              </View>

              <View style={[styles.animNode, styles.animNodeTarget]}>
                <Text style={styles.animNodeTitleTarget}>SWEEPFX VAULT</Text>
                <Text style={styles.animNodeValTarget}>4.5% APY</Text>
                <Text style={styles.animNodeSubTarget}>Optimized & Safe</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Interactive ROI Calculator Section */}
        <View style={styles.calcSection}>
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <Text style={styles.calcTag}>REAL-TIME YIELD SIMULATOR</Text>
              <Text style={styles.calcTitle}>Calculate Your Automated Yield Lift</Text>
            </View>

            <View style={styles.calcInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>IDLE CORPORATE RESERVES</Text>
                <TextInput
                  style={styles.calcInput}
                  keyboardType="numeric"
                  value={calcCapital}
                  onChangeText={setCalcCapital}
                />
              </View>

              <View style={{ width: 120 }}>
                <Text style={styles.inputLabel}>CURRENCY</Text>
                <View style={styles.currencyToggle}>
                  <TouchableOpacity
                    style={[styles.currBtn, calcCurrency === 'USD' && styles.currBtnActive]}
                    onPress={() => setCalcCurrency('USD')}
                  >
                    <Text style={[styles.currBtnText, calcCurrency === 'USD' && styles.currBtnTextActive]}>USD</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.currBtn, calcCurrency === 'EUR' && styles.currBtnActive]}
                    onPress={() => setCalcCurrency('EUR')}
                  >
                    <Text style={[styles.currBtnText, calcCurrency === 'EUR' && styles.currBtnTextActive]}>EUR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Calculator Output Grid */}
            <View style={styles.calcGrid}>
              <View style={styles.calcTile}>
                <Text style={styles.tileLabel}>TRADITIONAL CHECKING (0.5%)</Text>
                <Text style={styles.tileValMuted}>${standardYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</Text>
              </View>

              <View style={styles.calcTileHighlight}>
                <Text style={styles.tileLabelHighlight}>SWEEP-FX ENGINE (4.5% APY)</Text>
                <Text style={styles.tileValHighlight}>${sweepFxYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</Text>
              </View>

              <View style={styles.calcTileGain}>
                <Text style={styles.tileLabelGain}>NET AI YIELD LIFT</Text>
                <Text style={styles.tileValGain}>+${netLift.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security and Risk Section */}
        <View style={styles.securitySection}>
          <Text style={styles.sectionHeaderWhite}>ZERO COMPROMISE ON CORPORATE SECURITY</Text>
          <View style={styles.securityGrid}>
            <View style={styles.secItem}>
              <Text style={styles.secIcon}>🔒</Text>
              <Text style={styles.secTitle}>Tier-1 Bank Custody</Text>
              <Text style={styles.secDesc}>Funds never leave regulated banking infrastructure. We partner with globally systemic banks to secure your principal.</Text>
            </View>
            <View style={styles.secItem}>
              <Text style={styles.secIcon}>🚦</Text>
              <Text style={styles.secTitle}>Strict CFO Guardrails</Text>
              <Text style={styles.secDesc}>AI only executes within your mathematical limits. Define exact minimum buffers and ceiling caps to protect payroll.</Text>
            </View>
            <View style={styles.secItem}>
              <Text style={styles.secIcon}>✍️</Text>
              <Text style={styles.secTitle}>Dual-Control Approvals</Text>
              <Text style={styles.secDesc}>Any sweep exceeding auto-approve thresholds is instantly halted, pending cryptographic sign-off from authorized Treasury officers.</Text>
            </View>
          </View>
        </View>

        {/* Enterprise Pillars Grid */}
        <View style={styles.pillarsSection}>
          <Text style={styles.sectionHeader}>ENTERPRISE-GRADE TREASURY ARCHITECTURE</Text>
          
          <View style={styles.pillarsGrid}>
            <View style={styles.pillarCard}>
              <Text style={styles.pillarIcon}>🏛️</Text>
              <Text style={styles.pillarTitle}>Virtual IBAN Banking</Text>
              <Text style={styles.pillarDesc}>
                Dedicated vIBAN coordinates powered by tier-1 custodian banks. Receive customer payments and clear payroll directly from liquid buffers.
              </Text>
            </View>

            <View style={styles.pillarCard}>
              <Text style={styles.pillarIcon}>⚡</Text>
              <Text style={styles.pillarTitle}>Automated 24/7 Sweeps</Text>
              <Text style={styles.pillarDesc}>
                Continuous evaluation engine monitors yield spreads and spot FX rates to execute instant internal ledger sweeps into high-yielding vaults.
              </Text>
            </View>

            <View style={styles.pillarCard}>
              <Text style={styles.pillarIcon}>🛡️</Text>
              <Text style={styles.pillarTitle}>CFO Risk Guardrails</Text>
              <Text style={styles.pillarDesc}>
                Set strict operating limits, maximum sweep caps, and minimum yield thresholds. Automatic dual-control sign-off required for large transactions.
              </Text>
            </View>

            <View style={styles.pillarCard}>
              <Text style={styles.pillarIcon}>📜</Text>
              <Text style={styles.pillarTitle}>Immutable Audit Ledger</Text>
              <Text style={styles.pillarDesc}>
                Real-time audit trail logs every settlement with spot FX rates, authorization tags, and realized yield metrics for GAAP compliance.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Banner */}
        <View style={styles.footerBanner}>
          <Text style={styles.footerTitle}>Ready To Optimize Your Corporate Cash?</Text>
          <TouchableOpacity style={styles.footerCta} onPress={onLaunchDashboard}>
            <Text style={styles.footerCtaText}>Launch Dashboard Demo Now →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', fontFamily: 'system-ui, sans-serif' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 50 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 24, position: 'relative' },
  logoIcon: { height: 38, width: 38, borderRadius: 10, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  logoLightning: { color: '#2563EB', fontWeight: 'bold', fontSize: 18 },
  logoText: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  logoHighlight: { color: '#2563EB' },
  
  navLink: { paddingVertical: 8 },
  navLinkText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  loginBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  loginBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  dropdownMenu: { position: 'absolute', top: 40, right: 180, width: 300, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, padding: 12, zIndex: 100 },
  dropdownItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 8, gap: 12 },
  dropdownIcon: { fontSize: 18 },
  dropdownTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  dropdownSub: { fontSize: 11, color: '#64748B', marginTop: 2 },

  scrollArea: { flex: 1 },

  /* --- TWO COLUMN HERO LAYOUT --- */
  heroSection: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40, alignItems: 'center', justifyContent: 'space-between', maxWidth: 1300, alignSelf: 'center', gap: 40 },
  heroLeft: { flex: 1, minWidth: 350, alignItems: 'flex-start' },
  heroRight: { flex: 1.2, minWidth: 400, alignItems: 'center' },

  pillBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 28 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  pillBadgeText: { color: '#047857', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  
  heroTitle: { fontSize: 50, fontWeight: '900', color: '#0F172A', textAlign: 'left', lineHeight: 60, letterSpacing: -1.5 },
  heroHighlight: { color: '#2563EB' },
  
  hookyDesc: { fontSize: 18, fontWeight: '700', color: '#1E40AF', textAlign: 'left', marginTop: 24, lineHeight: 28, maxWidth: 550 },
  heroSub: { fontSize: 16, color: '#475569', textAlign: 'left', marginTop: 16, lineHeight: 26, maxWidth: 550, fontWeight: '500' },
  
  ctaRow: { flexDirection: 'row', gap: 16, marginTop: 40, flexWrap: 'wrap', justifyContent: 'flex-start' },
  primaryCta: { backgroundColor: '#2563EB', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  secondaryCta: { backgroundColor: '#FFFFFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryCtaText: { color: '#334155', fontWeight: '800', fontSize: 16 },

  /* --- ANIMATION GRAPHIC (MOVED TO RIGHT COLUMN) --- */
  animationLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginBottom: 16 },
  animationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, gap: 12, width: '100%', flexWrap: 'nowrap' },
  animNode: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', minWidth: 140 },
  animNodeTitle: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
  animNodeVal: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginVertical: 8 },
  animNodeSub: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  
  animNodeTarget: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  animNodeTitleTarget: { fontSize: 10, fontWeight: '800', color: '#047857', letterSpacing: 1 },
  animNodeValTarget: { fontSize: 22, fontWeight: '800', color: '#059669', marginVertical: 8 },
  animNodeSubTarget: { fontSize: 11, color: '#047857', fontWeight: '700' },

  animPath: { width: 60, height: 40, justifyContent: 'center', overflow: 'hidden', marginHorizontal: -10 },
  animLine: { height: 2, backgroundColor: '#E2E8F0', width: '100%', position: 'absolute' },
  animDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', position: 'absolute', zIndex: 10 },

  aiCoreNode: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 50, borderWidth: 2, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', width: 90, height: 90, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 15 },
  aiCoreIcon: { fontSize: 24 },
  aiCoreText: { fontSize: 9, fontWeight: '900', color: '#1D4ED8', marginTop: 4, textAlign: 'center' },

  /* --- REMAINDER OF PAGE --- */
  calcSection: { paddingHorizontal: 32, paddingVertical: 40, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  calcCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
  calcHeader: { marginBottom: 32 },
  calcTag: { fontSize: 11, fontWeight: '800', color: '#2563EB', letterSpacing: 1, marginBottom: 8 },
  calcTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  calcInputRow: { flexDirection: 'row', gap: 24, marginBottom: 32, flexWrap: 'wrap' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 8 },
  calcInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 16, color: '#0F172A', fontSize: 20, fontWeight: '800' },
  currencyToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  currBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  currBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  currBtnText: { color: '#64748B', fontWeight: '800', fontSize: 13 },
  currBtnTextActive: { color: '#2563EB' },

  calcGrid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  calcTile: { flex: 1, minWidth: 200, backgroundColor: '#F8FAFC', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  tileLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 8, letterSpacing: 0.5 },
  tileValMuted: { fontSize: 22, fontWeight: '800', color: '#475569' },
  calcTileHighlight: { flex: 1, minWidth: 200, backgroundColor: '#EFF6FF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  tileLabelHighlight: { fontSize: 10, fontWeight: '800', color: '#2563EB', marginBottom: 8, letterSpacing: 0.5 },
  tileValHighlight: { fontSize: 22, fontWeight: '900', color: '#1E40AF' },
  calcTileGain: { flex: 1, minWidth: 200, backgroundColor: '#ECFDF5', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  tileLabelGain: { fontSize: 10, fontWeight: '900', color: '#047857', marginBottom: 8, letterSpacing: 0.5 },
  tileValGain: { fontSize: 24, fontWeight: '900', color: '#059669' },

  securitySection: { paddingHorizontal: 32, paddingVertical: 60, backgroundColor: '#0F172A', marginTop: 20 },
  sectionHeaderWhite: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, textAlign: 'center', marginBottom: 40 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, textAlign: 'center', marginBottom: 40 },
  securityGrid: { flexDirection: 'row', gap: 24, maxWidth: 1100, alignSelf: 'center', flexWrap: 'wrap' },
  secItem: { flex: 1, minWidth: 250, alignItems: 'center', textAlign: 'center' },
  secIcon: { fontSize: 32, marginBottom: 16 },
  secTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  secDesc: { fontSize: 14, color: '#94A3B8', lineHeight: 22, textAlign: 'center' },

  pillarsSection: { paddingHorizontal: 32, paddingVertical: 60, maxWidth: 1100, alignSelf: 'center' },
  pillarsGrid: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  pillarCard: { flex: 1, minWidth: 240, backgroundColor: '#FFFFFF', padding: 32, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  pillarIcon: { fontSize: 32, marginBottom: 16 },
  pillarTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  pillarDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },

  footerBanner: { paddingHorizontal: 32, paddingVertical: 80, alignItems: 'center', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  footerTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginBottom: 24, textAlign: 'center', letterSpacing: -0.5 },
  footerCta: { backgroundColor: '#2563EB', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 12, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  footerCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});