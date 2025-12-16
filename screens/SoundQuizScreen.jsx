import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Sample data - Full A-Z
const QUESTIONS = [
    { answer: 'A', options: ['A', 'F', 'H', 'B'] },
    { answer: 'B', options: ['E', 'B', 'M', 'D'] },
    { answer: 'C', options: ['O', 'C', 'Q', 'G'] },
    { answer: 'D', options: ['P', 'R', 'D', 'B'] },
    { answer: 'E', options: ['E', 'F', 'L', 'T'] },
    { answer: 'F', options: ['F', 'P', 'B', 'E'] },
    { answer: 'G', options: ['C', 'G', 'O', 'Q'] },
    { answer: 'H', options: ['H', 'K', 'N', 'M'] },
    { answer: 'I', options: ['I', 'L', 'T', 'J'] },
    { answer: 'J', options: ['J', 'I', 'L', 'U'] },
    { answer: 'K', options: ['K', 'X', 'Y', 'H'] },
    { answer: 'L', options: ['L', 'I', 'T', 'E'] },
    { answer: 'M', options: ['M', 'W', 'N', 'V'] },
    { answer: 'N', options: ['N', 'M', 'H', 'Z'] },
    { answer: 'O', options: ['O', 'C', 'Q', 'G'] },
    { answer: 'P', options: ['P', 'R', 'B', 'F'] },
    { answer: 'Q', options: ['Q', 'O', 'C', 'G'] },
    { answer: 'R', options: ['R', 'P', 'B', 'K'] },
    { answer: 'S', options: ['S', 'Z', 'X', 'C'] },
    { answer: 'T', options: ['T', 'I', 'L', 'F'] },
    { answer: 'U', options: ['U', 'V', 'W', 'J'] },
    { answer: 'V', options: ['V', 'U', 'W', 'M'] },
    { answer: 'W', options: ['W', 'M', 'V', 'N'] },
    { answer: 'X', options: ['X', 'K', 'Y', 'Z'] },
    { answer: 'Y', options: ['Y', 'X', 'V', 'I'] },
    { answer: 'Z', options: ['Z', 'S', 'N', 'M'] },
];

// Sticky note colors matching the homophones design
const STICKY_COLORS = [
    { bg: '#FFF59D', shadow: '#E6DC8D' }, // Yellow
    { bg: '#A5D6A7', shadow: '#8FC291' }, // Green
    { bg: '#F48FB1', shadow: '#DB7FA0' }, // Pink
    { bg: '#FFCC80', shadow: '#E6B770' }, // Orange
];

export const SoundQuizScreen = () => {
    const router = useRouter();
    const addPoints = usePointsStore((state) => state.addPoints);

    const [randomizedQuestions, setRandomizedQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
    const [wrongLetter, setWrongLetter] = useState(null); // Track wrong selection
    const [showReward, setShowReward] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Render horizontal lines for notebook effect
    const renderNotebookLines = () => {
        const lines = [];
        for (let i = 0; i < 35; i++) {
            lines.push(
                <View key={i} style={styles.notebookLine} />
            );
        }
        return lines;
    };

    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Initialize randomized questions on mount
    useEffect(() => {
        const initQuiz = async () => {
            try {
                // Shuffle questions and also shuffle options within each question
                const shuffledQuestions = shuffleArray(QUESTIONS).map(q => ({
                    ...q,
                    options: shuffleArray(q.options)
                }));
                setRandomizedQuestions(shuffledQuestions);
            } catch (error) {
                console.error('Failed to initialize quiz', error);
            } finally {
                setIsLoading(false);
            }
        };
        initQuiz();
    }, []);

    // Save progress helper
    const saveProgress = async (letter) => {
        try {
            await AsyncStorage.setItem('lastQuizLetter', letter);
        } catch (error) {
            console.error('Failed to save quiz progress', error);
        }
    };

    const currentQ = randomizedQuestions[currentQIndex];

    // Play letter sound using text-to-speech
    const playLetterSound = () => {
        // Stop any ongoing speech first
        Speech.stop();

        // Speak the letter
        Speech.speak(currentQ.answer, {
            language: 'en-US',
            rate: 0.7,
            pitch: 1.0,
        });
    };

    const handleOptionPress = (selectedLetter) => {
        if (feedback === 'correct') return; // Already answered correctly

        if (selectedLetter === currentQ.answer) {
            // Correct
            setFeedback('correct');
            setWrongLetter(null);
            // Game-like haptic celebration pattern
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            addPoints(10);
            setTimeout(() => {
                setShowReward(true);
            }, 500);
        } else {
            // Wrong - highlight the wrong selection
            setFeedback('wrong');
            setWrongLetter(selectedLetter);
        }
    };

    const handleNextLevel = async () => {
        setShowReward(false);
        setFeedback(null);
        setWrongLetter(null);
        if (currentQIndex < randomizedQuestions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            // Finished all questions, go home
            router.replace('/');
        }
    };

    const isLastQuestion = currentQIndex === randomizedQuestions.length - 1;

    if (isLoading) {
        return (
            <View style={styles.container}>
                {/* Notebook background */}
                <View style={styles.notebookBackground}>
                    {renderNotebookLines()}
                </View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Notebook background with lines */}
            <View style={styles.notebookBackground}>
                {renderNotebookLines()}
            </View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <PointsBadge />
            </View>

            {/* Title */}
            <Text style={styles.title}>Choose the Letter</Text>

            {/* Play Sound Button */}
            <TouchableOpacity
                onPress={playLetterSound}
                style={styles.playButton}
                activeOpacity={0.7}
            >
                <View style={styles.playIconContainer}>
                    <Text style={styles.playIcon}>▶</Text>
                </View>
            </TouchableOpacity>
            <Text style={styles.playText}>Play Sound</Text>

            {/* Options Grid */}
            <View style={styles.optionsContainer}>
                <View style={styles.optionsGrid}>
                    {currentQ.options.map((letter, index) => {
                        const isCorrect = feedback === 'correct' && letter === currentQ.answer;
                        const isWrong = wrongLetter === letter;
                        const colorScheme = STICKY_COLORS[index % STICKY_COLORS.length];

                        return (
                            <TouchableOpacity
                                key={letter}
                                style={[
                                    styles.stickyNote,
                                    { backgroundColor: colorScheme.bg },
                                    isCorrect && styles.correctCard,
                                    isWrong && styles.wrongCard,
                                ]}
                                onPress={() => handleOptionPress(letter)}
                                activeOpacity={0.7}
                                disabled={feedback === 'correct'}
                            >
                                {/* Folded corner effect */}
                                <View style={[styles.stickyFold, { borderBottomColor: colorScheme.shadow }]} />
                                <Text style={[
                                    styles.letterText,
                                    isCorrect && styles.correctLetterText,
                                    isWrong && styles.wrongLetterText,
                                ]}>
                                    {letter}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Try Again Message */}
            {feedback === 'wrong' && (
                <Text style={styles.tryAgain}>Try Again!</Text>
            )}

            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {currentQIndex + 1}/{QUESTIONS.length}
                </Text>
            </View>

            <RewardAnimation
                visible={showReward}
                onNext={handleNextLevel}
                message={isLastQuestion ? "Quiz Complete!" : "Correct!"}
                buttonLabel={isLastQuestion ? "Homepage" : "Next ➡"}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F4E8', // Cream/off-white paper color
    },
    notebookBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 100,
    },
    notebookLine: {
        height: 1,
        backgroundColor: '#B8D4E8',
        marginBottom: 26,
        marginLeft: 0,
        opacity: 0.7,
    },
    loadingText: {
        fontSize: 20,
        textAlign: 'center',
        marginTop: 100,
        color: '#2C3E50',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        marginBottom: 15,
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    backArrow: {
        fontSize: 20,
        color: '#5A8BC4',
        fontWeight: 'bold',
        marginRight: 4,
    },
    backText: {
        fontSize: 18,
        color: '#5A8BC4',
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#C41E3A', // Deep red color
        textAlign: 'center',
        marginBottom: 30,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    playButton: {
        alignSelf: 'center',
        marginBottom: 8,
    },
    playIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#7CC5E8',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#5AADE2',
        shadowColor: '#5AADE2',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 3,
    },
    playIcon: {
        fontSize: 28,
        color: '#2E6B8A',
        marginLeft: 4,
    },
    playText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '500',
    },
    optionsContainer: {
        flex: 1,
        paddingHorizontal: 25,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 20,
    },
    stickyNote: {
        width: (width - 70) / 2,
        aspectRatio: 1,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // Sticky note shadow
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    stickyFold: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: 18,
        borderTopColor: 'transparent',
        borderRightColor: '#F8F4E8', // Match background
        borderLeftColor: 'transparent',
    },
    correctCard: {
        backgroundColor: '#C8E6C9',
    },
    wrongCard: {
        backgroundColor: '#FFCDD2',
    },
    letterText: {
        fontSize: 60,
        fontWeight: '900',
        color: '#333',
    },
    correctLetterText: {
        color: '#2E7D32',
    },
    wrongLetterText: {
        color: '#C62828',
    },
    tryAgain: {
        fontSize: 20,
        color: '#D9534F',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
    progressContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
