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
 * Simulation types
 */
export enum SimulationType {
  CELL = 'cell-simulation',
  TISSUE = 'tissue-simulation'
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
 * Verify if Web Workers are supported in the current environment
 */
const isWebWorkerSupported = typeof Worker !== 'undefined';

/**
 * Custom hook for handling simulations with Web Workers
 * 
 * @param simulationFunction Function to run in the worker
 * @param simulationType Type of simulation (cell or tissue)
 * @returns Simulation state and control functions
 */
export function useSimulation<P extends SimulationParams, R extends SimulationResults>(
  simulationFunction: (params: P) => R,
  simulationType: SimulationType
) {
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<R | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  
  // Reference to the worker
  const workerRef = useRef<Worker | null>(null);
  
  // Track start time for estimated time remaining
  const startTimeRef = useRef<number>(0);
  
  // Debug information
  const debugInfoRef = useRef<{
    lastMessageTime: number,
    messageCount: number,
    lastMessageType: string
  }>({
    lastMessageTime: 0,
    messageCount: 0,
    lastMessageType: 'none'
  });
  
  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        console.log('Cleaning up worker on component unmount');
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  /**
   * Create and initialize a simulation worker
   */
  const createWorker = useCallback(() => {
    if (!isWebWorkerSupported) {
      console.warn('Web Workers are not supported in this environment.');
      return null;
    }
    
    try {
      console.log('Creating new worker for simulation');
      
      // Create a new worker
      const worker = new Worker(new URL('../workers/simulationWorker.ts', import.meta.url), {
        type: 'module'
      });
      
      // Set up message handler
      worker.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
        const { type, payload, error: workerError } = event.data;
        
        // Update debug info
        debugInfoRef.current = {
          lastMessageTime: Date.now(),
          messageCount: debugInfoRef.current.messageCount + 1,
          lastMessageType: type
        };
        
        console.log(`Received message from worker: ${type}`, 
          type === 'progress' ? `Progress: ${payload}%` : 
          type === 'result' ? 'Results received' : 
          type === 'error' ? `Error: ${workerError}` : 
          'Other message');
        
        switch (type) {
          case 'start':
            setProgress(0);
            setStatus(SimulationStatus.RUNNING);
            break;
            
          case 'progress':
            if (typeof payload === 'number') {
              setProgress(payload);
              
              // Calculate estimated time remaining
              if (payload > 0) {
                const elapsedTime = (Date.now() - startTimeRef.current) / 1000; // seconds
                const totalEstimatedTime = (elapsedTime / payload) * 100;
                const remaining = totalEstimatedTime - elapsedTime;
                setEstimatedTimeRemaining(Math.max(0, remaining));
              }
            }
            break;
            
          case 'result':
            if (payload) {
              console.log('Setting results and completing simulation');
              setResults(payload as R);
              setProgress(100);
              setStatus(SimulationStatus.COMPLETED);
              setEstimatedTimeRemaining(0);
            } else {
              console.error('Received result message with no payload');
              setError('Received empty result from simulation');
              setStatus(SimulationStatus.ERROR);
            }
            break;
            
          case 'error':
            console.error('Simulation error:', workerError);
            setError(workerError || 'Unknown error in simulation worker');
            setStatus(SimulationStatus.ERROR);
            break;
            
          default:
            console.warn(`Unknown message type from worker: ${type}`);
            break;
        }
      };
      
      // Handle worker errors
      worker.onerror = (event) => {
        console.error('Worker error:', event);
        setError(`Worker error: ${event.message}`);
        setStatus(SimulationStatus.ERROR);
      };
      
      return worker;
    } catch (err) {
      console.error('Error creating Web Worker:', err);
      setError(`Failed to create worker: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }, []);
  
  /**
   * Run simulation in the main thread as a fallback
   */
  const runInMainThread = useCallback((params: P) => {
    try {
      console.log('Running simulation in main thread (fallback mode)');
      
      // Reset state
      setStatus(SimulationStatus.RUNNING);
      setProgress(0);
      startTimeRef.current = Date.now();
      
      // Simulate progress updates for UI feedback
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(95, prev + 5);
          
          // Calculate estimated time remaining
          const elapsedTime = (Date.now() - startTimeRef.current) / 1000; // seconds
          const totalEstimatedTime = (elapsedTime / newProgress) * 100;
          const remaining = totalEstimatedTime - elapsedTime;
          setEstimatedTimeRemaining(Math.max(0, remaining));
          
          return newProgress;
        });
      }, 500);
      
      // Run the simulation (this will block the UI thread)
      console.log('Executing simulation function in main thread');
      const result = simulationFunction(params);
      
      // Clear the interval and set final state
      clearInterval(progressInterval);
      console.log('Simulation completed in main thread, setting results');
      setResults(result);
      setProgress(100);
      setStatus(SimulationStatus.COMPLETED);
      setEstimatedTimeRemaining(0);
    } catch (err) {
      console.error('Error in main thread simulation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(SimulationStatus.ERROR);
    }
  }, [simulationFunction]);
  
  /**
   * Start the simulation with the given parameters
   */
  const runSimulation = useCallback((params: P) => {
    console.log('Starting simulation with params:', params);
    
    // Reset state
    setStatus(SimulationStatus.IDLE);
    setProgress(0);
    setError(null);
    setEstimatedTimeRemaining(null);
    setResults(null);
    
    // Reset debug info
    debugInfoRef.current = {
      lastMessageTime: 0,
      messageCount: 0,
      lastMessageType: 'none'
    };
    
    // Terminate previous worker if exists
    if (workerRef.current) {
      console.log('Terminating previous worker');
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    setStatus(SimulationStatus.RUNNING);
    startTimeRef.current = Date.now();
    
    // Try to use Web Workers if supported
    if (isWebWorkerSupported) {
      const worker = createWorker();
      
      if (worker) {
        workerRef.current = worker;
        
        // Add a timeout to detect stalled workers
        setTimeout(() => {
          if (status === SimulationStatus.RUNNING && 
              Date.now() - debugInfoRef.current.lastMessageTime > 10000 &&
              debugInfoRef.current.messageCount > 0) {
            console.warn('No messages received from worker in 10 seconds, simulation may be stalled');
            setError('Simulation appears to be stalled. If this persists, try refreshing the page.');
          }
        }, 12000);
        
        // Prepare message based on simulation type
        // Create the properly structured message for the worker
        const workerMessage = {
          type: simulationType,
          ...params
        };
        
        // Send simulation parameters to the worker
        console.log(`Posting message to worker for ${simulationType}:`, workerMessage);
        worker.postMessage(workerMessage);
      } else {
        // Fall back to main thread if worker creation failed
        console.log('Worker creation failed, falling back to main thread');
        runInMainThread(params);
      }
    } else {
      // Fall back to main thread if Web Workers not supported
      console.log('Web Workers not supported, running in main thread');
      runInMainThread(params);
    }
  }, [createWorker, runInMainThread, status, simulationType]);
  
  /**
   * Cancel the current simulation
   */
  const cancelSimulation = useCallback(() => {
    console.log('Cancelling simulation');
    
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    setStatus(SimulationStatus.IDLE);
    setEstimatedTimeRemaining(null);
  }, []);
  
  // Export debug info for troubleshooting
  const getDebugInfo = useCallback(() => {
    return {
      ...debugInfoRef.current,
      status,
      progress,
      hasWorker: !!workerRef.current,
      hasResults: !!results,
      simulationType,
      timeSinceStart: startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
    };
  }, [status, progress, results, simulationType]);
  
  return {
    status,
    progress,
    results,
    error,
    estimatedTimeRemaining,
    runSimulation,
    cancelSimulation,
    getDebugInfo
  };
} 