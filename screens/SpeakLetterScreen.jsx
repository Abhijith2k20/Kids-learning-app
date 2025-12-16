import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    useAudioRecorder,
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorderState
} from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';

const { width, height } = Dimensions.get('window');

// All letters A-Z
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Sticky note colors matching the homophones design
const STICKY_COLORS = [
    { bg: '#FFF59D', shadow: '#E6DC8D' }, // Yellow
    { bg: '#A5D6A7', shadow: '#8FC291' }, // Green
    { bg: '#F48FB1', shadow: '#DB7FA0' }, // Pink
    { bg: '#FFCC80', shadow: '#E6B770' }, // Orange
];

// AssemblyAI API Key - loaded from environment variable
const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';

export const SpeakLetterScreen = () => {
    const router = useRouter();
    const addPoints = usePointsStore((state) => state.addPoints);

    // State
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showReward, setShowReward] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Audio recorder using new expo-audio hook
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const successScaleAnim = useRef(new Animated.Value(1)).current;
    const feedbackOpacity = useRef(new Animated.Value(0)).current;

    const currentLetter = LETTERS[currentLetterIndex];
    const isLastLetter = currentLetterIndex === LETTERS.length - 1;

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

    // Load saved progress and request permissions
    useEffect(() => {
        const initialize = async () => {
            try {
                // Load progress
                const savedLetter = await AsyncStorage.getItem('lastSpeakLetter');
                if (savedLetter) {
                    const index = LETTERS.indexOf(savedLetter);
                    if (index !== -1) {
                        setCurrentLetterIndex(index);
                    }
                }

                // Request permissions
                const status = await AudioModule.requestRecordingPermissionsAsync();
                setPermissionGranted(status.granted);

                if (!status.granted) {
                    Alert.alert(
                        'Permission Required',
                        'Microphone access is needed for this activity. Please enable it in settings.',
                        [{ text: 'OK' }]
                    );
                }

                // Configure audio mode
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    allowsRecording: true,
                });
            } catch (error) {
                console.warn('Failed to initialize:', error.message);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);

    // Handle pulse animation when recording
    useEffect(() => {
        if (recorderState.isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [recorderState.isRecording, pulseAnim]);

    // Save progress
    const saveProgress = async (letter) => {
        try {
            await AsyncStorage.setItem('lastSpeakLetter', letter);
        } catch (error) {
            console.warn('Failed to save speak progress:', error.message);
        }
    };

    // Start recording
    const startRecording = async () => {
        if (!permissionGranted) {
            Alert.alert('Permission Required', 'Please grant microphone access to use this feature.');
            return;
        }

        if (recorderState.isRecording || isProcessing) {
            return;
        }

        try {
            // Reset feedback
            setFeedback(null);
            feedbackOpacity.setValue(0);

            // Prepare and start recording
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
        } catch (error) {
            console.warn('Failed to start recording:', error.message);
            showErrorFeedback();
        }
    };

    // Stop recording and process
    const stopRecording = async () => {
        if (!recorderState.isRecording) {
            return;
        }

        try {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            if (uri) {
                setIsProcessing(true);
                await processAudio(uri);
            } else {
                console.warn('No recording URI available');
                showErrorFeedback();
            }
        } catch (error) {
            console.warn('Failed to stop recording:', error.message);
            showErrorFeedback();
            setIsProcessing(false);
        }
    };

    // Process audio with AssemblyAI
    const processAudio = async (uri) => {
        try {
            const uploadResponse = await uploadAudio(uri);

            if (!uploadResponse) {
                throw new Error('Failed to upload audio');
            }

            const transcriptId = await requestTranscription(uploadResponse);

            if (!transcriptId) {
                throw new Error('Failed to request transcription');
            }

            const transcription = await pollTranscription(transcriptId);
            validatePronunciation(transcription);
        } catch (error) {
            console.warn('Error processing audio:', error.message);
            setIsProcessing(false);
            showErrorFeedback();
        }
    };

    // Upload audio file to AssemblyAI
    const uploadAudio = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    'Authorization': ASSEMBLYAI_API_KEY,
                    'Content-Type': 'application/octet-stream',
                },
                body: blob,
            });

            const data = await uploadRes.json();
            return data.upload_url;
        } catch (error) {
            console.warn('Upload error:', error.message);
            return null;
        }
    };

    // Request transcription from AssemblyAI
    const requestTranscription = async (audioUrl) => {
        try {
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    'Authorization': ASSEMBLYAI_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    language_code: 'en',
                }),
            });

            const data = await response.json();
            return data.id;
        } catch (error) {
            console.warn('Transcription request error:', error.message);
            return null;
        }
    };

    // Poll for transcription result
    const pollTranscription = async (transcriptId) => {
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(
                    `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                    {
                        headers: {
                            'Authorization': ASSEMBLYAI_API_KEY,
                        },
                    }
                );

                const data = await response.json();

                if (data.status === 'completed') {
                    return data.text || '';
                } else if (data.status === 'error') {
                    throw new Error('Transcription failed');
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            } catch (error) {
                console.warn('Polling error:', error.message);
                throw error;
            }
        }

        throw new Error('Transcription timeout');
    };

    // Validate pronunciation against current letter
    const validatePronunciation = (transcription) => {
        setIsProcessing(false);

        if (!transcription) {
            showErrorFeedback();
            return;
        }

        const normalized = transcription.toUpperCase().trim();
        const isMatch = checkLetterMatch(normalized, currentLetter);

        if (isMatch) {
            showSuccessFeedback();
        } else {
            showErrorFeedback();
        }
    };

    // ==========================================
    // SPEECH-TO-LETTER MATCHING LOGIC
    // ==========================================

    // Levenshtein distance algorithm for fuzzy matching
    const levenshteinDistance = (str1, str2) => {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],     // deletion
                        dp[i][j - 1],     // insertion
                        dp[i - 1][j - 1]  // substitution
                    );
                }
            }
        }
        return dp[m][n];
    };

    // Normalize speech - clean and standardize transcription
    const normalizeSpeech = (text) => {
        if (!text) return '';

        let normalized = text
            .toUpperCase()
            .trim()
            // Remove punctuation and special characters
            .replace(/[.,!?'";:()\-]/g, '')
            // Remove extra spaces
            .replace(/\s+/g, ' ')
            .trim();

        // Common phonetic conversions (multi-word to single)
        const conversions = {
            'DOUBLE U': 'W',
            'DOUBLE YOU': 'W',
            'DOUBLEYOU': 'W',
            'DOUBLEU': 'W',
        };

        for (const [from, to] of Object.entries(conversions)) {
            normalized = normalized.replace(new RegExp(from, 'g'), to);
        }

        // Strip trailing vowel sounds for common letter pronunciations
        // CEE -> C, BEE -> B, DEE -> D, etc.
        const trailingVowelPatterns = [
            { pattern: /^([BCDFGPTVZ])EE$/, replace: '$1' },
            { pattern: /^([BCDFGPTVZ])E$/, replace: '$1' },
            { pattern: /^([BCDFGPTVZ])I$/, replace: '$1' },
            { pattern: /^E([FLMNSXY])$/, replace: '$1' },  // EF -> F, EL -> L, etc.
            { pattern: /^A([RY])$/, replace: '$1' },       // AR -> R, AY -> A (careful)
        ];

        // Only apply if it results in a single letter
        for (const { pattern, replace } of trailingVowelPatterns) {
            const result = normalized.replace(pattern, replace);
            if (result.length === 1 && /^[A-Z]$/.test(result)) {
                normalized = result;
                break;
            }
        }

        return normalized;
    };

    // Enhanced phonetic map with extensive variations
    const phoneticMap = {
        'A': ['A', 'AY', 'EY', 'EI', 'AE', 'AH', 'LETTER A', 'THE LETTER A'],
        'B': ['B', 'BE', 'BEE', 'BI', 'BEA', 'BEE BEE', 'LETTER B', 'THE LETTER B'],
        'C': ['C', 'CE', 'SEE', 'SEA', 'SI', 'CEE', 'THE SEA', 'LETTER C', 'THE LETTER C'],
        'D': ['D', 'DE', 'DEE', 'DI', 'DEA', 'LETTER D', 'THE LETTER D'],
        'E': ['E', 'EE', 'EA', 'LETTER E', 'THE LETTER E'],
        'F': ['F', 'EF', 'EFF', 'IEFF', 'LETTER F', 'THE LETTER F'],
        'G': ['G', 'GE', 'GEE', 'JI', 'JEE', 'JE', 'GI', 'GEA', 'LETTER G', 'THE LETTER G'],
        'H': ['H', 'AITCH', 'AYCH', 'EICH', 'EITCH', 'ETCH', 'ACH', 'HAITCH', 'LETTER H', 'THE LETTER H'],
        'I': ['I', 'AI', 'AYE', 'EYE', 'AY', 'EI', 'LETTER I', 'THE LETTER I'],
        'J': ['J', 'JAY', 'JE', 'JA', 'JAE', 'GEY', 'LETTER J', 'THE LETTER J'],
        'K': ['K', 'KAY', 'KE', 'KA', 'KAE', 'CAY', 'LETTER K', 'THE LETTER K'],
        'L': ['L', 'EL', 'ELL', 'AL', 'ELLE', 'LETTER L', 'THE LETTER L'],
        'M': ['M', 'EM', 'EMM', 'AM', 'LETTER M', 'THE LETTER M'],
        'N': ['N', 'EN', 'ENN', 'AN', 'LETTER N', 'THE LETTER N'],
        'O': ['O', 'OH', 'OW', 'OE', 'OOH', 'LETTER O', 'THE LETTER O'],
        'P': ['P', 'PE', 'PEE', 'PI', 'PEA', 'LETTER P', 'THE LETTER P'],
        'Q': ['Q', 'QU', 'CUE', 'KIU', 'KYU', 'QUEUE', 'CU', 'KEW', 'LETTER Q', 'THE LETTER Q'],
        'R': ['R', 'AR', 'ARE', 'ER', 'OR', 'AHR', 'LETTER R', 'THE LETTER R'],
        'S': ['S', 'ES', 'ESS', 'AS', 'LETTER S', 'THE LETTER S'],
        'T': ['T', 'TE', 'TEE', 'TI', 'TEA', 'LETTER T', 'THE LETTER T'],
        'U': ['U', 'YU', 'YOU', 'YOO', 'EW', 'OO', 'LETTER U', 'THE LETTER U'],
        'V': ['V', 'VE', 'VEE', 'VI', 'VEA', 'WE', 'LETTER V', 'THE LETTER V'],
        'W': ['W', 'DOUBLE U', 'DOUBLE YOU', 'DOUBLEU', 'DOUBLEYOU', 'DOUBLE', 'LETTER W', 'THE LETTER W'],
        'X': ['X', 'EX', 'EKS', 'ECS', 'EGS', 'ECKS', 'AX', 'LETTER X', 'THE LETTER X'],
        'Y': ['Y', 'WY', 'WAI', 'WHY', 'WI', 'YEE', 'LETTER Y', 'THE LETTER Y'],
        'Z': ['Z', 'ZE', 'ZEE', 'ZED', 'ZI', 'ZEA', 'ZET', 'LETTER Z', 'THE LETTER Z'],
    };

    // Check if transcription matches the letter
    const checkLetterMatch = (transcription, letter) => {
        // Normalize the transcription
        const normalized = normalizeSpeech(transcription);

        if (!normalized) return false;

        // 1. Exact match after normalization
        if (normalized === letter) return true;

        // 2. Check phonetic map (exact match in variations)
        const validSounds = phoneticMap[letter] || [letter];
        if (validSounds.includes(normalized)) return true;

        // 3. Check if normalized contains any valid sound
        for (const sound of validSounds) {
            // For single letters, require exact or very close match
            if (sound.length === 1) {
                if (normalized === sound) return true;
            } else {
                // For multi-character sounds, check contains
                if (normalized.includes(sound) || sound.includes(normalized)) {
                    return true;
                }
            }
        }

        // 4. Levenshtein distance check for fuzzy matching
        // Allow 1 edit distance for short sounds, 2 for longer ones
        for (const sound of validSounds) {
            if (sound.length <= 2) continue; // Skip single/double char for Levenshtein

            const distance = levenshteinDistance(normalized, sound);
            const threshold = sound.length <= 3 ? 1 : 2;

            if (distance <= threshold) {
                return true;
            }
        }

        // 5. Check if the letter itself appears as a word in the transcription
        const words = normalized.split(' ');
        if (words.includes(letter)) return true;

        // 6. First letter match for very short transcriptions
        if (normalized.length >= 1 && normalized.length <= 2) {
            if (normalized[0] === letter) return true;
        }

        return false;
    };

    // Show success feedback
    const showSuccessFeedback = () => {
        setFeedback('correct');

        Animated.sequence([
            Animated.timing(successScaleAnim, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(successScaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Game-like haptic celebration pattern
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        addPoints(10);

        setTimeout(() => {
            setShowReward(true);
        }, 800);
    };

    // Show error feedback
    const showErrorFeedback = () => {
        setFeedback('wrong');

        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.timing(feedbackOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setFeedback(null);
            });
        }, 2000);
    };

    // Handle next letter
    const handleNextLetter = async () => {
        setShowReward(false);
        setFeedback(null);
        feedbackOpacity.setValue(0);

        if (currentLetterIndex < LETTERS.length - 1) {
            const nextIndex = currentLetterIndex + 1;
            setCurrentLetterIndex(nextIndex);
            await saveProgress(LETTERS[nextIndex]);
        } else {
            await saveProgress('A');
            router.replace('/');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                {/* Notebook background */}
                <View style={styles.notebookBackground}>
                    {renderNotebookLines()}
                </View>
                <ActivityIndicator size="large" color="#7B5BA6" />
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

            {/* Main Content */}
            <View style={styles.content}>
                {/* Instruction */}
                <Text style={styles.instruction}>Say this letter!  </Text>

                {/* Letter Display - Sticky note card */}
                <Animated.View
                    style={[
                        styles.letterCard,
                        { backgroundColor: STICKY_COLORS[currentLetterIndex % STICKY_COLORS.length].bg },
                        {
                            transform: [
                                { scale: successScaleAnim },
                                { translateX: shakeAnim }
                            ]
                        }
                    ]}
                >
                    <Text style={styles.letterText}>{currentLetter}</Text>
                </Animated.View>

                {/* Microphone Button */}
                <View style={styles.micContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={[
                                styles.micButton,
                                { backgroundColor: STICKY_COLORS[currentLetterIndex % STICKY_COLORS.length].shadow },
                                recorderState.isRecording && styles.micButtonRecording,
                                isProcessing && styles.micButtonProcessing,
                            ]}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                            disabled={isProcessing}
                            activeOpacity={0.8}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <Text style={styles.micIcon}>🎤</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <Text style={styles.micHint}>
                        {isProcessing
                            ? 'Processing...'
                            : recorderState.isRecording
                                ? 'Release when done'
                                : 'Press and hold to speak'}
                    </Text>
                </View>

                {/* Feedback */}
                <Animated.View style={[styles.feedbackContainer, { opacity: feedbackOpacity }]}>
                    {feedback === 'correct' && (
                        <View style={styles.feedbackCorrect}>
                            <Text style={styles.feedbackIcon}>✅</Text>
                            <Text style={styles.feedbackTextCorrect}>Perfect!</Text>
                        </View>
                    )}
                    {feedback === 'wrong' && (
                        <View style={styles.feedbackWrong}>
                            <Text style={styles.feedbackIcon}>❌</Text>
                            <Text style={styles.feedbackTextWrong}>Try again!</Text>
                        </View>
                    )}
                </Animated.View>
            </View>

            {/* Progress - at bottom */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {currentLetterIndex + 1}/{LETTERS.length}
                </Text>
            </View>

            {/* Reward Animation */}
            <RewardAnimation
                visible={showReward}
                onNext={handleNextLetter}
                message={isLastLetter ? "All Letters Complete!" : "Great Job!"}
                buttonLabel={isLastLetter ? "Homepage" : "Next ➡"}
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        marginBottom: 10,
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
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    instruction: {
        fontSize: 32,
        fontWeight: '800',
        color: '#C41E3A', // Deep red color
        marginBottom: 25,
        textAlign: 'center',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    letterCard: {
        width: width * 0.65,
        height: width * 0.65,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        // Sticky note shadow
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    letterText: {
        fontSize: 140,
        fontWeight: '900',
        color: '#333',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
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
    micContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    micButtonRecording: {
        backgroundColor: '#D32F2F',
    },
    micButtonProcessing: {
        backgroundColor: '#757575',
    },
    micIcon: {
        fontSize: 36,
    },
    micHint: {
        marginTop: 12,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    feedbackContainer: {
        marginTop: 25,
        alignItems: 'center',
    },
    feedbackCorrect: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    feedbackWrong: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    feedbackIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    feedbackTextCorrect: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    feedbackTextWrong: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#C62828',
    },
});
