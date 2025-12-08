import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { usePointsStore } from '../store/pointsStore';

export const PointsBadge = () => {
    const points = usePointsStore((state) => state.points);
    const loaded = usePointsStore((state) => state.loaded);

    // Simple pulse animation on change could be added, but basic for now.

    if (!loaded && points === 0) {
        // Optional loading state, or just show 0
    }

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.text}>Points: {points}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    icon: {
        fontSize: 16,
        marginRight: 6,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700', // Gold color
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    }
});
