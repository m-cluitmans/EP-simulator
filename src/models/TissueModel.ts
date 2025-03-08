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
 * Simulate tissue for a given duration with a specified stimulus function
 * 
 * @param params Tissue parameters
 * @param duration Total simulation duration
 * @param stimulusFn Function to apply stimulus at each time step
 * @param saveInterval How often to save snapshots (in time units)
 * @param hasObstacle Whether the tissue has a conduction obstacle
 * @param obstacleCenter Center coordinates of obstacle {row, col}
 * @param obstacleRadius Radius of the obstacle
 * @param hasRepolarizationGradient Whether to apply repolarization gradient
 * @param tauCloseValues Tau close values for gradient {left, right}
 * @param progressCallback Optional callback function to report progress (0-100)
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
  tauCloseValues: {left: number, right: number} = {left: 80, right: 80},
  progressCallback?: (progress: number) => void
): TissueSimulationResults {
  const { dt } = params;
  
  // Initialize tissue
  let tissue = initializeTissue(params);
  
  // Apply obstacle if requested
  if (hasObstacle) {
    tissue = applyCircularObstacle(tissue, obstacleCenter.row, obstacleCenter.col, obstacleRadius);
  }
  
  // Store results
  const snapshots: TissueData[] = [];
  
  // Parameters for activation time tracking
  const { rows, cols } = params;
  const activationTimes: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-1));
  const apd: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-1));
  
  // Track state for APD calculation
  const activationState: Array<Array<'resting' | 'activated' | 'recovered'>> = 
    Array(rows).fill(0).map(() => Array(cols).fill('resting'));
  
  // Time of first activation for APD calculation
  const activationStartTime: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-1));
  
  // Threshold for activation detection
  const activationThreshold = 0.3;
  
  // Run simulation for the specified duration
  let nextSaveTime = 0;
  // Calculate total steps - useful for progress updates
  const numSteps = Math.ceil(duration / dt);
  let stepCount = 0;
  
  // Save initial state
  snapshots.push(JSON.parse(JSON.stringify(tissue)));
  
  for (let time = 0; time < duration; time += dt) {
    // Update progress roughly every 100 steps or at the end
    if (progressCallback && (stepCount % 100 === 0 || time + dt >= duration)) {
      const progress = Math.round((time / duration) * 100);
      progressCallback(progress);
    }
    
    // Apply stimulus for this time step
    tissue = stimulusFn(tissue, time);
    
    // Perform a simulation step
    tissue = stepTissue(
      tissue, 
      params, 
      (t) => t, // No additional stimulus here since we apply it before
      hasObstacle,
      obstacleCenter,
      obstacleRadius,
      hasRepolarizationGradient,
      tauCloseValues
    );
    
    // Save snapshots at regular intervals
    if (time >= nextSaveTime) {
      // Create a deep copy to avoid reference issues
      snapshots.push(JSON.parse(JSON.stringify(tissue)));
      nextSaveTime += saveInterval;
    }
    
    // Record activation times and APD
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Skip obstacle areas (cells that don't activate)
        if (hasObstacle) {
          const dx = i - obstacleCenter.row;
          const dy = j - obstacleCenter.col;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared <= obstacleRadius * obstacleRadius) {
            continue;
          }
        }
        
        const voltage = tissue.v[i][j];
        
        // Record local activation time (first time crossing threshold)
        if (activationTimes[i][j] < 0 && voltage >= activationThreshold) {
          activationTimes[i][j] = time;
        }
        
        // Track APD (Action Potential Duration)
        switch (activationState[i][j]) {
          case 'resting':
            if (voltage >= activationThreshold) {
              // Cell just activated
              activationState[i][j] = 'activated';
              activationStartTime[i][j] = time;
            }
            break;
            
          case 'activated':
            if (voltage < activationThreshold) {
              // Cell just repolarized - calculate APD
              activationState[i][j] = 'recovered';
              apd[i][j] = time - activationStartTime[i][j];
            }
            break;
            
          // Let recovered cells stay recovered for this simulation
          // In longer simulations, we'd reset to 'resting' after a recovery time
        }
      }
    }
    
    stepCount++;
  }
  
  return {
    snapshots,
    activationTimes,
    apd
  };
} 