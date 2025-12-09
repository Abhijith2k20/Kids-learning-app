import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router'; // Will be available once we setup expo-router
import { Audio } from 'expo-av';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import { audioPlayer } from '../utils/audioPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Sample data - in a real app this might come from a prop or API
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

    // Static map for audio assets
    const SOUND_MAP = {
        'A': require('../assets/sounds/A.mp3'),
        'B': require('../assets/sounds/B.mp3'),
        'C': require('../assets/sounds/C.mp3'),
        'D': require('../assets/sounds/D.mp3'),
        'E': require('../assets/sounds/E.mp3'),
        'F': require('../assets/sounds/F.mp3'),
        'G': require('../assets/sounds/G.mp3'),
        'H': require('../assets/sounds/H.mp3'),
        'I': require('../assets/sounds/I.mp3'),
        'J': require('../assets/sounds/J.mp3'),
        'K': require('../assets/sounds/K.mp3'),
        'L': require('../assets/sounds/L.mp3'),
        'M': require('../assets/sounds/M.mp3'),
        'N': require('../assets/sounds/N.mp3'),
        'O': require('../assets/sounds/O.mp3'),
        'P': require('../assets/sounds/P.mp3'),
        'Q': require('../assets/sounds/Q.mp3'),
        'R': require('../assets/sounds/R.mp3'),
        'S': require('../assets/sounds/S.mp3'),
        'T': require('../assets/sounds/T.mp3'),
        'U': require('../assets/sounds/U.mp3'),
        'V': require('../assets/sounds/V.mp3'),
        'W': require('../assets/sounds/W.mp3'),
        'X': require('../assets/sounds/X.mp3'),
        'Y': require('../assets/sounds/Y.mp3'),
        'Z': require('../assets/sounds/Z.mp3'),
    };

    const currentQ = QUESTIONS[currentQIndex];

    const playLetterSound = async () => {
        try {
            const soundFile = SOUND_MAP[currentQ.answer];
            if (soundFile) {
                const { sound } = await Audio.Sound.createAsync(soundFile);
                await sound.playAsync();
                console.log(`Playing sound for ${currentQ.answer}`);
            } else {
                console.warn(`Sound file for ${currentQ.answer} not found in map`);
            }
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    };

    const handleOptionPress = (selectedLetter) => {
        if (selectedLetter === currentQ.answer) {
            // Correct
            setFeedback('correct');
            // Play success sound
            // audioPlayer.play(require('../assets/sounds/success.mp3'));

            addPoints(10);
            setTimeout(() => {
                setShowReward(true);
            }, 500);
        } else {
            // Wrong
            setFeedback('wrong');
            // Play wrong sound
            // audioPlayer.play(require('../assets/sounds/wrong.mp3'));
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
            router.back();
        }
    };

    useEffect(() => {
        if (!isLoading) {
            playLetterSound();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQIndex, isLoading]);

    const isLastQuestion = currentQIndex === QUESTIONS.length - 1;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <PointsBadge />
            </View>

            <View style={styles.content}>
                <Text style={styles.instruction}>Listen and choose the correct letter!</Text>

                <TouchableOpacity onPress={playLetterSound} style={styles.soundButton}>
                    <Text style={styles.soundIcon}>🔊</Text>
                    <Text style={styles.soundText}>Play Sound</Text>
                </TouchableOpacity>

                <View style={styles.optionsGrid}>
                    {currentQ.options.map((letter) => (
                        <TouchableOpacity
                            key={letter}
                            style={[
                                styles.optionCard,
                                feedback === 'correct' && letter === currentQ.answer && styles.correctCard,
                                feedback === 'wrong' && letter !== currentQ.answer && styles.wrongCard // Simply highlight wrong if tapped? 
                                // Actually usually we only highlight the one tapped. But here we don't track tapped one unless state.
                            ]}
                            onPress={() => handleOptionPress(letter)}
                        >
                            <Text style={styles.letterText}>{letter}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {feedback === 'wrong' && <Text style={styles.tryAgain}>Try Again!</Text>}
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
        backgroundColor: '#E0F7FA',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        fontSize: 18,
        color: '#00695C',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    instruction: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00695C',
        marginBottom: 20,
        textAlign: 'center',
    },
    soundButton: {
        backgroundColor: '#26A69A',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
        marginBottom: 40,
        elevation: 5,
    },
    soundIcon: {
        fontSize: 24,
        marginRight: 10,
        color: 'white',
    },
    soundText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        gap: 15,
    },
    optionCard: {
        width: '47%',
        aspectRatio: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 3,
        borderColor: 'transparent', // Prevent layout jump
    },
    correctCard: {
        backgroundColor: '#66BB6A',
        borderColor: '#2E7D32',
        // borderWidth: 3, // Already set in base
    },
    wrongCard: {
        // Logic to track specific wrong card omitted for simplicity in this demo structure
    },
    letterText: {
        fontSize: 60,
        lineHeight: 60, // Match font size exactly
        fontWeight: 'bold',
        color: '#37474F',
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        // Visual tweak: Move up slightly to account for font baseline
        marginTop: -6,
        paddingBottom: 0,
    },
    tryAgain: {
        marginTop: 20,
        fontSize: 22,
        color: '#D32F2F',
        fontWeight: 'bold',
    }
});
