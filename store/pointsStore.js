import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export const usePointsStore = create(
    persist(
        (set, get) => ({
            points: 0,
            loaded: false,

            // Initialize loaded state to true immediately since persist rehydrates synchronously if using AsyncStorage? 
            // Actually async storage is async. Zustand persist handles hydration.
            // We can use onRehydrateStorage to flip loaded flag if needed, but usually state is just available once hydrated.
            // We'll mark 'loaded' manually in onFinishHydration or assume initial render might be 0.

            addPoints: (amount) => set((state) => ({ points: state.points + amount })),
            resetPoints: () => set({ points: 0 }),

            // Explicit load is not always needed with persist middleware but keeping interface if consumer wants to verify
            loadPoints: async () => {
                // This is largely handled by persist middleware automatically.
                // We can just ensure the store is ready.
                set({ loaded: true });
            }
        }),
        {
            name: 'points-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: (state) => {
                return (state, error) => {
                    if (error) {
                        console.log('an error happened during hydration', error);
                    } else {
                        // hydration finished
                        if (state) state.loaded = true;
                    }
                };
            },
        }
    )
);
