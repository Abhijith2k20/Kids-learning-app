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
import Svg, { Line, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { usePointsStore } from '../store/pointsStore';
import { PointsBadge } from '../components/PointsBadge';
import { RewardAnimation } from '../components/RewardAnimation';
import {
    HOMOPHONES_EXERCISES,
    HOMOPHONES_PROGRESS_KEY,
} from '../data/homophones/homophonesData';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.28;
const CARD_HEIGHT = 60;
const VERTICAL_GAP = 25;
const CONNECTION_THRESHOLD = 120;

// Sticky note colors matching the design image
const STICKY_COLORS = [
    { bg: '#FFF59D', shadow: '#E6DC8D' }, // Yellow
    { bg: '#A5D6A7', shadow: '#8FC291' }, // Green
    { bg: '#F48FB1', shadow: '#DB7FA0' }, // Pink
    { bg: '#FFCC80', shadow: '#E6B770' }, // Orange
];

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

    // Render grid lines for graph paper background
    const renderGridLines = () => {
        const lines = [];
        const gridSize = 20;
        // Vertical lines
        for (let i = 0; i < Math.ceil(width / gridSize); i++) {
            lines.push(
                <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * gridSize }]} />
            );
        }
        // Horizontal lines
        for (let i = 0; i < Math.ceil(height / gridSize); i++) {
            lines.push(
                <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: i * gridSize }]} />
            );
        }
        return lines;
    };

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
            for (let i = 0; i < shuffled.length; i++) {
                if (shuffled[i].originalIndex === i) {
                    let swapIndex = (i + 1) % shuffled.length;
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

            // Left cards: Connect from RIGHT edge
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

            // Right cards: Connect from LEFT edge
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
            // Game-like haptic celebration pattern
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
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
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (e, gestureState) => {
                if (matchedPairsRef.current.includes(leftIdx)) return false;
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
            router.replace('/');
        }
    };

    const isLastExercise = currentExercise === HOMOPHONES_EXERCISES.length - 1;
    const progressPercent = (matchedPairs.length / pairs.length) * 100;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                {/* Grid background */}
                <View style={styles.gridBackground}>
                    {renderGridLines()}
                </View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Grid paper background */}
            <View style={styles.gridBackground}>
                {renderGridLines()}
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
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Match the{"\n"}Homophones! </Text>
            </View>

            {/* Game Container */}
            <View
                style={styles.gameContainer}
                ref={gameContainerRef}
                onLayout={measurePills}
            >
                {/* SVG for connection lines - sketchy arrow style */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    {connections
                        .filter(c => c.correct)
                        .map((c) => {
                            const l = pillPositions.left[c.leftIndex];
                            const r = pillPositions.right[c.rightIndex];
                            if (!l || !r) return null;
                            // Draw line with arrow
                            const arrowSize = 10;
                            const angle = Math.atan2(r.y - l.y, r.x - l.x);
                            const arrowX1 = r.x - arrowSize * Math.cos(angle - Math.PI / 6);
                            const arrowY1 = r.y - arrowSize * Math.sin(angle - Math.PI / 6);
                            const arrowX2 = r.x - arrowSize * Math.cos(angle + Math.PI / 6);
                            const arrowY2 = r.y - arrowSize * Math.sin(angle + Math.PI / 6);
                            return (
                                <React.Fragment key={`${c.leftIndex}-${c.rightIndex}`}>
                                    <Line
                                        x1={l.x}
                                        y1={l.y}
                                        x2={r.x}
                                        y2={r.y}
                                        stroke="#2C3E50"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                    <Path
                                        d={`M ${r.x} ${r.y} L ${arrowX1} ${arrowY1} M ${r.x} ${r.y} L ${arrowX2} ${arrowY2}`}
                                        stroke="#2C3E50"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                </React.Fragment>
                            );
                        })}
                    {activeLineEnd && pillPositions.left[activeLineEnd.leftIndex] && (
                        <Line
                            x1={pillPositions.left[activeLineEnd.leftIndex].x}
                            y1={pillPositions.left[activeLineEnd.leftIndex].y}
                            x2={activeLineEnd.x}
                            y2={activeLineEnd.y}
                            stroke="#2C3E50"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeDasharray="5,5"
                        />
                    )}
                </Svg>

                {/* Left Column - Sticky notes */}
                <View style={styles.leftColumn}>
                    {pairs.map((p, i) => {
                        const colorScheme = STICKY_COLORS[i % STICKY_COLORS.length];
                        const matched = matchedPairs.includes(i);
                        return (
                            <View
                                key={`left-${i}`}
                                ref={r => leftPillRefs.current[i] = r}
                                style={[
                                    styles.stickyNote,
                                    styles.leftSticky,
                                    { backgroundColor: colorScheme.bg },
                                    matched && styles.matchedNote,
                                ]}
                                {...getPan(i).panHandlers}
                            >
                                <View style={[styles.stickyFold, styles.leftFold, { borderBottomColor: colorScheme.shadow }]} />
                                <TouchableOpacity
                                    onPress={() => speakWord(p.leftWord)}
                                    style={styles.stickyTouchable}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.stickyText}>{p.leftWord}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Right Column - Sticky notes */}
                <View style={styles.rightColumn}>
                    {shuffledRightItems.map((p, i) => {
                        const colorScheme = STICKY_COLORS[p.originalIndex % STICKY_COLORS.length];
                        const matched = matchedPairs.includes(p.originalIndex);
                        return (
                            <TouchableOpacity
                                key={`right-${i}`}
                                ref={r => rightPillRefs.current[i] = r}
                                style={[
                                    styles.stickyNote,
                                    styles.rightSticky,
                                    { backgroundColor: colorScheme.bg },
                                    matched && styles.matchedNote,
                                ]}
                                onPress={() => speakWord(p.rightWord)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.stickyFold, styles.rightFold, { borderBottomColor: colorScheme.shadow }]} />
                                <Text style={styles.stickyText}>{p.rightWord}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>
                {matchedPairs.length === pairs.length && (
                    <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                )}
            </View>

            {/* Exercise Count */}
            <View style={styles.exerciseCount}>
                <Text style={styles.exerciseCountText}>
                    Exercise {currentExercise + 1} of {HOMOPHONES_EXERCISES.length}
                </Text>
            </View>

            <RewardAnimation
                visible={showReward}
                onNext={handleNext}
                message={isLastExercise ? 'All Done!' : 'Great Job!'}
                buttonLabel={isLastExercise ? 'Homepage' : 'Next ➡'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5E8', // Cream/off-white paper color
    },
    gridBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#C8E6C9',
        opacity: 0.5,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#C8E6C9',
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5E8',
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
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1565C0', // Blue color
        textAlign: 'center',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gameContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
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
    stickyNote: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: VERTICAL_GAP,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        position: 'relative',
    },
    leftSticky: {
        marginLeft: 0,
    },
    rightSticky: {
        marginRight: 0,
    },
    stickyFold: {
        position: 'absolute',
        width: 0,
        height: 0,
        borderStyle: 'solid',
    },
    leftFold: {
        right: -1,
        bottom: -1,
        borderWidth: 12,
        borderTopColor: 'transparent',
        borderRightColor: '#F5F5E8',
        borderLeftColor: 'transparent',
    },
    rightFold: {
        left: -1,
        bottom: -1,
        borderWidth: 12,
        borderTopColor: 'transparent',
        borderLeftColor: '#F5F5E8',
        borderRightColor: 'transparent',
    },
    matchedNote: {
        opacity: 0.6,
    },
    stickyTouchable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    stickyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    progressSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 15,
    },
    progressBarContainer: {
        flex: 1,
        height: 20,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#81C784',
        borderRadius: 10,
    },
    checkmark: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#81C784',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    checkmarkText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
    exerciseCount: {
        alignItems: 'center',
        paddingBottom: 25,
    },
    exerciseCountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});

export default HomophonesScreen;
