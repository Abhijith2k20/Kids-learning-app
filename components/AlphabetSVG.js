import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// SVG path data for each letter (outline only)
export const ALPHABET_PATHS = {
    A: 'M80 250 L130 50 L180 250 M105 200 L155 200',
    B: 'M60 50 L60 250 L150 250 Q200 250 200 200 Q200 150 150 150 L60 150 M60 150 L140 150 Q190 150 190 100 Q190 50 140 50 L60 50',
    C: 'M200 80 Q180 50 140 50 L100 50 Q60 50 60 100 L60 200 Q60 250 100 250 L140 250 Q180 250 200 220',
    D: 'M60 50 L60 250 L130 250 Q200 250 200 150 Q200 50 130 50 Z',
    E: 'M200 50 L60 50 L60 140 L180 140 M60 140 L60 250 L200 250',
    F: 'M200 50 L60 50 L60 140 L180 140 M60 140 L60 250',
    G: 'M200 80 Q180 50 140 50 L100 50 Q60 50 60 100 L60 200 Q60 250 100 250 L140 250 Q200 250 200 200 L200 150 L140 150',
    H: 'M60 50 L60 250 M60 150 L200 150 M200 50 L200 250',
    I: 'M100 50 L160 50 M130 50 L130 250 M100 250 L160 250',
    J: 'M180 50 L180 210 Q180 250 140 250 L120 250 Q80 250 80 210',
    K: 'M60 50 L60 250 M60 150 L200 50 M60 150 L200 250',
    L: 'M60 50 L60 250 L200 250',
    M: 'M50 250 L50 50 L130 150 L210 50 L210 250',
    N: 'M60 250 L60 50 L200 250 L200 50',
    O: 'M100 50 L160 50 Q200 50 200 100 L200 200 Q200 250 160 250 L100 250 Q60 250 60 200 L60 100 Q60 50 100 50',
    P: 'M60 250 L60 50 L150 50 Q200 50 200 100 Q200 150 150 150 L60 150',
    Q: 'M100 50 L160 50 Q200 50 200 100 L200 200 Q200 250 160 250 L100 250 Q60 250 60 200 L60 100 Q60 50 100 50 M170 210 L210 260',
    R: 'M60 250 L60 50 L150 50 Q200 50 200 100 Q200 150 150 150 L60 150 M150 150 L200 250',
    S: 'M200 80 Q180 50 130 50 L100 50 Q60 50 60 90 Q60 130 100 140 L160 150 Q200 160 200 210 Q200 250 160 250 L100 250 Q60 250 60 220',
    T: 'M50 50 L210 50 M130 50 L130 250',
    U: 'M60 50 L60 200 Q60 250 100 250 L160 250 Q200 250 200 200 L200 50',
    V: 'M50 50 L130 250 L210 50',
    W: 'M40 50 L70 250 L130 150 L190 250 L220 50',
    X: 'M60 50 L200 250 M200 50 L60 250',
    Y: 'M60 50 L130 150 L200 50 M130 150 L130 250',
    Z: 'M60 50 L200 50 L60 250 L200 250',
};

export const AlphabetSVG = ({ letter, width = 300, height = 300 }) => {
    const pathData = ALPHABET_PATHS[letter.toUpperCase()];

    if (!pathData) {
        return (
            <View style={[styles.container, { width, height }]}>
                <Text style={styles.fallbackText}>{letter}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Svg width={width} height={height} viewBox="0 0 260 300">
                <Path
                    d={pathData}
                    stroke="#4ECDC4"
                    strokeWidth={8}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fallbackText: {
        fontSize: 200,
        color: '#4ECDC4',
        fontWeight: 'bold',
    },
});
