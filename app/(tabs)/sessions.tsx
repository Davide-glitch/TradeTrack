import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAllTrades, Trade } from '../../db/database';

const SESSIONS = [
    { name: 'Sydney', city: 'Australia', utcOpen: 22, utcClose: 7 },
    { name: 'Tokyo', city: 'Japan', utcOpen: 0, utcClose: 9 },
    { name: 'London', city: 'United Kingdom', utcOpen: 8, utcClose: 17 },
    { name: 'New York', city: 'United States', utcOpen: 13, utcClose: 22 },
];

export default function SessionsScreen() {
    const [now, setNow] = useState(new Date());
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setTrades(getAllTrades());
        }, [])
    );

    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const utcSec = now.getUTCSeconds();

    const isSessionOpen = (open: number, close: number) => {
        return open > close
            ? utcHour >= open || utcHour < close
            : utcHour >= open && utcHour < close;
    };

    const londonNyOverlap = utcHour >= 13 && utcHour < 17;
    const sydneyTokyoOverlap = utcHour >= 0 && utcHour < 7;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Live Market Clock Display */}
            <View style={styles.clockCard}>
                <View style={styles.clockHeader}>
                    <Text style={styles.clockLabel}>UNIVERSAL COORDINATED TIME</Text>
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.pulseText}>LIVE SYNC</Text>
                    </View>
                </View>

                <Text style={styles.clockTime}>
                    {String(utcHour).padStart(2, '0')}:{String(utcMin).padStart(2, '0')}
                    <Text style={styles.seconds}>:{String(utcSec).padStart(2, '0')}</Text>
                    <Text style={styles.utcTag}> UTC</Text>
                </Text>

                <Text style={styles.deviceTime}>Local Terminal Time: {now.toLocaleTimeString()}</Text>
            </View>

            {/* Overlap Liquidity Banner */}
            <View
                style={[
                    styles.overlapCard,
                    (londonNyOverlap || sydneyTokyoOverlap) ? styles.overlapCardActive : styles.overlapCardIdle,
                ]}
            >
                <Text style={styles.overlapTitle}>
                    {londonNyOverlap
                        ? '⚡ HIGH LIQUIDITY OVERLAP ACTIVE'
                        : sydneyTokyoOverlap
                            ? '🌐 ASIAN SESSION OVERLAP ACTIVE'
                            : 'NORMAL MARKET LIQUIDITY'}
                </Text>
                <Text style={styles.overlapBody}>
                    {londonNyOverlap
                        ? 'London and New York sessions are open concurrently (13:00–17:00 UTC). Major EUR, GBP, and USD volume concentrated here.'
                        : sydneyTokyoOverlap
                            ? 'Sydney and Tokyo markets are executing simultaneously. Optimal conditions for JPY and AUD cross pairs.'
                            : 'No dual-session overlaps active at this hour. Standard spreads apply.'}
                </Text>
            </View>

            <Text style={styles.sectionHeading}>Global Session Clocks</Text>

            {SESSIONS.map((s) => {
                const isOpen = isSessionOpen(s.utcOpen, s.utcClose);
                const hoursLeft = isOpen
                    ? (s.utcClose - utcHour + 24) % 24
                    : (s.utcOpen - utcHour + 24) % 24;

                const sessionTrades = trades.filter((t) => t.session.includes(s.name));
                const sessionPnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
                const sessionWins = sessionTrades.filter((t) => t.pnl > 0).length;
                const winRate = sessionTrades.length > 0 ? Math.round((sessionWins / sessionTrades.length) * 100) : 0;

                return (
                    <View key={s.name} style={[styles.sessionCard, isOpen && styles.sessionCardOpen]}>
                        <View style={styles.sessionHeaderRow}>
                            <View>
                                <Text style={styles.cityName}>{s.name.toUpperCase()}</Text>
                                <Text style={styles.countryLabel}>{s.city}</Text>
                            </View>

                            <View style={[styles.statusBadge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                                <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10b981' : '#64748b' }]} />
                                <Text style={[styles.statusText, isOpen ? styles.green : styles.gray]}>
                                    {isOpen ? 'MARKET OPEN' : 'CLOSED'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.scheduleRow}>
                            <Text style={styles.scheduleText}>
                                Trading Hours: {String(s.utcOpen).padStart(2, '0')}:00 – {String(s.utcClose).padStart(2, '0')}:00 UTC
                            </Text>
                            <Text style={styles.countdownText}>
                                {isOpen ? `Closes in ~${hoursLeft}h ${59 - utcMin}m` : `Opens in ~${hoursLeft}h ${59 - utcMin}m`}
                            </Text>
                        </View>

                        {/* Session Historical Stats */}
                        <View style={styles.sessionStatsContainer}>
                            <View style={styles.sessionStatItem}>
                                <Text style={styles.statLabel}>TRADES</Text>
                                <Text style={styles.statNumber}>{sessionTrades.length}</Text>
                            </View>
                            <View style={styles.sessionStatDivider} />
                            <View style={styles.sessionStatItem}>
                                <Text style={styles.statLabel}>WIN RATE</Text>
                                <Text style={styles.statNumber}>{winRate}%</Text>
                            </View>
                            <View style={styles.sessionStatDivider} />
                            <View style={styles.sessionStatItem}>
                                <Text style={styles.statLabel}>NET P&L</Text>
                                <Text style={[styles.statNumber, sessionPnl >= 0 ? styles.green : styles.red]}>
                                    {sessionPnl >= 0 ? `+$${sessionPnl.toFixed(0)}` : `-$${Math.abs(sessionPnl).toFixed(0)}`}
                                </Text>
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
    clockCard: {
        backgroundColor: '#121824',
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    clockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clockLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    pulseContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    pulseText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    clockTime: {
        color: '#f8fafc',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: -1,
    },
    seconds: {
        color: '#64748b',
        fontSize: 26,
        fontWeight: '700',
    },
    utcTag: {
        color: '#3b82f6',
        fontSize: 18,
        fontWeight: '700',
    },
    deviceTime: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 6,
    },
    overlapCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    overlapCardActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: '#6366f1',
    },
    overlapCardIdle: {
        backgroundColor: '#121824',
        borderColor: '#1e293b',
    },
    overlapTitle: {
        color: '#a5b4fc',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    overlapBody: {
        color: '#cbd5e1',
        fontSize: 12,
        lineHeight: 18,
    },
    sectionHeading: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    sessionCard: {
        backgroundColor: '#121824',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    sessionCardOpen: {
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    sessionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cityName: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    countryLabel: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    badgeOpen: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
    },
    badgeClosed: {
        backgroundColor: 'rgba(100, 116, 139, 0.12)',
    },
    scheduleRow: {
        marginTop: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#1e293b',
    },
    scheduleText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    countdownText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    sessionStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    sessionStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    sessionStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#1e293b',
    },
    statLabel: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statNumber: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    green: {
        color: '#10b981',
    },
    red: {
        color: '#f43f5e',
    },
    gray: {
        color: '#94a3b8',
    },
});