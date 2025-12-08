import { Audio } from 'expo-av';

const soundCache = {};

export const audioPlayer = {
    load: async (soundMap) => {
        // soundMap: { key: require('path/to/sound') }
        // Preload sounds if necessary, but typically with Expo AV we might load on demand or keep a few in memory.
        // For this app, we can just ensure the module structure is ready.
        // We will just let play load them on demand to keep memory usage low, or preload specific ones.
    },

    play: async (source) => {
        try {
            // Unload previous if any (simple singleton approach)
            // For overlapping sounds, we would need multiple instances.
            // Let's create a new sound object for each play to allow overlaps (e.g. background music + effect), 
            // or manage a single one for simple effects. 
            // User asked for "play success sound", "play wrong sound".

            const { sound } = await Audio.Sound.createAsync(source);

            // Setup cleanup
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                }
            });

            await sound.playAsync();
            return sound; // Return in case caller wants to stop it
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    },

    playFromUrl: async (url) => {
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: url });
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
            await sound.playAsync();
        } catch (error) {
            console.warn('Error playing url:', error);
        }
    }
};
