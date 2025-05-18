// src/utils/colors.js

// Generates a consistent HSL color string from a string input
export function stringToHslColor(str, s, l) {
    let hash = 0;
    if (!str) return `hsl(0, ${s}%, ${l}%)`; // Default for empty/null string
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360; // Ensure positive hash
    return `hsl(${h}, ${s}%, ${l}%)`;
}