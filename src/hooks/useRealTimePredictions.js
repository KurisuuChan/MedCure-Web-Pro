import { useState, useEffect, useCallback } from "react";
// import { RealTimePredictionEngine } from "../services/infrastructure/realTimePredictionEngine";

/**
 * Hook for managing real-time ML predictions
 */
export function useRealTimePredictions() {
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [engineStatus, setEngineStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Update state from engine status
  const updateEngineStatus = useCallback(() => {
    const status = RealTimePredictionEngine.getStatus();
    setEngineStatus(status);
    setIsEngineRunning(status.isRunning);
    setLastUpdate(status.lastUpdate);

    const currentPredictions = RealTimePredictionEngine.getCurrentPredictions();
    setPredictions(currentPredictions);
  }, []);

  // Start the prediction engine
  const startEngine = useCallback(async () => {
    try {
      setError(null);
      const result = await RealTimePredictionEngine.startEngine();

      if (result.success) {
        updateEngineStatus();
      } else {
        setError(result.error);
      }

      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [updateEngineStatus]);

  // Stop the prediction engine
  const stopEngine = useCallback(async () => {
    try {
      setError(null);
      const result = RealTimePredictionEngine.stopEngine();
      updateEngineStatus();
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [updateEngineStatus]);

  // Get specific prediction type
  const getPredictions = useCallback(
    (type) => {
      const filtered = {};
      for (const [key, value] of Object.entries(predictions)) {
        if (key.startsWith(type)) {
          filtered[key] = value;
        }
      }
      return filtered;
    },
    [predictions]
  );

  // Get demand forecasts
  const getDemandForecasts = useCallback(() => {
    return getPredictions("demand_");
  }, [getPredictions]);

  // Get price optimizations
  const getPriceOptimizations = useCallback(() => {
    return getPredictions("pricing_");
  }, [getPredictions]);

  // Get inventory recommendations
  const getInventoryRecommendations = useCallback(() => {
    return predictions["inventory_recommendations"] || {};
  }, [predictions]);

  // Subscribe to engine updates
  useEffect(() => {
    const unsubscribe = RealTimePredictionEngine.subscribe((event) => {
      console.log("🔔 [useRealTimePredictions] Engine event:", event);

      switch (event.type) {
        case "ENGINE_STARTED":
          setIsEngineRunning(true);
          setError(null);
          break;
        case "ENGINE_STOPPED":
          setIsEngineRunning(false);
          break;
        case "PREDICTIONS_UPDATED":
          updateEngineStatus();
          break;
        default:
          break;
      }
    });

    // Initial status check
    updateEngineStatus();

    return unsubscribe;
  }, [updateEngineStatus]);

  return {
    // Engine control
    isEngineRunning,
    startEngine,
    stopEngine,

    // Status
    engineStatus,
    lastUpdate,
    error,

    // Predictions
    predictions,
    getDemandForecasts,
    getPriceOptimizations,
    getInventoryRecommendations,

    // Utilities
    updateEngineStatus,
  };
}
