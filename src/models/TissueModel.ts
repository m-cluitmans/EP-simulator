/**
 * Tissue Model
 * 
 * Implementation of a 2D reaction-diffusion model for cardiac tissue
 * using the FitzHugh-Nagumo model for cell dynamics.
 * 
 * The model solves the system:
 *   dv/dt = D*∇²v + f(v,w)
 *   dw/dt = g(v,w)
 * 
 * where:
 * - v is the voltage
 * - w is the recovery variable
 * - D is the diffusion coefficient (related to tissue conductivity)
 * - f(v,w) and g(v,w) are from the FitzHugh-Nagumo model
 */

import { FhnParams, DEFAULT_FHN_PARAMS } from './FitzHughNagumoModel';

export interface TissueParams extends FhnParams {
  rows: number;                // Number of rows in the tissue grid
  cols: number;                // Number of columns in the tissue grid
  diffusionCoefficient: number;// Diffusion coefficient
  deltax: number;              // Spatial step size
}

export interface TissueData {
  v: number[][];              // Voltage at each grid point
  w: number[][];              // Recovery variable at each grid point
  time: number;               // Current simulation time
}

export interface TissueSimulationResults {
  snapshots: TissueData[];    // Snapshots at each saved time step
  activationTimes: number[][]; // Local activation times
  apd: number[][];            // Action potential durations
}

/**
 * Default parameters for the tissue model - optimized for wave propagation
 * These differ from single cell parameters to ensure stable wave dynamics
 */
export const DEFAULT_TISSUE_PARAMS: TissueParams = {
  // Cell parameters optimized for tissue propagation
  a: 0.45,      // Lower than single cell for better excitability in tissue
  b: 0.23,      // Lower recovery influence for better wave stability
  epsilon: 0.08, // Kept the same as single cell
  I: 0.0,        // No baseline current
  dt: 0.01,      // Time step
  
  // Tissue-specific parameters
  rows: 100,
  cols: 100,
  diffusionCoefficient: 1.0,
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
  
  // Initialize arrays for voltage and recovery variables
  const v: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-0.5));
  const w: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0.0));
  
  return {
    v,
    w,
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
  const { v, w, time } = tissue;
  const newV = v.map(row => [...row]);
  
  // Apply stimulus to the specified region
  for (let i = startRow; i < startRow + height && i < v.length; i++) {
    for (let j = startCol; j < startCol + width && j < v[0].length; j++) {
      newV[i][j] = stimulusValue;
    }
  }
  
  return {
    v: newV,
    w,
    time
  };
}

/**
 * Compute the next step in the tissue simulation
 * 
 * @param tissue Current tissue state
 * @param params Tissue parameters
 * @returns Updated tissue state
 */
export function stepTissue(tissue: TissueData, params: TissueParams = DEFAULT_TISSUE_PARAMS): TissueData {
  const { v, w, time } = tissue;
  const { rows, cols, diffusionCoefficient, deltax, dt, a, b, epsilon } = params;
  
  // Create new arrays for the updated values
  const newV: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  const newW: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Diffusion coefficient in numerical scheme
  const D = diffusionCoefficient * dt / (deltax * deltax);
  
  // Update each cell in the grid
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Get current values
      const currentV = v[i][j];
      const currentW = w[i][j];
      
      // Calculate Laplacian (diffusion term) using 5-point stencil
      let laplacian = 0;
      
      // Add contributions from neighbors, handling boundary conditions
      if (i > 0) laplacian += v[i-1][j] - currentV;
      if (i < rows-1) laplacian += v[i+1][j] - currentV;
      if (j > 0) laplacian += v[i][j-1] - currentV;
      if (j < cols-1) laplacian += v[i][j+1] - currentV;
      
      // FitzHugh-Nagumo dynamics
      const dvdt = currentV - Math.pow(currentV, 3)/3 - currentW + D * laplacian;
      const dwdt = epsilon * (currentV - a - b * currentW);
      
      // Update using forward Euler method
      newV[i][j] = currentV + dt * dvdt;
      newW[i][j] = currentW + dt * dwdt;
    }
  }
  
  return {
    v: newV,
    w: newW,
    time: time + dt
  };
}

/**
 * Run a full tissue simulation for a given duration
 * 
 * @param params Tissue parameters
 * @param duration Total simulation duration
 * @param stimulationPattern Function to apply stimuli
 * @param saveInterval Time interval for saving snapshots
 * @returns Results of the simulation
 */
export function simulateTissue(
  params: TissueParams = DEFAULT_TISSUE_PARAMS,
  duration: number = 100,
  stimulationPattern: (tissue: TissueData, time: number) => TissueData,
  saveInterval: number = 1.0
): TissueSimulationResults {
  const { dt, rows, cols } = params;
  
  // Initialize tissue
  let tissue = initializeTissue(params);
  
  // Prepare results containers
  const snapshots: TissueData[] = [];
  const activationTimes: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-1));
  const apd: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Store activation status for APD calculation
  const activationStatus: boolean[][] = Array(rows).fill(0).map(() => Array(cols).fill(false));
  
  // Run simulation
  let nextSaveTime = 0;
  for (let time = 0; time < duration; time += dt) {
    // Apply stimulation at the current time
    tissue = stimulationPattern(tissue, time);
    
    // Save snapshot if it's time
    if (time >= nextSaveTime) {
      snapshots.push({
        v: tissue.v.map(row => [...row]),
        w: tissue.w.map(row => [...row]),
        time
      });
      nextSaveTime += saveInterval;
    }
    
    // Calculate activation times and APD
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Detect activation (crossing threshold from below)
        if (!activationStatus[i][j] && tissue.v[i][j] > 0.0) {
          activationStatus[i][j] = true;
          if (activationTimes[i][j] === -1) {
            activationTimes[i][j] = time;
          }
        }
        // Detect repolarization (crossing threshold from above)
        else if (activationStatus[i][j] && tissue.v[i][j] < 0.0) {
          activationStatus[i][j] = false;
          if (activationTimes[i][j] !== -1) {
            apd[i][j] = time - activationTimes[i][j];
          }
        }
      }
    }
    
    // Step simulation
    tissue = stepTissue(tissue, params);
  }
  
  return {
    snapshots,
    activationTimes,
    apd
  };
}

/**
 * Create a planar wave stimulus pattern (S1)
 * 
 * @param tissue Current tissue state
 * @param time Current simulation time
 * @param startTime When to start the stimulus
 * @param duration Duration of the stimulus
 * @param width Width of the stimulus region
 * @returns Updated tissue state with stimulus applied if appropriate
 */
export function planarWaveStimulus(
  tissue: TissueData,
  time: number,
  startTime: number = 1.0,
  duration: number = 1.0,
  width: number = 5
): TissueData {
  // Apply stimulus at the left edge of the tissue if within the stimulus time window
  if (time >= startTime && time < startTime + duration) {
    return applyTissueStimulus(
      tissue,
      1.0,  // stimulus strength
      0,    // start at top row
      0,    // start at leftmost column
      width,
      tissue.v.length // full height of tissue
    );
  }
  return tissue;
}

/**
 * Create an S1-S2 protocol stimulus pattern for studying reentry
 * 
 * @param tissue Current tissue state
 * @param time Current simulation time
 * @param s1StartTime When to start the S1 stimulus
 * @param s1Duration Duration of the S1 stimulus
 * @param s2StartTime When to start the S2 stimulus
 * @param s2Duration Duration of the S2 stimulus
 * @returns Updated tissue state with stimulus applied if appropriate
 */
export function s1s2StimulusProtocol(
  tissue: TissueData,
  time: number,
  s1StartTime: number = 1.0,
  s1Duration: number = 1.0,
  s2StartTime: number = 30.0,
  s2Duration: number = 1.0
): TissueData {
  const rows = tissue.v.length;
  const cols = tissue.v[0].length;
  
  // S1: Planar wave from left
  if (time >= s1StartTime && time < s1StartTime + s1Duration) {
    return applyTissueStimulus(
      tissue,
      1.0,  // stimulus strength
      0,    // start at top row
      0,    // start at leftmost column
      5,    // width
      rows  // full height
    );
  }
  
  // S2: Focal stimulus in the middle-right area
  if (time >= s2StartTime && time < s2StartTime + s2Duration) {
    return applyTissueStimulus(
      tissue,
      1.0,            // stimulus strength
      Math.floor(rows/2) - 10,  // middle-ish
      Math.floor(cols*2/3),     // right-ish
      20,             // width
      20              // height
    );
  }
  
  return tissue;
} 