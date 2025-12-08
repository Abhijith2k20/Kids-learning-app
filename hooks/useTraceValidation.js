import { svgPathProperties } from 'svg-path-properties';
import { ALPHABET_PATHS } from '../components/AlphabetSVG';

export const useTraceValidation = () => {
    const validateTrace = (letter, userPaths, canvasSize) => {
        const pathData = ALPHABET_PATHS[letter.toUpperCase()];
        if (!pathData || userPaths.length === 0) return { isValid: false, score: 0 };

        // 1. Split path into individual strokes (segments)
        // Regex splits by 'M' but keeps the delimiter. 
        // We want to reconstruct "M..." strings.
        // pathData looks like "M... L... M... L..."
        const commands = pathData.split(/(?=[M])/).filter(cmd => cmd.trim().length > 0);

        // Collect all user points from all strokes for checking coverage
        const allUserPoints = userPaths.flatMap(p => p.points);
        if (allUserPoints.length === 0) return { isValid: false, score: 0 };

        // Scaling factors
        const scaleX = 260 / canvasSize.width;
        const scaleY = 300 / canvasSize.height;
        const TOLERANCE = 20; // Reduced from 45 to prevents legs covering crossbar
        const REQUIRED_COVERAGE = 0.80; // Keeping 80% to be fair with lower tolerance

        console.log(`Validating ${letter} with ${commands.length} segments`);

        let allSegmentsValid = true;
        let totalCoveredPoints = 0;
        let totalTargetPoints = 0;

        // 2. Validate EACH segment independently
        commands.forEach((segmentPath, index) => {
            const properties = new svgPathProperties(segmentPath);
            const totalLength = properties.getTotalLength();

            // Skip tiny artifacts if any
            if (totalLength < 5) return;

            // Adaptive sampling: more points for longer strokes
            const numSamples = Math.max(10, Math.floor(totalLength / 5));
            let segmentCoveredCount = 0;

            for (let i = 0; i <= numSamples; i++) {
                const point = properties.getPointAtLength((i / numSamples) * totalLength);

                // Check if this target point is covered by ANY user point
                const isCovered = allUserPoints.some(userPt => {
                    const userX = userPt.x * scaleX;
                    const userY = userPt.y * scaleY;
                    const dist = Math.sqrt(Math.pow(userX - point.x, 2) + Math.pow(userY - point.y, 2));
                    return dist <= TOLERANCE;
                });

                if (isCovered) segmentCoveredCount++;
            }

            const segmentScore = segmentCoveredCount / (numSamples + 1);
            console.log(`Segment ${index}: Score ${segmentScore.toFixed(2)} / Required ${REQUIRED_COVERAGE}`);

            // STRICT CHECK: If this segment is not covered enough, fail immediately
            if (segmentScore < REQUIRED_COVERAGE) {
                console.log(`Segment ${index} FAILED`);
                allSegmentsValid = false;
            }

            totalCoveredPoints += segmentCoveredCount;
            totalTargetPoints += (numSamples + 1);
        });

        const finalScore = totalTargetPoints > 0 ? (totalCoveredPoints / totalTargetPoints) * 100 : 0;

        // Result is valid ONLY if ALL segments passed
        return {
            isValid: allSegmentsValid,
            score: finalScore
        };
    };

    return { validateTrace };
};
