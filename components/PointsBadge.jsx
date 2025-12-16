import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePointsStore } from '../store/pointsStore';

export const PointsBadge = () => {
    const points = usePointsStore((state) => state.points);
    const loaded = usePointsStore((state) => state.loaded);

    return (
        <View style={styles.container}>
            {/* Folded corner effect */}
            <View style={styles.foldedCorner} />

            {/* Points display */}
            <Text style={styles.pointsNumber}>{points}</Text>
            <Text style={styles.starsLabel}>Stars</Text>

            {/* Small star icon in top right */}
            <View style={styles.starContainer}>
                <Text style={styles.starIcon}>⭐</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFEB3B', // Bright yellow sticky note
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 70,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        transform: [{ rotate: '5deg' }],
    },
    foldedCorner: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: 12,
        borderTopColor: '#F5F5DC', // Match background
        borderRightColor: '#F5F5DC',
        borderBottomColor: '#E6D32A', // Darker yellow for fold
        borderLeftColor: '#E6D32A',
    },
    pointsNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 24,
    },
    starsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        fontStyle: 'italic',
    },
    starContainer: {
        position: 'absolute',
        top: -5,
        right: -5,
    },
    starIcon: {
        fontSize: 16,
    },
});
