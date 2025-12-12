import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const RewardAnimation = ({ visible, onNext, message = "Great Job!", buttonLabel = "Next Letter ➡" }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    // Confetti pieces
    const confettiCount = 20;
    const confettiAnims = useRef([...Array(confettiCount)].map(() => ({
        y: new Animated.Value(-100),
        x: new Animated.Value(0),
        rotate: new Animated.Value(0)
    }))).current;

    useEffect(() => {
        if (visible) {
            // Main popup bounce
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();

            // Confetti animation
            confettiAnims.forEach((anim, i) => {
                anim.y.setValue(-100);
                anim.x.setValue(Math.random() * width);
                anim.rotate.setValue(0);

                Animated.parallel([
                    Animated.timing(anim.y, {
                        toValue: height + 100,
                        duration: 1500 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.rotate, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true
                    })
                ]).start();
            });

            // Play sound? (handled by caller typically, or here)
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                {/* Confetti - with pointerEvents none so they don't block touches */}
                <View style={styles.confettiContainer} pointerEvents="none">
                    {confettiAnims.map((anim, index) => {
                        const rotation = anim.rotate.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg']
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.confetti,
                                    {
                                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43'][index % 4],
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

                {/* Popup Card */}
                <Animated.View style={[styles.popup, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.icon}>🎉</Text>
                    <Text style={styles.title}>{message}</Text>
                    <Text style={styles.subtitle}>You earned 10 Stars!</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onNext}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>{buttonLabel}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
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
        width: width * 0.8,
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
        zIndex: 100,
    },
    icon: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
        marginBottom: 25,
    },
    button: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
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
