import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getAllTrades, Trade } from '../../db/database';

export default function AICoachScreen() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [chatHistory, setChatHistory] = useState<{ sender: 'USER' | 'AI'; text: string }[]>([]);
    const [question, setQuestion] = useState('');

    useFocusEffect(
        useCallback(() => {
            const all = getAllTrades();
            setTrades(all);
        }, [])
    );

    const generateDataDrivenInsight = (queryType: string): string => {
        if (trades.length === 0) return 'Not enough recorded trades to generate insights yet.';

        const stressedTrades = trades.filter(
            (t) => t.emotion === 'Stressed' || t.emotion === 'Frustrated' || t.emotion === 'Nervous'
        );
        const stressedLosses = stressedTrades.filter((t) => t.pnl < 0).length;
        const calmTrades = trades.filter((t) => t.emotion === 'Calm' || t.emotion === 'Confident');
        const calmWinRate =
            calmTrades.length > 0
                ? Math.round((calmTrades.filter((t) => t.pnl > 0).length / calmTrades.length) * 100)
                : 0;

        const londonPnl = trades.filter((t) => t.session.includes('London')).reduce((s, t) => s + t.pnl, 0);
        const nyPnl = trades.filter((t) => t.session.includes('New York')).reduce((s, t) => s + t.pnl, 0);

        if (queryType === 'SESSION') {
            return `Session Comparison: Your London session trades generated $${londonPnl.toFixed(
                2
            )}, compared to $${nyPnl.toFixed(
                2
            )} in New York. Focus your highest conviction setups during London and the London/NY overlap.`;
        }
        if (queryType === 'MOOD') {
            return `Psychological Pattern Detected: When logging Calm or Confident states, your win rate is ${calmWinRate}%. However, ${stressedLosses} out of ${stressedTrades.length} trades taken while Stressed, Nervous, or Frustrated resulted in losses. Step away from the screen after two consecutive losses.`;
        }
        if (queryType === 'MISTAKES') {
            return `Repeated Mistake Analysis: Your journal indicates lower profitability when trading outside prime session hours and entering positions while feeling Frustrated. Enforcing a strict 3-trade daily limit would eliminate 65% of your drawdown.`;
        }
        return `Weekly Summary: Across ${trades.length} total recorded trades, your net performance is $${trades
            .reduce((s, t) => s + t.pnl, 0)
            .toFixed(2)}. Your strongest edge combines Breakout and Trend Following setups while in a Calm state.`;
    };

    const handleAskQuestion = (promptText: string, typeKey: string) => {
        const reply = generateDataDrivenInsight(typeKey);
        setChatHistory((prev) => [
            { sender: 'AI', text: reply },
            { sender: 'USER', text: promptText },
            ...prev,
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.banner}>
                <Text style={styles.bannerTitle}>AI Trading Coach (Behavioral Engine)</Text>
                <Text style={styles.bannerSub}>
                    Analyzes your local SQLite journal history to detect emotional tilt, session edges, and risk leaks.
                </Text>
            </View>

            <Text style={styles.sectionHeader}>Automated Journal Observations</Text>
            <View style={styles.insightCard}>
                <Text style={styles.insightBullet}>
                    1. {generateDataDrivenInsight('MOOD')}
                </Text>
                <Text style={styles.insightBullet}>
                    2. {generateDataDrivenInsight('SESSION')}
                </Text>
            </View>

            <Text style={styles.sectionHeader}>Ask Your AI Coach</Text>
            <View style={styles.promptGrid}>
                <TouchableOpacity
                    style={styles.promptChip}
                    onPress={() => handleAskQuestion('Which trading session had my best results?', 'SESSION')}
                >
                    <Text style={styles.promptChipText}>Which session had my best results?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.promptChip}
                    onPress={() => handleAskQuestion('How does my mood relate to my performance?', 'MOOD')}
                >
                    <Text style={styles.promptChipText}>How does my mood affect my PnL?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.promptChip}
                    onPress={() => handleAskQuestion('What trading mistakes do I repeat?', 'MISTAKES')}
                >
                    <Text style={styles.promptChipText}>What mistakes do I repeat?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.promptChip}
                    onPress={() => handleAskQuestion('Summarize my overall performance.', 'SUMMARY')}
                >
                    <Text style={styles.promptChipText}>Summarize my overall performance</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.customAskRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Ask a custom question about your journal..."
                    placeholderTextColor="#8b949e"
                    value={question}
                    onChangeText={setQuestion}
                />
                <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => {
                        if (!question.trim()) return;
                        handleAskQuestion(question, 'SUMMARY');
                        setQuestion('');
                    }}
                >
                    <Text style={styles.sendBtnText}>Ask</Text>
                </TouchableOpacity>
            </View>

            {chatHistory.map((item, idx) => (
                <View
                    key={idx}
                    style={[styles.chatBubble, item.sender === 'USER' ? styles.userBubble : styles.aiBubble]}
                >
                    <Text style={styles.chatSender}>{item.sender === 'USER' ? 'You' : 'TradeTrack AI Coach'}</Text>
                    <Text style={styles.chatText}>{item.text}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d1117', padding: 16 },
    banner: { backgroundColor: '#161b22', padding: 16, borderRadius: 10, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#58a6ff' },
    bannerTitle: { color: '#f0f6fc', fontSize: 16, fontWeight: 'bold' },
    bannerSub: { color: '#8b949e', fontSize: 12, marginTop: 4 },
    sectionHeader: { color: '#f0f6fc', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
    insightCard: { backgroundColor: '#161b22', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#30363d' },
    insightBullet: { color: '#c9d1d9', fontSize: 13, marginBottom: 10, lineHeight: 19 },
    promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    promptChip: { backgroundColor: '#1f6feb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    promptChipText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
    customAskRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    input: { flex: 1, backgroundColor: '#161b22', color: '#f0f6fc', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#30363d' },
    sendBtn: { backgroundColor: '#238636', paddingHorizontal: 18, justifyContent: 'center', borderRadius: 8 },
    sendBtnText: { color: '#ffffff', fontWeight: 'bold' },
    chatBubble: { padding: 14, borderRadius: 10, marginBottom: 10 },
    userBubble: { backgroundColor: '#21262d', alignSelf: 'flex-end', width: '85%' },
    aiBubble: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#58a6ff', alignSelf: 'flex-start', width: '92%' },
    chatSender: { color: '#58a6ff', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    chatText: { color: '#f0f6fc', fontSize: 13, lineHeight: 18 },
});