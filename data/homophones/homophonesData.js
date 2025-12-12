/**
 * Homophones Learning Data
 * 
 * Each exercise contains 4 pairs of homophones.
 * Structure:
 * - leftWord: Word displayed on the left column
 * - rightWord: Word displayed on the right column (matching homophone)
 * - leftSound: Sound file key for the left word (stored in assets/homophones_sounds/)
 * - rightSound: Sound file key for the right word (stored in assets/homophones_sounds/)
 * 
 * To add new exercises:
 * 1. Add a new exercise object to HOMOPHONES_EXERCISES
 * 2. Add corresponding MP3 files to assets/homophones_sounds/
 * 3. Update HOMOPHONE_SOUND_MAP with require() statements for the new files
 */

export const HOMOPHONES_EXERCISES = [
    // Exercise 1
    {
        id: 1,
        pairs: [
            { leftWord: 'sea', rightWord: 'see' },
            { leftWord: 'hear', rightWord: 'here' },
            { leftWord: 'write', rightWord: 'right' },
            { leftWord: 'flower', rightWord: 'flour' },
        ]
    },
    // Exercise 2
    {
        id: 2,
        pairs: [
            { leftWord: 'night', rightWord: 'knight' },
            { leftWord: 'sun', rightWord: 'son' },
            { leftWord: 'bear', rightWord: 'bare' },
            { leftWord: 'tale', rightWord: 'tail' },
        ]
    },
    // Exercise 3
    {
        id: 3,
        pairs: [
            { leftWord: 'week', rightWord: 'weak' },
            { leftWord: 'pair', rightWord: 'pear' },
            { leftWord: 'blue', rightWord: 'blew' },
            { leftWord: 'meet', rightWord: 'meat' },
        ]
    },
    // Exercise 4
    {
        id: 4,
        pairs: [
            { leftWord: 'know', rightWord: 'no' },
            { leftWord: 'ate', rightWord: 'eight' },
            { leftWord: 'deer', rightWord: 'dear' },
            { leftWord: 'ant', rightWord: 'aunt' },
        ]
    },
    // Exercise 5
    {
        id: 5,
        pairs: [
            { leftWord: 'eye', rightWord: 'I' },
            { leftWord: 'be', rightWord: 'bee' },
            { leftWord: 'road', rightWord: 'rode' },
            { leftWord: 'hair', rightWord: 'hare' },
        ]
    },
    // Exercise 6
    {
        id: 6,
        pairs: [
            { leftWord: 'peace', rightWord: 'piece' },
            { leftWord: 'sale', rightWord: 'sail' },
            { leftWord: 'wear', rightWord: 'where' },
            { leftWord: 'wait', rightWord: 'weight' },
        ]
    },
    // Exercise 7
    {
        id: 7,
        pairs: [
            { leftWord: 'break', rightWord: 'brake' },
            { leftWord: 'made', rightWord: 'maid' },
            { leftWord: 'rain', rightWord: 'reign' },
            { leftWord: 'wood', rightWord: 'would' },
        ]
    },
    // Exercise 8
    {
        id: 8,
        pairs: [
            { leftWord: 'our', rightWord: 'hour' },
            { leftWord: 'knew', rightWord: 'new' },
            { leftWord: 'plane', rightWord: 'plain' },
            { leftWord: 'steal', rightWord: 'steel' },
        ]
    },
    // Exercise 9
    {
        id: 9,
        pairs: [
            { leftWord: 'red', rightWord: 'read' },
            { leftWord: 'hole', rightWord: 'whole' },
            { leftWord: 'threw', rightWord: 'through' },
            { leftWord: 'won', rightWord: 'one' },
        ]
    },
    // Exercise 10
    {
        id: 10,
        pairs: [
            { leftWord: 'heel', rightWord: 'heal' },
            { leftWord: 'flour', rightWord: 'flower' },
            { leftWord: 'bury', rightWord: 'berry' },
            { leftWord: 'bored', rightWord: 'board' },
        ]
    },
];

// Storage key for AsyncStorage
export const HOMOPHONES_PROGRESS_KEY = 'homophones_exercise_progress';
