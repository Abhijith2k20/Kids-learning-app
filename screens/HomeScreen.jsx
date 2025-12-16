import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { PointsBadge } from '../components/PointsBadge';
import { usePointsStore } from '../store/pointsStore';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
    const router = useRouter();
    const resetPoints = usePointsStore((state) => state.resetPoints);

    // Render horizontal lines for notebook effect
    const renderNotebookLines = () => {
        const lines = [];
        for (let i = 0; i < 30; i++) {
            lines.push(
                <View key={i} style={styles.notebookLine} />
            );
        }
        return lines;
    };

    // Render spiral holes on the left
    const renderSpiralHoles = () => {
        const holes = [];
        for (let i = 0; i < 12; i++) {
            holes.push(
                <View key={i} style={styles.spiralHole}>
                    <View style={styles.spiralHoleInner} />
                </View>
            );
        }
        return holes;
    };

    return (
        <View style={styles.container}>
            {/* Notebook background with lines */}
            <View style={styles.notebookBackground}>
                {renderNotebookLines()}
            </View>

            {/* Red margin line */}
            <View style={styles.marginLine} />

            {/* Spiral binding */}
            <View style={styles.spiralBinding}>
                {renderSpiralHoles()}
            </View>

            {/* Star badge in top right */}
            <View style={styles.starBadgeContainer}>
                <PointsBadge />
            </View>

            {/* Main content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.title}>KIDS LEARN</Text>

                {/* Trace Letter Card */}
                <TouchableOpacity
                    style={[styles.card, styles.traceCard]}
                    onPress={() => router.push('/trace')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardInner}>
                        <Text style={styles.cardText}>Trace Letter</Text>
                        <Text style={styles.cardIcon}>✏️</Text>
                    </View>
                    <View style={[styles.cardShadow, styles.traceShadow]} />
                </TouchableOpacity>

                {/* Sound Quiz Card */}
                <TouchableOpacity
                    style={[styles.card, styles.quizCard]}
                    onPress={() => router.push('/quiz')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardInner}>
                        <Text style={styles.cardText}>Sound Quiz</Text>
                        <View style={styles.radioIcon}>
                            <View style={styles.radioCircle} />
                            <View style={styles.radioLines}>
                                <View style={styles.radioLine} />
                                <View style={styles.radioLine} />
                            </View>
                        </View>
                    </View>
                    <View style={[styles.cardShadow, styles.quizShadow]} />
                </TouchableOpacity>

                {/* Read Aloud Card */}
                <TouchableOpacity
                    style={[styles.card, styles.readCard]}
                    onPress={() => router.push('/speak')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardInner}>
                        <Text style={styles.cardText}>Read Aloud</Text>
                        <View style={styles.readAloudIconContainer}>
                            <Text style={styles.magnifyIcon}>🔍</Text>
                            <Text style={styles.bookIcon}>📖</Text>
                        </View>
                    </View>
                    <View style={[styles.cardShadow, styles.readShadow]} />
                </TouchableOpacity>

                {/* Homophones Card */}
                <TouchableOpacity
                    style={[styles.card, styles.homophonesCard]}
                    onPress={() => router.push('/homophones')}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardInner}>
                        <Text style={styles.cardText}>Homophones</Text>
                        <View style={styles.speechBubble}>
                            <Text style={styles.questionMark}>?</Text>
                        </View>
                    </View>
                    <View style={[styles.cardShadow, styles.homophonesShadow]} />
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5DC', // Beige/cream paper color
    },
    notebookBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 120,
    },
    notebookLine: {
        height: 1,
        backgroundColor: '#ADD8E6',
        marginBottom: 28,
        marginLeft: 60,
        marginRight: 20,
        opacity: 0.6,
    },
    marginLine: {
        position: 'absolute',
        left: 55,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#FFB6C1',
        opacity: 0.7,
    },
    spiralBinding: {
        position: 'absolute',
        left: 5,
        top: 80,
        bottom: 80,
        width: 30,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    spiralHole: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#C0C0C0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    spiralHoleInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E8E4D9',
    },
    starBadgeContainer: {
        position: 'absolute',
        top: 40,
        right: 15,
        zIndex: 100,
    },
    scrollContent: {
        paddingTop: 50,
        paddingHorizontal: 50,
        paddingBottom: 40,
        paddingLeft: 70,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#C41E3A', // Deep red color
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
        fontStyle: 'italic',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    card: {
        borderRadius: 15,
        marginBottom: 25,
        position: 'relative',
        overflow: 'visible',
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 22,
        paddingHorizontal: 25,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    cardShadow: {
        position: 'absolute',
        bottom: -5,
        left: 3,
        right: 3,
        height: 15,
        borderRadius: 15,
        zIndex: -1,
    },
    cardText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 15,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    cardIcon: {
        fontSize: 32,
    },
    // Trace Letter Card - Yellow
    traceCard: {
        backgroundColor: '#F0E68C',
    },
    traceShadow: {
        backgroundColor: '#DAA520',
    },

    // Sound Quiz Card - Green
    quizCard: {
        backgroundColor: '#90EE90',
    },
    quizShadow: {
        backgroundColor: '#228B22',
    },

    // Read Aloud Card - Blue
    readCard: {
        backgroundColor: '#87CEEB',
    },
    readShadow: {
        backgroundColor: '#4682B4',
    },

    // Homophones Card - Pink
    homophonesCard: {
        backgroundColor: '#FFB6C1',
    },
    homophonesShadow: {
        backgroundColor: '#DB7093',
    },

    // Radio icon styles
    radioIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6347',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#CD5C5C',
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFF',
        marginRight: 6,
    },
    radioLines: {
        justifyContent: 'center',
    },
    radioLine: {
        width: 14,
        height: 3,
        backgroundColor: '#FFF',
        marginVertical: 2,
        borderRadius: 1,
    },

    // Read Aloud icon
    readAloudIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    magnifyIcon: {
        fontSize: 28,
        marginRight: 5,
    },
    bookIcon: {
        fontSize: 26,
    },

    // Speech bubble for Homophones
    speechBubble: {
        backgroundColor: '#40E0D0',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    questionMark: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
