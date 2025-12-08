import { useState } from 'react';

export const useDrawing = () => {
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [currentPoints, setCurrentPoints] = useState([]); // Store raw points for validation

    const onDrawingStart = (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPath = `M ${locationX} ${locationY}`;
        setCurrentPath(newPath);
        setCurrentPoints([{ x: locationX, y: locationY }]);
    };

    const onDrawingActive = (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath((prevPath) => `${prevPath} L ${locationX} ${locationY}`);
        setCurrentPoints((prevPoints) => [...prevPoints, { x: locationX, y: locationY }]);
    };

    const onDrawingEnd = () => {
        if (currentPath) {
            setPaths((prevPaths) => [
                ...prevPaths,
                {
                    path: currentPath,
                    points: currentPoints, // Save points with the path
                    color: '#FF6B6B',
                    strokeWidth: 12,
                },
            ]);
            setCurrentPath('');
            setCurrentPoints([]);
        }
    };

    const clearDrawing = () => {
        setPaths([]);
        setCurrentPath('');
        setCurrentPoints([]);
    };

    return {
        paths,
        currentPath,
        onDrawingStart,
        onDrawingActive,
        onDrawingEnd,
        clearDrawing,
    };
};
