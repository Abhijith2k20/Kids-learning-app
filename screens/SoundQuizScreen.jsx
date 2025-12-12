import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const SoundQuizScreen = () => {
    const router = useRouter();
    const addPoints = usePointsStore((state) => state.addPoints);

    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
    const [wrongLetter, setWrongLetter] = useState(null); // Track wrong selection
    const [showReward, setShowReward] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved progress
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const savedLetter = await AsyncStorage.getItem('lastQuizLetter');
                if (savedLetter) {
                    const index = QUESTIONS.findIndex(q => q.answer === savedLetter);
                    if (index !== -1) {
                        setCurrentQIndex(index);
                    }
                }
            } catch (error) {
                console.error('Failed to load quiz progress', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProgress();
    }, []);

    // Save progress helper
    const saveProgress = async (letter) => {
        try {
            await AsyncStorage.setItem('lastQuizLetter', letter);
        } catch (error) {
            console.error('Failed to save quiz progress', error);
        }
    };

    const currentQ = QUESTIONS[currentQIndex];

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
        if (currentQIndex < QUESTIONS.length - 1) {
            const nextIndex = currentQIndex + 1;
            setCurrentQIndex(nextIndex);
            await saveProgress(QUESTIONS[nextIndex].answer);
        } else {
            // Finished all questions, reset to A
            await saveProgress('A');
        }
    };

    const isLastQuestion = currentQIndex === QUESTIONS.length - 1;

    // Border colors for the 4 option cards
    const CARD_COLORS = ['#4A90D9', '#5CB85C', '#F0AD4E', '#D9534F'];

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
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
                        const borderColor = CARD_COLORS[index % CARD_COLORS.length];

                        return (
                            <TouchableOpacity
                                key={letter}
                                style={[
                                    styles.optionCard,
                                    { borderColor: borderColor },
                                    isCorrect && styles.correctCard,
                                    isWrong && styles.wrongCard,
                                ]}
                                onPress={() => handleOptionPress(letter)}
                                activeOpacity={0.7}
                                disabled={feedback === 'correct'}
                            >
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
                buttonLabel={isLastQuestion ? "Go to Homepage" : "Next Letter ➡"}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingTop: 55,
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
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        fontSize: 18,
        color: '#2C3E50',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 40,
    },
    playButton: {
        alignSelf: 'center',
        marginBottom: 10,
    },
    playIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#4A90D9',
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playIcon: {
        fontSize: 32,
        color: '#4A90D9',
        marginLeft: 5,
    },
    playText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    optionsContainer: {
        flex: 1,
        paddingHorizontal: 30,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 20,
    },
    optionCard: {
        width: (width - 80) / 2,
        aspectRatio: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    correctCard: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    wrongCard: {
        backgroundColor: '#FFEBEE',
        borderColor: '#D9534F',
    },
    letterText: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#37474F',
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
        paddingVertical: 25,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
});

