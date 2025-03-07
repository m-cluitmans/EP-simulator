/**
 * Tissue Model
 * 
 * Implementation of a 2D reaction-diffusion model for cardiac tissue
 * using the Mitchell Schaeffer model for cell dynamics.
 * 
 * The model solves the system:
 *   dv/dt = D*∇²v + (J_in + J_out + J_stim)
 *   dh/dt = g(v,h)
 * 
 * where:
 * - v is the voltage
 * - h is the inactivation gate variable
 * - D is the diffusion coefficient (related to tissue conductivity)
 * - J_in, J_out, and g(v,h) are from the Mitchell Schaeffer model
 */

import { MsParams, DEFAULT_MS_PARAMS } from './MitchellSchaefferModel';

export interface TissueParams extends MsParams {
  rows: number;                // Number of rows in the tissue grid
  cols: number;                // Number of columns in the tissue grid
  diffusionCoefficient: number;// Diffusion coefficient
  deltax: number;              // Spatial step size
}

export interface TissueData {
  v: number[][];              // Voltage at each grid point
  h: number[][];              // Inactivation gate variable at each grid point
  time: number;               // Current simulation time
}

export interface TissueSimulationResults {
  snapshots: TissueData[];    // Snapshots at each saved time step
  activationTimes: number[][]; // Local activation times
  apd: number[][];            // Action potential durations
}

/**
 * Default parameters for the tissue model - optimized for wave propagation
 * using the Mitchell Schaeffer model
 */
export const DEFAULT_TISSUE_PARAMS: TissueParams = {
  // Cell parameters optimized for tissue propagation
  tau_in: 0.3,      // Fast depolarization
  tau_out: 6.0,     // Moderate repolarization
  tau_open: 120.0,  // Slow recovery for proper refractoriness
  tau_close: 80.0,  // Moderate gate closing
  v_gate: 0.13,     // Standard threshold
  dt: 0.01,         // Time step
  
  // Tissue-specific parameters
  rows: 100,
  cols: 100,
  diffusionCoefficient: 0.1,  // Lower than FHN model needs
  deltax: 1.0
};

/**
 * Initialize tissue to resting state
 * 
 * @param params Tissue parameters
 * @returns Initial tissue state
 */
export function initializeTissue(params: TissueParams = DEFAULT_TISSUE_PARAMS): TissueData {
  const { rows, cols } = params;
  
  // Initialize arrays for voltage and gate variables
  const v: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0.0));
  const h: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(1.0));
  
  return {
    v,
    h,
    time: 0
  };
}

/**
 * Apply a stimulus to a specific region of the tissue
 * 
 * @param tissue Current tissue state
 * @param stimulusValue Stimulus strength
 * @param startRow Starting row of stimulus region
 * @param startCol Starting column of stimulus region
 * @param width Width of stimulus region
 * @param height Height of stimulus region
 * @returns Updated tissue state
 */
export function applyTissueStimulus(
  tissue: TissueData,
  stimulusValue: number = 1.0,
  startRow: number = 0,
  startCol: number = 0,
  width: number = 5,
  height: number = 5
): TissueData {
  const { v, h, time } = tissue;
  const newV = v.map(row => [...row]);
  
  // Apply stimulus to the specified region
  const endRow = Math.min(startRow + height, v.length);
  const endCol = Math.min(startCol + width, v[0].length);
  
  for (let i = startRow; i < endRow; i++) {
    for (let j = startCol; j < endCol; j++) {
      newV[i][j] += stimulusValue;
      // Ensure voltage stays within bounds [0,1]
      newV[i][j] = Math.min(1.0, Math.max(0.0, newV[i][j]));
    }
  }
  
  return {
    v: newV,
    h,
    time
  };
}

/**
 * Apply planar wave stimulus from the left side of the tissue
 * 
 * @param tissue Current tissue state
 * @param time Current simulation time
 * @param startTime When to start the stimulus
 * @param duration Duration of the stimulus
 * @param width Width of the stimulus region
 * @returns Updated tissue state
 */
export function planarWaveStimulus(
  tissue: TissueData,
  time: number,
  startTime: number = 1.0,
  duration: number = 1.0,
  width: number = 5
): TissueData {
  if (time >= startTime && time < startTime + duration) {
    // Apply stimulus along left edge
    return applyTissueStimulus(tissue, 1.0, 0, 0, width, tissue.v.length);
  }
  return tissue;
}

/**
 * Apply S1-S2 stimulus protocol
 * 
 * @param tissue Current tissue state
 * @param time Current simulation time
 * @param s1StartTime When to apply the S1 stimulus
 * @param s1Duration Duration of the S1 stimulus
 * @param s2StartTime When to apply the S2 stimulus
 * @param s2Duration Duration of the S2 stimulus
 * @returns Updated tissue state
 */
export function s1s2StimulusProtocol(
  tissue: TissueData,
  time: number,
  s1StartTime: number = 1.0,
  s1Duration: number = 1.0,
  s2StartTime: number = 30.0,
  s2Duration: number = 1.0
): TissueData {
  // S1 stimulus (planar wave from left)
  if (time >= s1StartTime && time < s1StartTime + s1Duration) {
    return applyTissueStimulus(tissue, 1.0, 0, 0, 5, tissue.v.length);
  }
  
  // S2 stimulus (focal point in middle-right)
  if (time >= s2StartTime && time < s2StartTime + s2Duration) {
    const rows = tissue.v.length;
    const cols = tissue.v[0].length;
    return applyTissueStimulus(
      tissue, 
      1.0, 
      Math.floor(rows * 0.5) - 5, 
      Math.floor(cols * 0.75) - 5, 
      10, 
      10
    );
  }
  
  return tissue;
}

/**
 * Apply a circular conduction obstacle to a tissue
 * 
 * @param tissue Current tissue state
 * @param centerRow Center row of the obstacle
 * @param centerCol Center column of the obstacle
 * @param radius Radius of the circular obstacle
 * @returns New tissue with obstacle applied
 */
export function applyCircularObstacle(
  tissue: TissueData,
  centerRow: number,
  centerCol: number,
  radius: number
): TissueData {
  const { v, h, time } = tissue;
  const rows = v.length;
  const cols = v[0].length;
  
  // Create deep copies of the arrays
  const newV = v.map(row => [...row]);
  const newH = h.map(row => [...row]);
  
  // Apply the circular obstacle
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Calculate distance from center
      const distance = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
      
      // If within the radius, set to zero conductivity
      if (distance <= radius) {
        // Set to resting values that won't change
        newV[i][j] = 0.0;  // Resting voltage
        newH[i][j] = 0.0;  // Inactivated gate (won't allow current flow)
      }
    }
  }
  
  return {
    v: newV,
    h: newH,
    time
  };
}

/**
 * Perform a single time step in the tissue simulation
 * 
 * @param tissue Current tissue state
 * @param params Tissue parameters
 * @param applyStimulus Function to apply stimulus
 * @param hasObstacle Whether the tissue has a conduction obstacle
 * @param obstacleCenter Center coordinates of obstacle {row, col}
 * @param obstacleRadius Radius of the obstacle
 * @param hasRepolarizationGradient Whether to apply repolarization gradient
 * @param tauCloseValues Tau close values for gradient {left, right}
 * @returns Updated tissue state
 */
export function stepTissue(
  tissue: TissueData,
  params: TissueParams = DEFAULT_TISSUE_PARAMS,
  applyStimulus: (tissue: TissueData, time: number) => TissueData = (t) => t,
  hasObstacle: boolean = false,
  obstacleCenter: {row: number, col: number} = {row: 0, col: 0},
  obstacleRadius: number = 10,
  hasRepolarizationGradient: boolean = false,
  tauCloseValues: {left: number, right: number} = {left: 80, right: 80}
): TissueData {
  const { v, h, time } = tissue;
  const { 
    diffusionCoefficient,
    deltax,
    dt,
    tau_in,
    tau_out,
    tau_open,
    tau_close,
    v_gate
  } = params;
  
  const rows = v.length;
  const cols = v[0].length;
  
  // Apply stimulus first
  const stimulatedTissue = applyStimulus(tissue, time);
  
  // Create new arrays for the updated values
  const newV: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  const newH: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Compute diffusion coefficient for numerical stability
  const D = diffusionCoefficient;
  
  // Compute the new values using the reaction-diffusion equation
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // If we have an obstacle and this point is inside it, keep values fixed
      if (hasObstacle) {
        const distance = Math.sqrt(Math.pow(i - obstacleCenter.row, 2) + Math.pow(j - obstacleCenter.col, 2));
        if (distance <= obstacleRadius) {
          newV[i][j] = stimulatedTissue.v[i][j];
          newH[i][j] = stimulatedTissue.h[i][j];
          continue;
        }
      }
      
      // Current values
      const volt = stimulatedTissue.v[i][j];
      const gate = stimulatedTissue.h[i][j];
      
      // Mitchell Schaeffer cell model components
      const J_in = (gate * volt * volt * (1 - volt)) / tau_in;
      const J_out = -volt / tau_out;
      
      // Get neighboring voltages for diffusion term
      const left = j > 0 ? stimulatedTissue.v[i][j-1] : volt;
      const right = j < cols - 1 ? stimulatedTissue.v[i][j+1] : volt;
      const top = i > 0 ? stimulatedTissue.v[i-1][j] : volt;
      const bottom = i < rows - 1 ? stimulatedTissue.v[i+1][j] : volt;
      
      // Discrete Laplacian for 2D diffusion
      const diffusion = D * (
        (left + right + top + bottom - 4 * volt) / (deltax * deltax)
      );
      
      // Compute voltage derivative
      const dv = diffusion + J_in + J_out;
      
      // Update voltage using forward Euler method
      newV[i][j] = volt + dt * dv;
      
      // Ensure voltage stays within bounds [0,1]
      newV[i][j] = Math.min(1.0, Math.max(0.0, newV[i][j]));
      
      // Use repolarization gradient if enabled
      let localTauClose = tau_close;
      if (hasRepolarizationGradient) {
        // Linearly interpolate tau_close value based on column position
        const position = j / (cols - 1);  // 0 at left, 1 at right
        localTauClose = tauCloseValues.left + position * (tauCloseValues.right - tauCloseValues.left);
      }
      
      // Update inactivation gate
      if (volt < v_gate) {
        newH[i][j] = gate + dt * ((1 - gate) / tau_open);
      } else {
        newH[i][j] = gate + dt * (-gate / localTauClose);
      }
      
      // Ensure gate variable stays within bounds [0,1]
      newH[i][j] = Math.min(1.0, Math.max(0.0, newH[i][j]));
    }
  }
  
  return {
    v: newV,
    h: newH,
    time: time + dt
  };
}

/**
 * Simulate the tissue for a given duration with the specified stimulus function
 * 
 * @param params Tissue parameters
 * @param duration Total simulation duration (default 1000 for MS model)
 * @param stimulusFn Function to apply stimulus
 * @param saveInterval How often to save snapshots
 * @param hasObstacle Whether to include a conduction obstacle
 * @param obstacleCenter Center of the obstacle {row, col}
 * @param obstacleRadius Radius of the obstacle
 * @param hasRepolarizationGradient Whether to apply repolarization gradient
 * @param tauCloseValues Tau close values for gradient {left, right}
 * @returns Simulation results
 */
export function simulateTissue(
  params: TissueParams = DEFAULT_TISSUE_PARAMS,
  duration: number = 1000,  // Increased to 1000 for Mitchell Schaeffer model
  stimulusFn: (tissue: TissueData, time: number) => TissueData = (t) => t,
  saveInterval: number = 2.0,  // Increased to 2.0 to reduce memory usage with longer simulation
  hasObstacle: boolean = false,
  obstacleCenter: {row: number, col: number} = {row: 0, col: 0},
  obstacleRadius: number = 10,
  hasRepolarizationGradient: boolean = false,
  tauCloseValues: {left: number, right: number} = {left: 80, right: 80}
): TissueSimulationResults {
  // Initialize tissue
  let tissue = initializeTissue(params);
  
  // Apply circular obstacle if enabled
  if (hasObstacle) {
    tissue = applyCircularObstacle(
      tissue, 
      obstacleCenter.row, 
      obstacleCenter.col, 
      obstacleRadius
    );
  }
  
  // Initialize results
  const results: TissueSimulationResults = {
    snapshots: [],
    activationTimes: Array(params.rows).fill(0).map(() => Array(params.cols).fill(-1)),
    apd: Array(params.rows).fill(0).map(() => Array(params.cols).fill(0))
  };
  
  // Activation threshold for detecting when a cell activates
  const activationThreshold = 0.3;
  
  // Arrays to track cell state for APD calculation
  const activationTime = Array(params.rows).fill(0).map(() => Array(params.cols).fill(-1));
  const isActivated = Array(params.rows).fill(0).map(() => Array(params.cols).fill(false));
  
  // Save initial state
  results.snapshots.push(JSON.parse(JSON.stringify(tissue)));
  
  // Run simulation for the specified duration
  let nextSaveTime = saveInterval;
  
  while (tissue.time < duration) {
    // Step the simulation
    tissue = stepTissue(
      tissue, 
      params, 
      stimulusFn,
      hasObstacle,
      obstacleCenter,
      obstacleRadius,
      hasRepolarizationGradient,
      tauCloseValues
    );
    
    // Track activation times and APD
    for (let i = 0; i < params.rows; i++) {
      for (let j = 0; j < params.cols; j++) {
        // Skip obstacle cells
        if (hasObstacle) {
          const distance = Math.sqrt(Math.pow(i - obstacleCenter.row, 2) + Math.pow(j - obstacleCenter.col, 2));
          if (distance <= obstacleRadius) {
            continue;
          }
        }
        
        // Detect activation
        if (!isActivated[i][j] && tissue.v[i][j] > activationThreshold) {
          isActivated[i][j] = true;
          activationTime[i][j] = tissue.time;
          
          // If this is the first activation for this cell, record it
          if (results.activationTimes[i][j] < 0) {
            results.activationTimes[i][j] = tissue.time;
          }
        }
        
        // Detect repolarization for APD calculation
        if (isActivated[i][j] && tissue.v[i][j] < activationThreshold) {
          // Only calculate APD if we have a valid activation time
          if (activationTime[i][j] >= 0) {
            // APD is the time from activation to repolarization
            results.apd[i][j] = tissue.time - activationTime[i][j];
          }
          
          // Reset for next action potential
          isActivated[i][j] = false;
          activationTime[i][j] = -1;
        }
      }
    }
    
    // Save snapshots at the specified interval
    if (tissue.time >= nextSaveTime) {
      results.snapshots.push(JSON.parse(JSON.stringify(tissue)));
      nextSaveTime += saveInterval;
    }
  }
  
  return results;
} 