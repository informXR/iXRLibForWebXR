export async function getUserIP() {
  if (typeof window === 'undefined') {
    return '0.0.0.0'; // Fallback for non-browser environments
  }

  // ... (rest of the function remains the same)
}