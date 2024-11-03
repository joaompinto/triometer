function normalizeProximities(proximities) {
    const sum = proximities.reduce((acc, val) => acc + val, 0);
    
    // Scale values to sum to 12
    let normalized = proximities.map(val => Math.round((val * 12) / sum));
    const normalizedSum = normalized.reduce((acc, val) => acc + val, 0);
    
    // Adjust highest value if needed
    if (normalizedSum !== 12) {
        const maxIndex = normalized.indexOf(Math.max(...normalized));
        normalized[maxIndex] += (12 - normalizedSum);
    }
    
    return normalized;
}

function calculateProximity(x1, y1, x2, y2, maxDistance) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    // Initial scaling from 1-10
    const rawProximity = 1 + 9 * (1 - distance / maxDistance);
    return Math.min(Math.max(Math.round(rawProximity), 1), 10);
}

function validateSelection(proximities) {
    // Check if values are between 1 and 10
    const validRange = proximities.every(p => p.proximity >= 1 && p.proximity <= 10);
    
    // Calculate sum of proximities
    const sum = proximities.reduce((acc, p) => acc + p.proximity, 0);
    
    // Sum must equal 12
    return validRange && sum === 12;
}

export { calculateProximity, validateSelection, normalizeProximities };
