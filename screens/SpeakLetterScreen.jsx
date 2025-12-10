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
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';

const { width } = Dimensions.get('window');

// All letters A-Z
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

    // Check if transcription matches the letter
    const checkLetterMatch = (transcription, letter) => {
        if (transcription === letter) return true;

        const phoneticMap = {
            'A': ['A', 'AY', 'EY'],
            'B': ['B', 'BE', 'BEE', 'BI'],
            'C': ['C', 'CE', 'SEE', 'SI', 'SEA'],
            'D': ['D', 'DE', 'DEE', 'DI'],
            'E': ['E', 'EE', 'I'],
            'F': ['F', 'EF', 'EFF'],
            'G': ['G', 'GE', 'GEE', 'JI', 'JEE'],
            'H': ['H', 'AITCH', 'AYCH', 'EICH'],
            'I': ['I', 'AI', 'AYE', 'EYE'],
            'J': ['J', 'JAY', 'JE'],
            'K': ['K', 'KAY', 'KE'],
            'L': ['L', 'EL', 'ELL'],
            'M': ['M', 'EM', 'EMM'],
            'N': ['N', 'EN', 'ENN'],
            'O': ['O', 'OH', 'OW'],
            'P': ['P', 'PE', 'PEE', 'PI'],
            'Q': ['Q', 'QU', 'CUE', 'KIU', 'KYU', 'QUEUE'],
            'R': ['R', 'AR', 'ARE'],
            'S': ['S', 'ES', 'ESS'],
            'T': ['T', 'TE', 'TEE', 'TI'],
            'U': ['U', 'YU', 'YOU', 'YOO'],
            'V': ['V', 'VE', 'VEE', 'VI'],
            'W': ['W', 'DOUBLE U', 'DOUBLE YOU', 'DOUBLEU', 'DOUBLEYOU'],
            'X': ['X', 'EX', 'EKS'],
            'Y': ['Y', 'WY', 'WAI', 'WHY'],
            'Z': ['Z', 'ZE', 'ZEE', 'ZED', 'ZI'],
        };

        const validSounds = phoneticMap[letter] || [letter];
        return validSounds.some(sound => transcription.includes(sound));
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
            router.back();
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#9C27B0" />
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

            {/* Main Content */}
            <View style={styles.content}>
                {/* Instruction */}
                <Text style={styles.instruction}>Say this letter!</Text>

                {/* Letter Display */}
                <Animated.View
                    style={[
                        styles.letterContainer,
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

                {/* Progress Indicator */}
                <Text style={styles.progress}>
                    Letter {currentLetterIndex + 1} of {LETTERS.length}
                </Text>

                {/* Microphone Button */}
                <View style={styles.micContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={[
                                styles.micButton,
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

            {/* Reward Animation */}
            <RewardAnimation
                visible={showReward}
                onNext={handleNextLetter}
                message={isLastLetter ? "All Letters Complete!" : "Great Pronunciation!"}
                buttonLabel={isLastLetter ? "Go to Homepage" : "Next Letter ➡"}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3E5F5',
        paddingTop: 50,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#7B1FA2',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    instruction: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#7B1FA2',
        marginBottom: 30,
        textAlign: 'center',
    },
    letterContainer: {
        width: width * 0.6,
        height: width * 0.6,
        backgroundColor: 'white',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20,
        borderWidth: 4,
        borderColor: '#CE93D8',
    },
    letterText: {
        fontSize: 150,
        fontWeight: 'bold',
        color: '#7B1FA2',
    },
    progress: {
        fontSize: 16,
        color: '#9C27B0',
        marginBottom: 30,
        fontWeight: '600',
    },
    micContainer: {
        alignItems: 'center',
    },
    micButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#9C27B0',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7B1FA2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    micButtonRecording: {
        backgroundColor: '#D32F2F',
    },
    micButtonProcessing: {
        backgroundColor: '#757575',
    },
    micIcon: {
        fontSize: 40,
    },
    micHint: {
        marginTop: 15,
        fontSize: 16,
        color: '#9C27B0',
        fontWeight: '500',
    },
    feedbackContainer: {
        marginTop: 30,
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
