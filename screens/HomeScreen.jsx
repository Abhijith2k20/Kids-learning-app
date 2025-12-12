import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { PointsBadge } from '../components/PointsBadge';
import { usePointsStore } from '../store/pointsStore';

export const HomeScreen = () => {
    const router = useRouter();
    const resetPoints = usePointsStore((state) => state.resetPoints);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.appTitle}>Kids Learn</Text>
                <PointsBadge />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Trace Card */}
                <TouchableOpacity
                    style={[styles.card, styles.traceCard]}
                    onPress={() => router.push('/trace')}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardIcon}>✏️</Text>
                        <View>
                            <Text style={styles.cardTitle}>Trace Letter</Text>
                            <Text style={styles.cardDesc}>Practice writing ABCs</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Quiz Card */}
                <TouchableOpacity
                    style={[styles.card, styles.quizCard]}
                    onPress={() => router.push('/quiz')}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardIcon}>🎧</Text>
                        <View>
                            <Text style={styles.cardTitle}>Sound Quiz</Text>
                            <Text style={styles.cardDesc}>Match sounds to letters</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Speak Card */}
                <TouchableOpacity
                    style={[styles.card, styles.speakCard]}
                    onPress={() => router.push('/speak')}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardIcon}>🎤</Text>
                        <View>
                            <Text style={styles.cardTitle}>Read Aloud</Text>
                            <Text style={styles.cardDesc}>Practice pronunciation</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Homophones Card */}
                <TouchableOpacity
                    style={[styles.card, styles.homophonesCard]}
                    onPress={() => router.push('/homophones')}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardIcon}>🔗</Text>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Homophones</Text>
                            <Text style={styles.cardDesc}>Match similar sounds</Text>
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4C3',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#827717',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 25,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 6,
    },
    traceCard: {
        borderLeftWidth: 8,
        borderLeftColor: '#FF6B6B',
    },
    quizCard: {
        borderLeftWidth: 8,
        borderLeftColor: '#4ECDC4',
    },
    speakCard: {
        borderLeftWidth: 8,
        borderLeftColor: '#9C27B0',
    },
    homophonesCard: {
        borderLeftWidth: 8,
        borderLeftColor: '#FF9800',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextContainer: {
        flex: 1,
    },
    cardIcon: {
        fontSize: 50,
        marginRight: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    cardDesc: {
        fontSize: 16,
        color: '#7F8C8D',
        marginTop: 5,
    },
    resetButton: {
        alignSelf: 'center',
        marginBottom: 30,
        padding: 10,
    },
    resetText: {
        color: '#9E9E9E',
        textDecorationLine: 'underline',
    }
});
