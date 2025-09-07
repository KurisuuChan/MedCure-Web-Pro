// Quick test file to debug environment variables
console.log("🔧 Environment Debug Test:");
console.log("VITE_USE_MOCK_DATA:", import.meta.env.VITE_USE_MOCK_DATA);
console.log("Type:", typeof import.meta.env.VITE_USE_MOCK_DATA);
console.log("All env vars:", import.meta.env);

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== "false";
console.log("Computed USE_MOCK:", USE_MOCK);

// Export for debugging
export const envDebug = {
  VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
  USE_MOCK,
  allEnv: import.meta.env,
};
