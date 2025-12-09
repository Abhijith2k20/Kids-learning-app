import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // Add router
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import Svg, { Path } from 'react-native-svg';
import { Audio } from 'expo-av';
import { AlphabetSVG } from '../components/AlphabetSVG';
import { useDrawing } from '../hooks/useDrawing';
import { useTraceValidation } from '../hooks/useTraceValidation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Canvas dimensions - fixed aspect ratio 260:300 roughly
const CANVAS_WIDTH = width * 0.9;
const CANVAS_HEIGHT = CANVAS_WIDTH * (300 / 260); // Maintain aspect ratio of SVG viewBox

const ALPHABETS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const TraceScreen = () => {
    const router = useRouter();
    const addPoints = usePointsStore((state) => state.addPoints);
    const [showReward, setShowReward] = useState(false); // New state for reward popup

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false); // Track if current letter is done
    const [feedbackMsg, setFeedbackMsg] = useState('Trace the letter!');
    const [sound, setSound] = useState();

    const { paths, currentPath, onDrawingStart, onDrawingActive, onDrawingEnd: originalOnDrawingEnd, clearDrawing } = useDrawing();
    const { validateTrace } = useTraceValidation();

    // Animations
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const currentLetter = ALPHABETS[currentIndex];

    // Load saved progress
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const savedLetter = await AsyncStorage.getItem('lastTracedLetter');
                if (savedLetter) {
                    const index = ALPHABETS.indexOf(savedLetter);
                    if (index !== -1) {
                        setCurrentIndex(index);
                    }
                }
            } catch (error) {
                console.error('Failed to load progress', error);
            }
        };
        loadProgress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save progress helper
    const saveProgress = async (letter) => {
        try {
            await AsyncStorage.setItem('lastTracedLetter', letter);
        } catch (error) {
            console.error('Failed to save progress', error);
        }
    };

    // Load sound
    async function playSuccessSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://www.soundjay.com/buttons/sounds/button-3.mp3' }
            );
            setSound(sound);
            await sound.playAsync();
        } catch (error) {
            console.log('Error playing sound', error);
        }
    }

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); } : undefined;
    }, [sound]);

    // Validation wrapper
    const handleDrawingEnd = () => {
        originalOnDrawingEnd();

        // Validate after a short delay to allow state to update
        setTimeout(() => {
            // We need to access the LATEST paths. 
            // Since paths is from the hook, we might need to pass it explicitly or rely on the next render.
            // But here we are inside the closure. 
            // Let's rely on a useEffect to check validation whenever paths change.
        }, 50);
    };

    // Validate whenever paths change
    useEffect(() => {
        if (paths.length === 0) return;

        const { isValid, score } = validateTrace(currentLetter, paths, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

        if (isValid && !isCompleted) {
            setIsCompleted(true);
            setFeedbackMsg('Great Job! 🎉');
            playSuccessSound();
            animateSuccess();

            // Add points and show reward
            addPoints(10);
            setTimeout(() => setShowReward(true), 500);

        } else if (!isValid && paths.length > 0) {
            // Only show negative feedback if they have drawn a lot but failed
            if (score < 30 && paths.length > 2) {
                setFeedbackMsg('Try Again!');
                animateFailure();
            } else {
                setFeedbackMsg('Keep going...');
            }
        }
    }, [paths]);

    const animateSuccess = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 200,
                // useNativeDriver: true, // Remove native driver for scale if it causes issues, but usually fine.
                // Keeping original settings
                useNativeDriver: true,
                easing: Easing.bounce,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateFailure = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            resetState();
        }
    };

    const handleNext = async () => {
        if (currentIndex < ALPHABETS.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            resetState();
            await saveProgress(ALPHABETS[nextIndex]);
        }
    };

    const handleClear = () => {
        resetState();
    };

    const resetState = () => {
        clearDrawing();
        setIsCompleted(false);
        setFeedbackMsg('Trace the letter!');
        setShowReward(false); // Hide reward
        scaleAnim.setValue(1);
        shakeAnim.setValue(0);
    };

    const handleFinish = async () => {
        await saveProgress('A'); // Reset to A
        router.replace('/');
    };

    const handleRewardNext = () => {
        handleNext();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>


                    <PointsBadge />
                </View>

                <View style={styles.subHeader}>
                    <Text style={styles.title}>{feedbackMsg}</Text>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }}>
                        <Text style={[styles.letterDisplay, isCompleted && styles.letterSuccess]}>
                            {currentLetter}
                        </Text>
                    </Animated.View>
                </View>

                <RewardAnimation
                    visible={showReward}
                    onNext={currentIndex === ALPHABETS.length - 1 ? handleFinish : handleRewardNext}
                    message={currentIndex === ALPHABETS.length - 1 ? "All Letters Done!" : "Great Job!"}
                    buttonLabel={currentIndex === ALPHABETS.length - 1 ? "Go to Homepage" : "Next Letter ➡"}
                />

                {/* Drawing Area */}
                <View style={styles.drawingArea}>
                    <View style={styles.canvasContainer}>
                        {/* SVG Alphabet (underneath) */}
                        <View style={styles.alphabetContainer}>
                            <AlphabetSVG
                                letter={currentLetter}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                            />
                        </View>

                        {/* Transparent Drawing Canvas (on top) */}
                        <View
                            style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderGrant={onDrawingStart}
                            onResponderMove={onDrawingActive}
                            onResponderRelease={handleDrawingEnd}
                        >
                            <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                                {paths.map((pathItem, index) => (
                                    <Path
                                        key={index}
                                        d={pathItem.path}
                                        stroke={isCompleted ? "#4CAF50" : pathItem.color}
                                        strokeWidth={pathItem.strokeWidth}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                                {currentPath && (
                                    <Path
                                        d={currentPath}
                                        stroke="#FF6B6B"
                                        strokeWidth={12}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                            </Svg>
                        </View>
                    </View>
                </View>

                {/* Button Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.previousButton, currentIndex === 0 && styles.buttonDisabled]}
                        onPress={handlePrevious}
                        disabled={currentIndex === 0}
                    >
                        <Text style={styles.buttonText}>← Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.clearButton]}
                        onPress={handleClear}
                    >
                        <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF9E6',
        // Padding is handled by SafeAreaView automatically or we can add extra if needed
    },
    container: {
        flex: 1,
        backgroundColor: '#FFF9E6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    subHeader: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
    },
    backText: {
        fontSize: 18,
        color: '#2C3E50',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
    },
    letterDisplay: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF6B6B',
        backgroundColor: '#FFE66D',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 15,
        overflow: 'hidden',
    },
    letterSuccess: {
        backgroundColor: '#A8E6CF',
        color: '#2E7D32',
    },
    drawingArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    canvasContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alphabetContainer: {
        position: 'absolute',
    },
    canvas: {
        // Dimensions set dynamically
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 30,
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    previousButton: { backgroundColor: '#A8E6CF' },
    nextButton: { backgroundColor: '#FFD93D' },
    clearButton: { backgroundColor: '#FF6B6B' },
    buttonDisabled: { backgroundColor: '#D3D3D3', opacity: 0.5 },
    buttonText: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
});
