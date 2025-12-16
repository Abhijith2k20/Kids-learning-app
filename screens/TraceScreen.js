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
import * as Haptics from 'expo-haptics';
import { AlphabetSVG } from '../components/AlphabetSVG';
import { useDrawing } from '../hooks/useDrawing';
import { useTraceValidation } from '../hooks/useTraceValidation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Canvas dimensions - fixed aspect ratio 260:300 roughly
const CANVAS_WIDTH = width * 0.85;
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
    const [feedbackMsg, setFeedbackMsg] = useState('Follow the outline ✏️');

    const { paths, currentPath, onDrawingStart, onDrawingActive, onDrawingEnd: originalOnDrawingEnd, clearDrawing } = useDrawing();
    const { validateTrace } = useTraceValidation();

    // Animations
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const currentLetter = ALPHABETS[currentIndex];

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
            // Game-like haptic celebration pattern
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
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
        setFeedbackMsg('Follow the outline ✏️');
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
                <Text style={styles.mainTitle}>Trace the letter!</Text>

                {/* Feedback Text */}
                <Animated.View style={[
                    styles.feedbackContainer,
                    { transform: [{ translateX: shakeAnim }] }
                ]}>
                    <Text style={[
                        styles.feedbackText,
                        isCompleted && styles.feedbackSuccess
                    ]}>
                        {feedbackMsg}
                    </Text>
                </Animated.View>

                <RewardAnimation
                    visible={showReward}
                    onNext={currentIndex === ALPHABETS.length - 1 ? handleFinish : handleRewardNext}
                    message={currentIndex === ALPHABETS.length - 1 ? "All Letters Done!" : "Great Job!"}
                    buttonLabel={currentIndex === ALPHABETS.length - 1 ? "Homepage" : "Next ➡"}
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
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F4E8', // Cream/off-white paper color
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F4E8',
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
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        zIndex: 20,
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
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#C41E3A', // Deep red color
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 15,
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    feedbackContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 15,
    },
    feedbackText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
    },
    feedbackSuccess: {
        color: '#2E7D32',
        fontSize: 20,
        fontWeight: 'bold',
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
        backgroundColor: '#FAF8F0',
        borderRadius: 10,
        padding: 10,
    },
    alphabetContainer: {
        position: 'absolute',
    },
    canvas: {
        // Dimensions set dynamically
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        gap: 15,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    previousButton: {
        backgroundColor: '#A8D8C8', // Mint/teal color
    },
    clearButton: {
        backgroundColor: '#E8726E', // Coral/salmon color
    },
    buttonDisabled: {
        backgroundColor: '#D3D3D3',
        opacity: 0.5
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
