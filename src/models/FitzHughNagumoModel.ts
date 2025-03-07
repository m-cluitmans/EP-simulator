/**
 * FitzHugh-Nagumo Model
 * 
 * A simplified two-variable model for excitable media that can simulate 
 * action potential generation and propagation.
 * 
 * dv/dt = v - v^3/3 - w + I
 * dw/dt = epsilon * (v - a - b * w)
 * 
 * where:
 * - v: membrane voltage (fast variable)
 * - w: recovery variable (slow variable)
 * - I: applied current/stimulus
 * - a, b, epsilon: parameters that control the model behavior
 */

export interface FhnParams {
  a: number;         // Parameter for rest state
  b: number;         // Recovery parameter
  epsilon: number;   // Time scale parameter
  I: number;         // Applied current/stimulus
  dt: number;        // Time step
}

export interface FhnResults {
  time: number[];
  v: number[];    // Voltage variable
  w: number[];    // Recovery variable
}

/**
 * Default parameters for the FitzHugh-Nagumo model that produce
 * action potential-like behavior
 */
export const DEFAULT_FHN_PARAMS: FhnParams = {
  a: 0.7,
  b: 0.8, 
  epsilon: 0.08,
  I: 0.0,
  dt: 0.01
};

/**
 * Simulate the FitzHugh-Nagumo model over a given time span
 * 
 * @param params Model parameters
 * @param timeSpan Total simulation time
 * @param initialV Initial voltage value
 * @param initialW Initial recovery value
 * @returns Results containing time, voltage, and recovery variable arrays
 */
export function simulateFitzHughNagumo(
  params: FhnParams = DEFAULT_FHN_PARAMS,
  timeSpan: number = 100,
  initialV: number = -0.5,
  initialW: number = 0.0
): FhnResults {
  const { a, b, epsilon, I, dt } = params;
  
  // Initial conditions
  let v = initialV;
  let w = initialW;
  
  const results: FhnResults = { time: [], v: [], w: [] };
  
  // Time integration using forward Euler method
  for (let t = 0; t < timeSpan; t += dt) {
    // Record current state
    results.time.push(t);
    results.v.push(v);
    results.w.push(w);
    
    // Model equations
    const dv = v - Math.pow(v, 3)/3 - w + I;
    const dw = epsilon * (v - a - b * w);
    
    // Update state using forward Euler method
    v += dt * dv;
    w += dt * dw;
  }
  
  return results;
}

/**
 * Apply a stimulus pulse to the model
 * 
 * @param baseParams Base parameters
 * @param stimulusAmplitude Amplitude of the stimulus
 * @param stimulusDuration Duration of the stimulus in time units
 * @param stimulusStart When to start the stimulus
 * @param timeSpan Total simulation time
 * @returns Results with the applied stimulus
 */
export function applyStimulus(
  baseParams: FhnParams = DEFAULT_FHN_PARAMS,
  stimulusAmplitude: number = 0.5,
  stimulusDuration: number = 1.0,
  stimulusStart: number = 5.0,
  timeSpan: number = 100
): FhnResults {
  const { a, b, epsilon, dt } = baseParams;
  
  // Initial conditions
  let v = -0.5;
  let w = 0.0;
  
  const results: FhnResults = { time: [], v: [], w: [] };
  
  // Time integration
  for (let t = 0; t < timeSpan; t += dt) {
    // Determine if stimulus is active
    const I = (t >= stimulusStart && t < stimulusStart + stimulusDuration) 
      ? stimulusAmplitude 
      : 0;
    
    // Record current state
    results.time.push(t);
    results.v.push(v);
    results.w.push(w);
    
    // Model equations
    const dv = v - Math.pow(v, 3)/3 - w + I;
    const dw = epsilon * (v - a - b * w);
    
    // Update state using forward Euler method
    v += dt * dv;
    w += dt * dw;
  }
  
  return results;
}

/**
 * Calculate action potential duration (APD)
 * 
 * @param results Simulation results
 * @param threshold Voltage threshold for APD calculation
 * @returns APD value
 */
export function calculateAPD(results: FhnResults, threshold: number = 0.0): number {
  const { time, v } = results;
  
  // Find upstroke (when voltage crosses threshold going up)
  let upstrokeIndex = -1;
  for (let i = 1; i < v.length; i++) {
    if (v[i-1] < threshold && v[i] >= threshold) {
      upstrokeIndex = i;
      break;
    }
  }
  
  if (upstrokeIndex === -1) return 0; // No action potential detected
  
  // Find repolarization (when voltage crosses threshold going down)
  let repolarizationIndex = -1;
  for (let i = upstrokeIndex + 1; i < v.length; i++) {
    if (v[i-1] >= threshold && v[i] < threshold) {
      repolarizationIndex = i;
      break;
    }
  }
  
  if (repolarizationIndex === -1) return 0; // No complete action potential detected
  
  // Calculate APD
  return time[repolarizationIndex] - time[upstrokeIndex];
}

/**
 * Calculate maximum upstroke velocity (dV/dt max)
 * 
 * @param results Simulation results
 * @returns Maximum upstroke velocity
 */
export function calculateMaxUpstrokeVelocity(results: FhnResults): number {
  const { v, time } = results;
  let maxDvDt = 0;
  
  for (let i = 1; i < v.length; i++) {
    const dt = time[i] - time[i-1];
    const dvdt = (v[i] - v[i-1]) / dt;
    if (dvdt > maxDvDt) {
      maxDvDt = dvdt;
    }
  }
  
  return maxDvDt;
} 