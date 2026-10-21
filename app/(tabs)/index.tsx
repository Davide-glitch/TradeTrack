import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllTrades, initDatabase, resetToDemoTrades, Trade } from '../../db/database';

export default function HomeScreen() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [timeframe, setTimeframe] = useState<'ALL' | 'MONTH' | 'WEEK'>('ALL');

  const loadData = useCallback(() => {
    initDatabase();
    setTrades(getAllTrades());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredTrades = trades.filter((t) => {
    if (timeframe === 'ALL') return true;
    const days = timeframe === 'WEEK' ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    return t.tradeDate >= cutoff;
  });

  const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = filteredTrades.filter((t) => t.pnl > 0);
  const losses = filteredTrades.filter((t) => t.pnl < 0);
  const winRate = filteredTrades.length > 0 ? Math.round((wins.length / filteredTrades.length) * 100) : 0;
  const totalMinutes = filteredTrades.reduce((sum, t) => sum + t.durationMinutes, 0);

  const recentTrades = [...filteredTrades].slice(0, 10).reverse();
  const maxAbsPnl = Math.max(...recentTrades.map((t) => Math.abs(t.pnl)), 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Timeframe Selector Pills */}
      <View style={styles.filterContainer}>
        {(['ALL', 'MONTH', 'WEEK'] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[styles.filterPill, timeframe === tf && styles.filterPillActive]}
            onPress={() => setTimeframe(tf)}
          >
            <Text style={[styles.filterText, timeframe === tf && styles.filterTextActive]}>
              {tf === 'ALL' ? 'All Time' : tf === 'MONTH' ? '30 Days' : '7 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hero PnL Display */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Net Performance</Text>
          <View style={[styles.statusBadge, totalPnl >= 0 ? styles.badgeGreen : styles.badgeRed]}>
            <Text style={[styles.statusBadgeText, totalPnl >= 0 ? styles.green : styles.red]}>
              {totalPnl >= 0 ? 'PROFITABLE' : 'DRAWDOWN'}
            </Text>
          </View>
        </View>

        <Text style={[styles.heroValue, totalPnl >= 0 ? styles.green : styles.red]}>
          {totalPnl >= 0 ? `+$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `-$${Math.abs(totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        </Text>

        <View style={styles.heroFooter}>
          <Text style={styles.heroMetaItem}>
            Total Trades: <Text style={styles.whiteBold}>{filteredTrades.length}</Text>
          </Text>
          <Text style={styles.heroMetaDivider}>|</Text>
          <Text style={styles.heroMetaItem}>
            Market Time: <Text style={styles.whiteBold}>{(totalMinutes / 60).toFixed(1)}h</Text>
          </Text>
        </View>
      </View>

      {/* Primary KPI Grid */}
      <View style={styles.grid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>WIN RATE</Text>
          <Text style={styles.kpiValue}>{winRate}%</Text>
          <View style={styles.miniBarBackground}>
            <View style={[styles.miniBarFill, { width: `${winRate}%` }]} />
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>WIN / LOSS SPLIT</Text>
          <Text style={styles.kpiValue}>
            <Text style={styles.green}>{wins.length}W</Text>
            <Text style={styles.subtext}> / </Text>
            <Text style={styles.red}>{losses.length}L</Text>
          </Text>
          <Text style={styles.kpiSub}>Ratio: {losses.length > 0 ? (wins.length / losses.length).toFixed(2) : 'N/A'}</Text>
        </View>
      </View>

      {/* Visual Bar Distribution Chart */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Trade Sequence</Text>
          <Text style={styles.cardSubTitle}>Last 10 trades PnL</Text>
        </View>

        <View style={styles.chartWrapper}>
          <View style={styles.baseline} />
          {recentTrades.map((t) => {
            const heightPercent = Math.min(100, Math.max(14, Math.round((Math.abs(t.pnl) / maxAbsPnl) * 100)));
            const isProfit = t.pnl >= 0;

            return (
              <View key={t.id} style={styles.barColumn}>
                <View style={styles.barSlot}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: heightPercent,
                        backgroundColor: isProfit ? '#10b981' : '#f43f5e',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{t.instrument.split('/')[0]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Activity List */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recorded Trade Entries</Text>
        <TouchableOpacity
          onPress={() => {
            resetToDemoTrades();
            loadData();
          }}
        >
          <Text style={styles.resetLink}>Reload Mock Data</Text>
        </TouchableOpacity>
      </View>

      {filteredTrades.slice(0, 6).map((t) => {
        const isWin = t.pnl >= 0;
        return (
          <View key={t.id} style={styles.tradeCard}>
            <View style={[styles.indicatorStrip, { backgroundColor: isWin ? '#10b981' : '#f43f5e' }]} />
            <View style={styles.tradeContent}>
              <View style={styles.tradeRow}>
                <View style={styles.instrumentRow}>
                  <Text style={styles.tradeInstrument}>{t.instrument}</Text>
                  <View style={[styles.dirBadge, t.direction === 'BUY' ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.dirText, t.direction === 'BUY' ? styles.green : styles.red]}>
                      {t.direction}
                    </Text>
                  </View>
                  {t.isDemo ? <Text style={styles.demoTag}>DEMO</Text> : null}
                </View>
                <Text style={[styles.tradePnl, isWin ? styles.green : styles.red]}>
                  {isWin ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaDetails}>
                  {t.tradeDate} · {t.session}
                </Text>
                <View style={styles.emotionPill}>
                  <Text style={styles.emotionText}>{t.emotion}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0e14',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#121824',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  heroCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 8,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  heroMetaItem: {
    color: '#94a3b8',
    fontSize: 13,
  },
  heroMetaDivider: {
    color: '#334155',
    marginHorizontal: 10,
  },
  whiteBold: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#121824',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiValue: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 8,
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  subtext: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '400',
  },
  miniBarBackground: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  chartCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubTitle: {
    color: '#64748b',
    fontSize: 12,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    position: 'relative',
    paddingTop: 8,
  },
  baseline: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1e293b',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barSlot: {
    height: 80,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: 14,
    borderRadius: 4,
  },
  barLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '600',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  resetLink: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  tradeCard: {
    backgroundColor: '#121824',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  indicatorStrip: {
    width: 4,
  },
  tradeContent: {
    flex: 1,
    padding: 14,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instrumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradeInstrument: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  dirBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirText: {
    fontSize: 10,
    fontWeight: '800',
  },
  demoTag: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#1e293b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tradePnl: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaDetails: {
    color: '#64748b',
    fontSize: 12,
  },
  emotionPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emotionText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  green: {
    color: '#10b981',
  },
  red: {
    color: '#f43f5e',
  },
});