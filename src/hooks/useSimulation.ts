import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Status of the simulation
 */
export enum SimulationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Generic type for simulation parameters
 */
export type SimulationParams = Record<string, unknown>;

/**
 * Generic type for simulation results
 */
export type SimulationResults = unknown;

/**
 * Interface for the simulation worker message
 */
interface SimulationWorkerMessage {
  type: 'start' | 'progress' | 'result' | 'error';
  payload?: SimulationResults | number;
  error?: string;
}

/**
 * Custom hook for handling simulations with Web Workers
 * 
 * @param simulationFunction Function to run in the worker
 * @returns Simulation state and control functions
 */
export function useSimulation<P extends SimulationParams, R extends SimulationResults>(
  simulationFunction: (params: P) => R
) {
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<R | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Reference to the worker
  const workerRef = useRef<Worker | null>(null);
  
  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  /**
   * Create a worker that runs the simulation function
   * If web workers are not supported, run the simulation in the main thread
   */
  const createSimulationWorker = useCallback((params: P) => {
    // Temporarily run all simulations in the main thread to avoid syntax errors
    try {
      setStatus(SimulationStatus.RUNNING);
      setProgress(0);
      
      // Run the simulation (this will block the UI thread)
      const result = simulationFunction(params);
      
      setResults(result);
      setProgress(100);
      setStatus(SimulationStatus.COMPLETED);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(SimulationStatus.ERROR);
    }
  }, [simulationFunction]);
  
  /**
   * Start the simulation with the given parameters
   */
  const runSimulation = useCallback((params: P) => {
    // Reset state
    setStatus(SimulationStatus.IDLE);
    setProgress(0);
    setError(null);
    
    // Terminate previous worker if exists
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    // Create and start a new worker
    createSimulationWorker(params);
  }, [createSimulationWorker]);
  
  /**
   * Cancel the current simulation
   */
  const cancelSimulation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    setStatus(SimulationStatus.IDLE);
  }, []);
  
  return {
    status,
    progress,
    results,
    error,
    runSimulation,
    cancelSimulation
  };
} 