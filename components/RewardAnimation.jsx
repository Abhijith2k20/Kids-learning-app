import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export const RewardAnimation = ({ visible, onNext, message = "Great Job!", buttonLabel = "Next ➡" }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const [showModal, setShowModal] = useState(false);

    // Confetti pieces
    const confettiCount = 25;
    const confettiAnims = useRef([...Array(confettiCount)].map(() => ({
        y: new Animated.Value(-100),
        x: new Animated.Value(0),
        rotate: new Animated.Value(0)
    }))).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);

            // Reset values
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
            overlayOpacity.setValue(0);
            slideAnim.setValue(30);
            iconScale.setValue(0);
            contentOpacity.setValue(0);

            // Smooth professional opening animation
            Animated.sequence([
                // First: fade in overlay
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
                // Then: popup appears with scale + slide + fade
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1.2)),
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 350,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.cubic),
                    }),
                ]),
            ]).start();

            // Staggered content animations
            Animated.sequence([
                Animated.delay(350),
                Animated.parallel([
                    // Icon pops in
                    Animated.spring(iconScale, {
                        toValue: 1,
                        friction: 4,
                        tension: 100,
                        useNativeDriver: true,
                    }),
                    // Content fades in
                    Animated.timing(contentOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();

            // Delayed confetti animation
            setTimeout(() => {
                confettiAnims.forEach((anim, i) => {
                    anim.y.setValue(-100);
                    anim.x.setValue(Math.random() * width);
                    anim.rotate.setValue(0);

                    Animated.parallel([
                        Animated.timing(anim.y, {
                            toValue: height + 100,
                            duration: 2500 + Math.random() * 1000,
                            useNativeDriver: true,
                            easing: Easing.linear,
                        }),
                        Animated.timing(anim.rotate, {
                            toValue: 1,
                            duration: 2500,
                            useNativeDriver: true
                        })
                    ]).start();
                });
            }, 300);
        }
    }, [visible]);

    // Smooth close animation
    const handleNext = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 30,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowModal(false);
            onNext();
        });
    };

    if (!showModal) return null;

    // Render notebook lines
    const renderLines = () => {
        const lines = [];
        for (let i = 0; i < 7; i++) {
            lines.push(
                <View key={i} style={styles.notebookLine} />
            );
        }
        return lines;
    };

    return (
        <Modal transparent visible={showModal} animationType="none">
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
                {/* Confetti */}
                <View style={styles.confettiContainer} pointerEvents="none">
                    {confettiAnims.map((anim, index) => {
                        const rotation = anim.rotate.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '720deg']
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.confetti,
                                    {
                                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A8E6CF'][index % 5],
                                        transform: [
                                            { translateY: anim.y },
                                            { translateX: anim.x },
                                            { rotate: rotation }
                                        ]
                                    }
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Notebook-style Popup Card */}
                <Animated.View
                    style={[
                        styles.popup,
                        {
                            opacity: opacityAnim,
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim }
                            ]
                        }
                    ]}
                >
                    {/* Notebook lines background */}
                    <View style={styles.linesContainer}>
                        {renderLines()}
                    </View>

                    {/* Red margin line */}
                    <View style={styles.marginLine} />

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Celebration emoji */}
                        <Animated.Text style={[styles.icon, { transform: [{ scale: iconScale }] }]}>
                            🎉
                        </Animated.Text>

                        {/* Title */}
                        <Animated.Text style={[styles.title, { opacity: contentOpacity }]}>
                            {message}
                        </Animated.Text>

                        {/* Stars earned */}
                        <Animated.View style={[styles.starsContainer, { opacity: contentOpacity }]}>
                            <Text style={styles.starIcon}>⭐</Text>
                            <Text style={styles.subtitle}>+10 Stars!</Text>
                        </Animated.View>

                        {/* Next Button */}
                        <Animated.View style={{ opacity: contentOpacity, width: '85%' }}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleNext}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>{buttonLabel}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    popup: {
        width: width * 0.75,
        backgroundColor: '#FAF8F0',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 15,
        borderWidth: 3,
        borderColor: '#E8E4D8',
    },
    linesContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        bottom: 0,
    },
    notebookLine: {
        height: 1,
        backgroundColor: '#A8D4F0',
        marginBottom: 26,
        marginLeft: 30,
        opacity: 0.6,
    },
    marginLine: {
        position: 'absolute',
        left: 25,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#E8A0A0',
        opacity: 0.5,
    },
    content: {
        alignItems: 'center',
        paddingTop: 25,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    icon: {
        fontSize: 60,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#C41E3A',
        marginBottom: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    starIcon: {
        fontSize: 22,
        marginRight: 6,
    },
    subtitle: {
        fontSize: 18,
        color: '#5A8BC4',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#E57373',
        paddingVertical: 14,
        paddingHorizontal: 45,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#C62828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    confetti: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        top: 0,
        left: 0,
    }
});

export default RewardAnimation;
