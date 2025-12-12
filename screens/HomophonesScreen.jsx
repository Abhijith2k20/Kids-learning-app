import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line } from 'react-native-svg';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import {
    HOMOPHONES_EXERCISES,
    HOMOPHONES_PROGRESS_KEY,
} from '../data/homophones/homophonesData';

const { width, height } = Dimensions.get('window');
const PILL_WIDTH = width * 0.42;
const PILL_HEIGHT = 55;
const VERTICAL_GAP = 18;
const CONNECTION_THRESHOLD = 120;
const BORDER_RADIUS = PILL_HEIGHT / 2;

// Theme colors matching other templates
const LEFT_COLORS = ['#FF6B6B', '#A8E6CF', '#FFD93D', '#FF6B6B'];
const RIGHT_COLORS = ['#A8E6CF', '#FFD93D', '#FF6B6B', '#A8E6CF'];

export const HomophonesScreen = () => {
    const router = useRouter();
    const addPoints = usePointsStore((state) => state.addPoints);

    const [currentExercise, setCurrentExercise] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [connections, setConnections] = useState([]);
    const [activeLineEnd, setActiveLineEnd] = useState(null);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [shuffledRightItems, setShuffledRightItems] = useState([]);
    const [pillPositions, setPillPositions] = useState({ left: [], right: [] });

    const gameContainerRef = useRef(null);
    const leftPillRefs = useRef([]);
    const rightPillRefs = useRef([]);
    const containerOffsetRef = useRef({ x: 0, y: 0 });

    const pillPositionsRef = useRef({ left: [], right: [] });
    const connectionsRef = useRef([]);
    const matchedPairsRef = useRef([]);
    const shuffledRightItemsRef = useRef([]);

    useEffect(() => { pillPositionsRef.current = pillPositions; }, [pillPositions]);
    useEffect(() => { connectionsRef.current = connections; }, [connections]);
    useEffect(() => { matchedPairsRef.current = matchedPairs; }, [matchedPairs]);
    useEffect(() => { shuffledRightItemsRef.current = shuffledRightItems; }, [shuffledRightItems]);

    const pairs = HOMOPHONES_EXERCISES[currentExercise]?.pairs || [];
    const pairsLengthRef = useRef(pairs.length);
    useEffect(() => { pairsLengthRef.current = pairs.length; }, [pairs.length]);

    useEffect(() => {
        if (pairs.length > 0) {
            // Reset state for new exercise
            setConnections([]);
            setMatchedPairs([]);
            setActiveLineEnd(null);

            // Create items with original index
            const items = pairs.map((pair, index) => ({ ...pair, originalIndex: index }));

            // Fisher-Yates shuffle
            const shuffled = [...items];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Ensure no item is in its original position (derangement)
            // Check and fix any items that are in their original position
            for (let i = 0; i < shuffled.length; i++) {
                if (shuffled[i].originalIndex === i) {
                    // Find another position to swap with
                    let swapIndex = (i + 1) % shuffled.length;
                    // Make sure swap doesn't create another fixed point
                    while (shuffled[swapIndex].originalIndex === i) {
                        swapIndex = (swapIndex + 1) % shuffled.length;
                    }
                    [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
                }
            }

            setShuffledRightItems(shuffled);
            setPillPositions({ left: [], right: [] });
            leftPillRefs.current = [];
            rightPillRefs.current = [];
        }
    }, [currentExercise]);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const saved = await AsyncStorage.getItem(HOMOPHONES_PROGRESS_KEY);
                if (saved !== null) {
                    const p = parseInt(saved, 10);
                    if (p >= HOMOPHONES_EXERCISES.length) {
                        setCurrentExercise(0);
                        await AsyncStorage.setItem(HOMOPHONES_PROGRESS_KEY, '0');
                    } else {
                        setCurrentExercise(p);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadProgress();
    }, []);

    const measurePills = useCallback(() => {
        if (!gameContainerRef.current) return;

        gameContainerRef.current.measure((x, y, w, h, pageX, pageY) => {
            containerOffsetRef.current = { x: pageX, y: pageY };
            const newLeft = [];
            const newRight = [];
            let pending = 0;

            leftPillRefs.current.forEach(r => { if (r) pending++; });
            rightPillRefs.current.forEach(r => { if (r) pending++; });
            if (pending === 0) return;

            let completed = 0;
            const check = () => {
                completed++;
                if (completed === pending) {
                    const pos = { left: newLeft, right: newRight };
                    setPillPositions(pos);
                    pillPositionsRef.current = pos;
                }
            };

            // Left pills: Connect from RIGHT edge (the rounded part)
            leftPillRefs.current.forEach((ref, i) => {
                if (ref) {
                    ref.measure((dx, dy, dw, dh, dpx, dpy) => {
                        newLeft[i] = {
                            x: dpx - pageX + dw,
                            y: dpy - pageY + dh / 2,
                            pageX: dpx + dw,
                            pageY: dpy + dh / 2,
                        };
                        check();
                    });
                }
            });

            // Right pills: Connect from LEFT edge (the rounded part)
            rightPillRefs.current.forEach((ref, i) => {
                if (ref) {
                    ref.measure((dx, dy, dw, dh, dpx, dpy) => {
                        newRight[i] = {
                            x: dpx - pageX,
                            y: dpy - pageY + dh / 2,
                            pageX: dpx,
                            pageY: dpy + dh / 2,
                        };
                        check();
                    });
                }
            });
        });
    }, []);

    useEffect(() => {
        if (shuffledRightItems.length > 0) {
            const t = setTimeout(measurePills, 300);
            return () => clearTimeout(t);
        }
    }, [shuffledRightItems, measurePills]);

    // Speak word using text-to-speech
    const speakWord = (word) => {
        Speech.speak(word, {
            language: 'en-US',
            rate: 0.8,
            pitch: 1.0,
        });
    };

    const findNearestRightPill = (tx, ty) => {
        let nearest = -1;
        let minDst = CONNECTION_THRESHOLD;
        pillPositionsRef.current.right.forEach((pos, i) => {
            if (!pos) return;
            const d = Math.sqrt(Math.pow(tx - pos.pageX, 2) + Math.pow(ty - pos.pageY, 2));
            if (d < minDst) {
                minDst = d;
                nearest = i;
            }
        });
        return nearest;
    };

    const handleConnectionComplete = (leftIdx, rightIdx) => {
        const rightItem = shuffledRightItemsRef.current[rightIdx];
        const isCorrect = rightItem?.originalIndex === leftIdx;

        if (isCorrect) {
            setMatchedPairs(prev => {
                const updated = [...prev, leftIdx];
                if (updated.length === pairsLengthRef.current) {
                    setTimeout(() => setShowReward(true), 500);
                }
                return updated;
            });
            setConnections(prev => [...prev, { leftIndex: leftIdx, rightIndex: rightIdx, correct: true }]);
            addPoints(10);
        } else {
            setConnections(prev => [...prev, { leftIndex: leftIdx, rightIndex: rightIdx, correct: false }]);
            setTimeout(() => {
                setConnections(prev => prev.filter(c => !(c.leftIndex === leftIdx && c.rightIndex === rightIdx)));
            }, 500);
        }
    };

    const createPan = (leftIdx) => {
        let startX = 0;
        let startY = 0;
        let hasDragged = false;
        const MIN_DRAG_DISTANCE = 20;

        return PanResponder.create({
            // Only set responder after movement detected (allows taps to pass through)
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (e, gestureState) => {
                if (matchedPairsRef.current.includes(leftIdx)) return false;
                // Only capture if there's significant movement
                const distance = Math.sqrt(Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2));
                return distance > 10;
            },
            onPanResponderGrant: (e) => {
                const { pageX, pageY } = e.nativeEvent;
                startX = pageX;
                startY = pageY;
                hasDragged = true;
                setActiveLineEnd({
                    leftIndex: leftIdx,
                    x: pageX - containerOffsetRef.current.x,
                    y: pageY - containerOffsetRef.current.y
                });
            },
            onPanResponderMove: (e) => {
                const { pageX, pageY } = e.nativeEvent;
                setActiveLineEnd({
                    leftIndex: leftIdx,
                    x: pageX - containerOffsetRef.current.x,
                    y: pageY - containerOffsetRef.current.y
                });
            },
            onPanResponderRelease: (e) => {
                const { pageX, pageY } = e.nativeEvent;
                if (hasDragged) {
                    const rightIdx = findNearestRightPill(pageX, pageY);
                    if (rightIdx !== -1) {
                        const exists = connectionsRef.current.some(c => c.rightIndex === rightIdx && c.correct);
                        if (!exists) handleConnectionComplete(leftIdx, rightIdx);
                    }
                }
                setActiveLineEnd(null);
                hasDragged = false;
            },
            onPanResponderTerminate: () => {
                setActiveLineEnd(null);
                hasDragged = false;
            },
        });
    };

    const pans = useRef({});
    const getPan = (i) => {
        const k = `${currentExercise}-${i}`;
        if (!pans.current[k]) pans.current[k] = createPan(i);
        return pans.current[k];
    };
    useEffect(() => { pans.current = {}; }, [currentExercise]);

    const handleNext = async () => {
        setShowReward(false);
        setConnections([]);
        setMatchedPairs([]);
        const next = currentExercise + 1;
        if (next < HOMOPHONES_EXERCISES.length) {
            setCurrentExercise(next);
            await AsyncStorage.setItem(HOMOPHONES_PROGRESS_KEY, next.toString());
        } else {
            await AsyncStorage.setItem(HOMOPHONES_PROGRESS_KEY, '0');
            router.back();
        }
    };

    const isLastExercise = currentExercise === HOMOPHONES_EXERCISES.length - 1;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
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

            {/* Instruction */}
            <View style={styles.subHeader}>
                <Text style={styles.title}>Match the Homophones!</Text>
                <Text style={styles.subtitle}>Tap to hear • Drag to connect matching words</Text>
            </View>

            {/* Game Container */}
            <View
                style={styles.gameContainer}
                ref={gameContainerRef}
                onLayout={measurePills}
            >
                {/* SVG for connection lines */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    {connections
                        .filter(c => c.correct)
                        .map((c) => {
                            const l = pillPositions.left[c.leftIndex];
                            const r = pillPositions.right[c.rightIndex];
                            if (!l || !r) return null;
                            return (
                                <Line
                                    key={`${c.leftIndex}-${c.rightIndex}`}
                                    x1={l.x}
                                    y1={l.y}
                                    x2={r.x}
                                    y2={r.y}
                                    stroke="#2C3E50"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    {activeLineEnd && pillPositions.left[activeLineEnd.leftIndex] && (
                        <Line
                            x1={pillPositions.left[activeLineEnd.leftIndex].x}
                            y1={pillPositions.left[activeLineEnd.leftIndex].y}
                            x2={activeLineEnd.x}
                            y2={activeLineEnd.y}
                            stroke="#2C3E50"
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                    )}
                </Svg>

                {/* Left Column - Pills with flat left edge, round right edge */}
                <View style={styles.leftColumn}>
                    {pairs.map((p, i) => {
                        const color = LEFT_COLORS[i % LEFT_COLORS.length];
                        const matched = matchedPairs.includes(i);
                        return (
                            <View
                                key={`left-${i}`}
                                ref={r => leftPillRefs.current[i] = r}
                                style={[
                                    styles.pill,
                                    styles.leftPill,
                                    { backgroundColor: color },
                                    matched && styles.matchedPill,
                                ]}
                                {...getPan(i).panHandlers}
                            >
                                <TouchableOpacity
                                    onPress={() => speakWord(p.leftWord)}
                                    style={styles.pillTouchable}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.pillText}>{p.leftWord}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Right Column - Pills with round left edge, flat right edge */}
                <View style={styles.rightColumn}>
                    {shuffledRightItems.map((p, i) => {
                        const color = RIGHT_COLORS[i % RIGHT_COLORS.length];
                        const matched = matchedPairs.includes(p.originalIndex);
                        return (
                            <TouchableOpacity
                                key={`right-${i}`}
                                ref={r => rightPillRefs.current[i] = r}
                                style={[
                                    styles.pill,
                                    styles.rightPill,
                                    { backgroundColor: color },
                                    matched && styles.matchedPill,
                                ]}
                                onPress={() => speakWord(p.rightWord)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.pillText}>{p.rightWord}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {currentExercise + 1}/{HOMOPHONES_EXERCISES.length}
                </Text>
            </View>

            <RewardAnimation
                visible={showReward}
                onNext={handleNext}
                message={isLastExercise ? 'All Done!' : 'Great Job!'}
                buttonLabel={isLastExercise ? 'Go to Homepage' : 'Next ➡'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9E6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
    },
    loadingText: {
        fontSize: 20,
        color: '#2C3E50',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 55,
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
    subHeader: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    gameContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
    },
    leftColumn: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    pill: {
        width: PILL_WIDTH,
        height: PILL_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: VERTICAL_GAP,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    leftPill: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: BORDER_RADIUS,
        borderBottomRightRadius: BORDER_RADIUS,
        borderLeftWidth: 0,
        paddingLeft: 15,
    },
    rightPill: {
        borderTopLeftRadius: BORDER_RADIUS,
        borderBottomLeftRadius: BORDER_RADIUS,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
        paddingRight: 15,
    },
    matchedPill: {
        opacity: 0.6,
    },
    pillTouchable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    pillText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
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

export default HomophonesScreen;
