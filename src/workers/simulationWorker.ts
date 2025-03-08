/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

import { MsParams, simulateMitchellSchaeffer } from '../models/MitchellSchaefferModel';
import { 
  TissueParams, 
  simulateTissue, 
  TissueData
} from '../models/TissueModel';

// Define message types for type safety
interface CellSimulationMessage {
  type: 'cell-simulation';
  params: MsParams;
  timeSpan: number;
  initialV: number;
  initialH: number;
  stimulusFn?: {
    amplitude: number;
    duration: number;
    start: number;
  };
}

interface TissueSimulationMessage {
  type: 'tissue-simulation';
  params: TissueParams;
  duration: number;
  stimulusType: 'planar' | 's1s2' | 'none';
  stimulusParams?: Record<string, number>;
  hasObstacle?: boolean;
  obstacleCenter?: { row: number; col: number };
  obstacleRadius?: number;
  hasRepolarizationGradient?: boolean;
  tauCloseValues?: { left: number; right: number };
}

type WorkerMessage = CellSimulationMessage | TissueSimulationMessage;

// Send a message to the main thread with consistent format
function sendMessage(type: 'start' | 'progress' | 'result' | 'error', data?: any, error?: string) {
  self.postMessage({
    type,
    payload: data,
    error
  });
}

// Helper function to debug object properties
function debugObject(obj: any) {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      acc[key] = typeof value === 'function' ? 'function' : 
                (Array.isArray(value) ? `array[${value.length}]` : 
                `object with keys: ${Object.keys(value).join(', ')}`);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}

// Handle incoming messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;
  
  try {
    // Let the main thread know we've started
    sendMessage('start');
    
    console.log("Worker received message:", debugObject(data));
    
    if (!data || !data.type) {
      throw new Error("Invalid message format: missing 'type' property");
    }
    
    if (data.type === 'cell-simulation') {
      // Run cell simulation
      console.log("Running cell simulation with params:", debugObject(data));
      
      // Extract parameters with defaults
      const msParams: MsParams = {
        tau_in: data.params?.tau_in || 0.3,
        tau_out: data.params?.tau_out || 6.0,
        tau_open: data.params?.tau_open || 120.0,
        tau_close: data.params?.tau_close || 80.0,
        v_gate: data.params?.v_gate || 0.13,
        dt: data.params?.dt || 0.01
      };
      
      const timeSpan = data.timeSpan || 100;
      const initialV = data.initialV !== undefined ? data.initialV : 0;
      const initialH = data.initialH !== undefined ? data.initialH : 1;
      
      // Create stimulus function if provided
      let stimulus = undefined;
      if (data.stimulusFn) {
        const { amplitude = 1, duration = 1, start = 5 } = data.stimulusFn;
        stimulus = (t: number): number => {
          if (t >= start && t < start + duration) {
            return amplitude;
          }
          return 0;
        };
      }
      
      // Send an initial progress update
      sendMessage('progress', 10);
      
      console.log("Running Mitchell-Schaeffer with:", {
        msParams,
        timeSpan,
        initialV,
        initialH,
        hasStimulus: !!stimulus
      });
      
      const results = simulateMitchellSchaeffer(
        msParams,
        timeSpan,
        initialV,
        initialH,
        stimulus
      );
      
      // Send a midway progress update
      sendMessage('progress', 50);
      
      // Debug log the results
      console.log('Cell simulation completed with results:', {
        timePoints: results.time.length,
        voltageRange: {
          min: Math.min(...results.v),
          max: Math.max(...results.v)
        },
        finalVoltage: results.v[results.v.length - 1]
      });
      
      // Send back the results
      sendMessage('result', results);
    } 
    else if (data.type === 'tissue-simulation') {
      // Send initial progress
      sendMessage('progress', 5);
      
      console.log("Running tissue simulation with params:", debugObject(data));
      
      // Extract tissue parameters with defaults
      const tissueParams: TissueParams = {
        tau_in: data.params?.tau_in || 0.3,
        tau_out: data.params?.tau_out || 6.0,
        tau_open: data.params?.tau_open || 120.0,
        tau_close: data.params?.tau_close || 80.0,
        v_gate: data.params?.v_gate || 0.13,
        dt: data.params?.dt || 0.05,
        rows: data.params?.rows || 50,
        cols: data.params?.cols || 50,
        diffusionCoefficient: data.params?.diffusionCoefficient || 0.1,
        deltax: data.params?.deltax || 1.0
      };
      
      const duration = data.duration || 50;
      
      // Configure stimulus function based on type
      let stimulusFn = (tissue: TissueData, time: number): TissueData => tissue;
      
      if (data.stimulusType === 'planar') {
        // Extract parameters from stimulusParams with defaults
        const {
          startTime = 1.0,
          duration: stimDuration = 1.0,
          width = 5
        } = data.stimulusParams || {};
        
        console.log("Creating planar stimulus with:", { startTime, stimDuration, width });
        
        stimulusFn = (tissue: TissueData, time: number): TissueData => {
          if (time >= startTime && time < startTime + stimDuration) {
            // Apply stimulus along left edge
            const newTissue = { ...tissue };
            const rows = tissue.v.length;
            const cols = tissue.v[0].length;
            
            // Apply stimulus to left edge
            for (let i = 0; i < rows; i++) {
              for (let j = 0; j < Math.min(width, cols); j++) {
                newTissue.v[i][j] = Math.min(1.0, newTissue.v[i][j] + 1.0);
              }
            }
            
            return newTissue;
          }
          return tissue;
        };
      } 
      else if (data.stimulusType === 's1s2') {
        // Extract parameters from stimulusParams with defaults
        const {
          s1StartTime = 1.0,
          s1Duration = 1.0,
          s2StartTime = 30.0,
          s2Duration = 1.0
        } = data.stimulusParams || {};
        
        console.log("Creating S1-S2 stimulus with:", { s1StartTime, s1Duration, s2StartTime, s2Duration });
        
        stimulusFn = (tissue: TissueData, time: number): TissueData => {
          // S1 stimulus (planar wave from left)
          if (time >= s1StartTime && time < s1StartTime + s1Duration) {
            const newTissue = { ...tissue };
            const rows = tissue.v.length;
            
            // Apply stimulus to left edge
            for (let i = 0; i < rows; i++) {
              for (let j = 0; j < 5; j++) {
                newTissue.v[i][j] = Math.min(1.0, newTissue.v[i][j] + 1.0);
              }
            }
            
            return newTissue;
          }
          
          // S2 stimulus (focal point in middle-right)
          if (time >= s2StartTime && time < s2StartTime + s2Duration) {
            const newTissue = { ...tissue };
            const rows = tissue.v.length;
            const cols = tissue.v[0].length;
            
            const centerRow = Math.floor(rows * 0.5) - 5;
            const centerCol = Math.floor(cols * 0.75) - 5;
            const size = 10;
            
            // Apply stimulus to middle-right region
            for (let i = centerRow; i < centerRow + size && i < rows; i++) {
              for (let j = centerCol; j < centerCol + size && j < cols; j++) {
                newTissue.v[i][j] = Math.min(1.0, newTissue.v[i][j] + 1.0);
              }
            }
            
            return newTissue;
          }
          
          return tissue;
        };
      }
      
      // Send progress after setup
      sendMessage('progress', 10);
      
      // Set up progress reporting
      let lastProgress = 10; // Start at 10% since we've done setup
      const progressCallback = (progress: number) => {
        // Map progress from 0-100 to 10-90 to reserve space for setup and finalization
        const adjustedProgress = 10 + Math.floor(progress * 0.8);
        
        // Only send progress updates when changing by at least 5%
        if (adjustedProgress - lastProgress >= 5 || adjustedProgress >= 90) {
          console.log(`Sending tissue simulation progress: ${adjustedProgress}%`);
          sendMessage('progress', adjustedProgress);
          lastProgress = adjustedProgress;
        }
      };
      
      console.log('Starting tissue simulation with:', {
        rows: tissueParams.rows,
        cols: tissueParams.cols,
        duration,
        stimulusType: data.stimulusType,
        hasObstacle: data.hasObstacle,
        hasGradient: data.hasRepolarizationGradient
      });
      
      // Run the tissue simulation
      const results = simulateTissue(
        tissueParams,
        duration,
        stimulusFn,
        2.0, // saveInterval
        data.hasObstacle || false,
        data.obstacleCenter || { row: 0, col: 0 },
        data.obstacleRadius || 10,
        data.hasRepolarizationGradient || false,
        data.tauCloseValues || { left: 80, right: 80 },
        progressCallback // Pass the progress callback
      );
      
      // Analyze results for debugging
      const snapshots = results.snapshots;
      const lastSnapshot = snapshots[snapshots.length - 1];
      const voltages = lastSnapshot.v.flat();
      
      console.log('Tissue simulation completed with results:', {
        snapshots: snapshots.length,
        finalTime: lastSnapshot.time,
        voltageStats: {
          min: Math.min(...voltages),
          max: Math.max(...voltages),
          avg: voltages.reduce((sum, v) => sum + v, 0) / voltages.length
        }
      });
      
      // Send progress before results
      sendMessage('progress', 95);
      
      // Send final results
      sendMessage('result', results);
    } else {
      throw new Error(`Unknown simulation type: ${(data as any).type}`);
    }
  } catch (error) {
    console.error('Error in simulation worker:', error);
    sendMessage('error', null, error instanceof Error ? error.message : 'Unknown error in simulation');
  }
}; 