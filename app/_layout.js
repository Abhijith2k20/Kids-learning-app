import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
// If we had fonts we would load them here.

export default function Layout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="trace" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="speak" />
            <Stack.Screen name="homophones" />
        </Stack>
    );
}
