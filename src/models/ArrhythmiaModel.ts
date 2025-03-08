import { TissueParams, TissueData, TissueSimulationResults, initializeTissue, stepTissue, applyTissueStimulus } from './TissueModel';

export interface ArrhythmiaSimulationParams extends TissueParams {
  s1Amplitude: number;
  s1Duration: number;
  s1StartTime: number;
  s2Amplitude: number;
  s2Duration: number;
  s2StartTime: number;
  s1Location: { row: number, col: number, width: number, height: number };
  s2Location: { row: number, col: number, width: number, height: number };
  fibrosisPattern: string;
  fibrosisDensity: number;
  simulationDuration: number;
  saveInterval: number;
}

export interface ArrhythmiaResults extends TissueSimulationResults {
  reentryDetected: boolean;
  blockDetected: boolean;
  reentryLocations?: { row: number, col: number }[];
  blockLocations?: { row: number, col: number }[];
}

/**
 * Apply the S1-S2 protocol to tissue, respecting fibrotic regions
 */
export function applyS1S2Protocol(
  tissue: TissueData,
  time: number,
  s1StartTime: number,
  s1Duration: number,
  s1Amplitude: number,
  s1Location: { row: number, col: number, width: number, height: number },
  s2StartTime: number,
  s2Duration: number,
  s2Amplitude: number,
  s2Location: { row: number, col: number, width: number, height: number }
): TissueData {
  let updatedTissue = { ...tissue };
  const { v, h } = tissue;
  
  // Apply S1 stimulus, respecting fibrotic regions
  if (time >= s1StartTime && time < s1StartTime + s1Duration) {
    // Create a deep copy of voltage array
    const newV = v.map(row => [...row]);
    
    // Apply stimulus only to non-fibrotic cells
    const endRow = Math.min(s1Location.row + s1Location.height, v.length);
    const endCol = Math.min(s1Location.col + s1Location.width, v[0].length);
    
    for (let i = s1Location.row; i < endRow; i++) {
      for (let j = s1Location.col; j < endCol; j++) {
        // Only apply stimulus to non-fibrotic cells (check if h > 0)
        if (h[i][j] > 0) {
          newV[i][j] += s1Amplitude;
          // Ensure voltage stays within bounds [0,1]
          newV[i][j] = Math.min(1.0, Math.max(0.0, newV[i][j]));
        }
      }
    }
    
    updatedTissue = {
      ...updatedTissue,
      v: newV
    };
  }
  
  // Apply S2 stimulus, respecting fibrotic regions
  if (time >= s2StartTime && time < s2StartTime + s2Duration) {
    // Create a deep copy of voltage array
    const newV = updatedTissue.v.map(row => [...row]);
    
    // Apply stimulus only to non-fibrotic cells
    const endRow = Math.min(s2Location.row + s2Location.height, v.length);
    const endCol = Math.min(s2Location.col + s2Location.width, v[0].length);
    
    for (let i = s2Location.row; i < endRow; i++) {
      for (let j = s2Location.col; j < endCol; j++) {
        // Only apply stimulus to non-fibrotic cells (check if h > 0)
        if (h[i][j] > 0) {
          newV[i][j] += s2Amplitude;
          // Ensure voltage stays within bounds [0,1]
          newV[i][j] = Math.min(1.0, Math.max(0.0, newV[i][j]));
        }
      }
    }
    
    updatedTissue = {
      ...updatedTissue,
      v: newV
    };
  }
  
  return updatedTissue;
}

/**
 * Simple pseudo-random number generator with seed
 * Based on a linear congruential generator
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  
  /**
   * Returns a pseudo-random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
  
  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Apply fibrosis pattern to tissue with a seed for reproducibility
 */
export function applyFibrosis(
  tissue: TissueData,
  pattern: string,
  density: number,
  seed: number = Date.now()
): TissueData {
  const { v, h, time } = tissue;
  const rows = v.length;
  const cols = v[0].length;
  
  console.log(`Applying ${pattern} fibrosis with density ${density} and seed ${seed}`);
  
  // Create random number generator with seed for reproducibility
  const random = new SeededRandom(seed);
  
  // Create deep copies of the arrays
  const newV = v.map(row => [...row]);
  const newH = h.map(row => [...row]);
  
  // Apply different fibrosis patterns based on the specified pattern
  switch (pattern) {
    case 'diffuse':
      // Randomly distributed fibrosis
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (random.next() < density) {
            // Set fibrotic cells to non-conductive
            newV[i][j] = 0.0;
            newH[i][j] = 0.0;
          }
        }
      }
      break;
      
    case 'compact':
      // Compact fibrosis - create a few large fibrotic regions
      const numRegions = Math.ceil(3 * density);
      for (let r = 0; r < numRegions; r++) {
        const centerRow = random.nextInt(0, rows - 1);
        const centerCol = random.nextInt(0, cols - 1);
        // Larger regions for compact fibrosis
        const regionSize = random.nextInt(20, 40);
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const distance = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
            // Higher probability within region for more solid appearance
            if (distance <= regionSize && random.next() < 0.9) {
              // Set fibrotic cells to non-conductive
              newV[i][j] = 0.0;
              newH[i][j] = 0.0;
            }
          }
        }
      }
      break;
      
    case 'patchy':
      // Patchy fibrosis - create multiple small-to-medium patches
      const numPatches = Math.ceil(30 * density);
      for (let p = 0; p < numPatches; p++) {
        const centerRow = random.nextInt(0, rows - 1);
        const centerCol = random.nextInt(0, cols - 1);
        // Smaller patches
        const patchSize = random.nextInt(3, 12);
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const distance = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
            if (distance <= patchSize && random.next() < 0.7) {
              // Set fibrotic cells to non-conductive
              newV[i][j] = 0.0;
              newH[i][j] = 0.0;
            }
          }
        }
      }
      break;
      
    default:
      // No fibrosis applied
      break;
  }
  
  return {
    v: newV,
    h: newH,
    time
  };
}

/**
 * Detect reentry in tissue by analyzing activation patterns
 */
export function detectReentry(results: TissueSimulationResults): {
  detected: boolean;
  locations: { row: number, col: number }[]
} {
  // Implementation of reentry detection algorithm
  const { snapshots } = results;
  const locations: { row: number, col: number }[] = [];
  
  // Simple algorithm: look for cells that activate multiple times with a certain pattern
  if (snapshots.length < 10) {
    return { detected: false, locations: [] };
  }
  
  const rows = snapshots[0].v.length;
  const cols = snapshots[0].v[0].length;
  
  // Track activation sequences
  const activationCount = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Check for multiple activations in the same region
  // We'll use a simple threshold-based approach
  const threshold = 0.7; // Voltage threshold for activation
  
  // Analyze middle to later snapshots (skip initial activation)
  const startIdx = Math.floor(snapshots.length / 3);
  for (let t = startIdx; t < snapshots.length; t++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Detect rising edge (activation)
        if (t > 0 && 
            snapshots[t].v[i][j] >= threshold && 
            snapshots[t-1].v[i][j] < threshold) {
          activationCount[i][j]++;
        }
      }
    }
  }
  
  // Identify regions with multiple activations (potential reentry)
  let hasReentry = false;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (activationCount[i][j] >= 2) {
        // Potential reentry site
        hasReentry = true;
        
        // Only collect a subset of points to avoid too many markers
        if (i % 5 === 0 && j % 5 === 0) {
          locations.push({ row: i, col: j });
        }
      }
    }
  }
  
  return { 
    detected: hasReentry, 
    locations: locations.slice(0, 20) // Limit number of locations
  };
}

/**
 * Detect conduction block in tissue
 */
export function detectConductionBlock(results: TissueSimulationResults): {
  detected: boolean;
  locations: { row: number, col: number }[]
} {
  const { snapshots, activationTimes } = results;
  const locations: { row: number, col: number }[] = [];
  
  if (!activationTimes || snapshots.length < 5) {
    return { detected: false, locations: [] };
  }
  
  const rows = activationTimes.length;
  const cols = activationTimes[0].length;
  
  // Look for sharp gradients in activation times (potential block sites)
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      // Skip non-activated regions (where activationTimes is still the initialized value)
      if (activationTimes[i][j] <= 0) continue;
      
      // Check left-right gradient
      const horizontalGradient = Math.abs(
        activationTimes[i][j+1] - activationTimes[i][j-1]
      );
      
      // Check up-down gradient
      const verticalGradient = Math.abs(
        activationTimes[i+1][j] - activationTimes[i-1][j]
      );
      
      // If gradient exceeds threshold, mark as potential block site
      if (horizontalGradient > 20 || verticalGradient > 20) {
        // Add to block locations (subsample to avoid too many markers)
        if (i % 3 === 0 && j % 3 === 0) {
          locations.push({ row: i, col: j });
        }
      }
    }
  }
  
  return { 
    detected: locations.length > 0,
    locations: locations.slice(0, 30) // Limit number of locations
  };
}

/**
 * Simulate arrhythmia mechanisms
 */
export function simulateArrhythmia(
  params: ArrhythmiaSimulationParams & { fibrosisSeed?: number },
  progressCallback?: (progress: number) => void
): ArrhythmiaResults {
  console.log("ArrhythmiaModel: starting simulation with params", params);
  
  // Warn about long simulations
  if (params.simulationDuration > 1000 && params.saveInterval < 2) {
    console.warn("ArrhythmiaModel: Long simulation with small save interval may consume a lot of memory");
  }
  
  // Optimize parameters for performance
  // For longer simulations, use a minimum step size to prevent excessive computation
  const optimizedParams = {
    ...params,
    dt: Math.max(params.dt, params.simulationDuration > 1000 ? 0.05 : 0.01)
  };
  
  // Initialize tissue
  let tissue = initializeTissue(optimizedParams);
  
  // Apply fibrosis if needed
  let fibroticCells: boolean[][] | null = null;
  if (params.fibrosisDensity > 0) {
    // Apply fibrosis
    tissue = applyFibrosis(
      tissue, 
      params.fibrosisPattern, 
      params.fibrosisDensity,
      params.fibrosisSeed
    );
    
    // Create a mask of fibrotic cells for maintaining them during simulation
    const rows = tissue.v.length;
    const cols = tissue.v[0].length;
    fibroticCells = Array(rows).fill(false).map(() => Array(cols).fill(false));
    
    // Mark cells that are fibrotic (h = 0)
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (tissue.h[i][j] === 0) {
          fibroticCells[i][j] = true;
        }
      }
    }
    
    console.log(`ArrhythmiaModel: Created fibrosis mask with pattern ${params.fibrosisPattern}`);
  }
  
  // Prepare data structures for results
  const snapshots: TissueData[] = [];
  const rows = optimizedParams.rows;
  const cols = optimizedParams.cols;
  
  // For tracking activation times and APD
  const activationTimes: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(-1));
  const apd: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Track if cells are in active state for APD calculation
  const isActive: boolean[][] = Array(rows).fill(0).map(() => Array(cols).fill(false));
  
  // Activation threshold
  const activationThreshold = 0.5;
  
  // Time steps
  const numSteps = Math.floor(optimizedParams.simulationDuration / optimizedParams.dt);
  const saveInterval = Math.floor(optimizedParams.saveInterval / optimizedParams.dt);
  
  console.log(`ArrhythmiaModel: running simulation for ${numSteps} steps, saving every ${saveInterval} steps`);
  console.log(`ArrhythmiaModel: estimated frames: ${Math.floor(numSteps / saveInterval) + 1}`);
  
  // Always save the initial state
  snapshots.push({...tissue});
  
  // Optimize for large simulations by dynamically adjusting the progress callback frequency
  const progressUpdateFrequency = Math.max(1, Math.floor(numSteps / 100));
  
  // Simulate
  for (let step = 0; step < numSteps; step++) {
    // Current time
    const currentTime = step * optimizedParams.dt;
    
    // Apply S1-S2 protocol stimulus
    tissue = applyS1S2Protocol(
      tissue,
      currentTime,
      optimizedParams.s1StartTime,
      optimizedParams.s1Duration,
      optimizedParams.s1Amplitude,
      optimizedParams.s1Location,
      optimizedParams.s2StartTime,
      optimizedParams.s2Duration,
      optimizedParams.s2Amplitude,
      optimizedParams.s2Location
    );
    
    // Take a simulation step
    tissue = stepTissue(tissue, optimizedParams);
    
    // Re-enforce fibrotic cells after each step if needed
    if (fibroticCells) {
      const newV = tissue.v.map(row => [...row]);
      const newH = tissue.h.map(row => [...row]);
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (fibroticCells[i][j]) {
            // Reset fibrotic cells to non-conductive state
            newV[i][j] = 0.0;
            newH[i][j] = 0.0;
          }
        }
      }
      
      tissue = {
        ...tissue,
        v: newV,
        h: newH
      };
    }
    
    // For performance, only calculate activation times every few steps for long simulations
    const shouldCalculateActivation = 
      optimizedParams.simulationDuration <= 500 || step % Math.max(1, Math.floor(saveInterval / 2)) === 0;
    
    if (shouldCalculateActivation) {
      // Calculate activation times and APD
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          // Skip fibrotic cells
          if (fibroticCells && fibroticCells[i][j]) continue;
          
          // Track activation times (first crossing of threshold)
          if (tissue.v[i][j] > activationThreshold && !isActive[i][j]) {
            if (activationTimes[i][j] === -1) {
              activationTimes[i][j] = currentTime;
            }
            isActive[i][j] = true;
          }
          
          // Track repolarization (for APD calculation)
          if (tissue.v[i][j] < activationThreshold && isActive[i][j]) {
            // Cell has repolarized, calculate APD
            if (activationTimes[i][j] !== -1) {
              apd[i][j] = currentTime - activationTimes[i][j];
            }
            isActive[i][j] = false;
          }
        }
      }
    }
    
    // Save snapshots at specified intervals
    if (step % saveInterval === 0 || step === numSteps - 1) {
      // Create a deep copy to prevent reference issues
      const snapshotCopy = {
        v: tissue.v.map(row => [...row]),
        h: tissue.h.map(row => [...row]),
        time: tissue.time
      };
      snapshots.push(snapshotCopy);
      
      // For very long simulations, report intermediate progress more frequently
      if (optimizedParams.simulationDuration > 1000 && progressCallback && snapshots.length % 10 === 0) {
        console.log(`ArrhythmiaModel: captured ${snapshots.length} snapshots so far`);
      }
    }
    
    // Report progress
    if (progressCallback && step % progressUpdateFrequency === 0) {
      progressCallback((step / numSteps) * 100);
    }
  }
  
  console.log(`ArrhythmiaModel: simulation complete, captured ${snapshots.length} snapshots`);
  
  // Create simulation results
  const results: TissueSimulationResults = {
    snapshots,
    activationTimes,
    apd
  };
  
  // Detect arrhythmia patterns
  const reentry = detectReentry(results);
  const block = detectConductionBlock(results);
  
  // Return arrhythmia-specific results
  const arrhythmiaResults: ArrhythmiaResults = {
    ...results,
    reentryDetected: reentry.detected,
    reentryLocations: reentry.locations,
    blockDetected: block.detected,
    blockLocations: block.locations
  };
  
  console.log("ArrhythmiaModel: returning results", {
    snapshotCount: arrhythmiaResults.snapshots.length,
    reentryDetected: arrhythmiaResults.reentryDetected,
    blockDetected: arrhythmiaResults.blockDetected,
    simulationDuration: params.simulationDuration,
    timeSpan: arrhythmiaResults.snapshots[arrhythmiaResults.snapshots.length - 1].time - 
              arrhythmiaResults.snapshots[0].time
  });
  
  return arrhythmiaResults;
} 