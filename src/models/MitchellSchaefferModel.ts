/**
 * Mitchell Schaeffer Model
 * 
 * A phenomenological model for cardiac cell excitation with parameters that 
 * have physiological interpretation, producing realistic action potentials.
 * 
 * dv/dt = (J_in + J_out + J_stim)
 * where:
 *   J_in = (h*v^2*(1-v))/tau_in (fast inward current)
 *   J_out = -v/tau_out (slow outward current)
 * 
 * dh/dt = (1-h)/tau_open if v < v_gate, otherwise -h/tau_close
 * 
 * where:
 * - v: membrane voltage (0 to 1)
 * - h: inactivation gate variable (0 to 1)
 * - tau_in: depolarization time constant
 * - tau_out: repolarization time constant
 * - tau_open: recovery time constant
 * - tau_close: inactivation time constant
 * - v_gate: threshold voltage for gate dynamics (typically 0.13)
 */

export interface MsParams {
  tau_in: number;     // Depolarization time constant
  tau_out: number;    // Repolarization time constant
  tau_open: number;   // Recovery time constant
  tau_close: number;  // Inactivation time constant
  v_gate: number;     // Threshold voltage for gate dynamics
  dt: number;         // Time step
}

export interface MsResults {
  time: number[];
  v: number[];    // Voltage variable
  h: number[];    // Inactivation gate variable
}

/**
 * Default parameters for the Mitchell Schaeffer model that produce
 * physiologically reasonable action potentials
 */
export const DEFAULT_MS_PARAMS: MsParams = {
  tau_in: 0.3,
  tau_out: 6.0,
  tau_open: 120.0,
  tau_close: 80.0,
  v_gate: 0.13,
  dt: 0.01
};

/**
 * Simulate the Mitchell Schaeffer model over a given time span
 * 
 * @param params Model parameters
 * @param timeSpan Total simulation time
 * @param initialV Initial voltage value
 * @param initialH Initial inactivation gate value
 * @returns Results containing time, voltage, and inactivation gate arrays
 */
export function simulateMitchellSchaeffer(
  params: MsParams = DEFAULT_MS_PARAMS,
  timeSpan: number = 100,
  initialV: number = 0.0,
  initialH: number = 1.0,
  stimulus: (t: number) => number = () => 0 // Optional stimulus function
): MsResults {
  const { tau_in, tau_out, tau_open, tau_close, v_gate, dt } = params;
  
  // Initial conditions
  let v = initialV;
  let h = initialH;
  
  const results: MsResults = { time: [], v: [], h: [] };
  
  // Time integration using forward Euler method
  for (let t = 0; t < timeSpan; t += dt) {
    // Record current state
    results.time.push(t);
    results.v.push(v);
    results.h.push(h);
    
    // External stimulus at this time point
    const I_stim = stimulus(t);
    
    // Model equations
    const J_in = (h * v * v * (1 - v)) / tau_in;
    const J_out = -v / tau_out;
    
    // Compute voltage derivative
    const dv = J_in + J_out + I_stim;
    
    // Compute gate variable derivative based on voltage threshold
    let dh;
    if (v < v_gate) {
      dh = (1 - h) / tau_open;
    } else {
      dh = -h / tau_close;
    }
    
    // Update state using forward Euler method
    v += dt * dv;
    h += dt * dh;
    
    // Ensure v stays within [0,1]
    v = Math.max(0, Math.min(1, v));
    
    // Ensure h stays within [0,1]
    h = Math.max(0, Math.min(1, h));
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
  baseParams: MsParams = DEFAULT_MS_PARAMS,
  stimulusAmplitude: number = 1.0,
  stimulusDuration: number = 1.0,
  stimulusStart: number = 5.0,
  timeSpan: number = 100
): MsResults {
  // Create stimulus function that applies the specified pulse
  const stimulusFn = (t: number): number => {
    if (t >= stimulusStart && t < stimulusStart + stimulusDuration) {
      return stimulusAmplitude;
    }
    return 0;
  };
  
  return simulateMitchellSchaeffer(baseParams, timeSpan, 0, 1, stimulusFn);
}

/**
 * Calculate the Action Potential Duration (APD) from simulation results.
 * APD is defined as the time between activation (crossing a threshold during depolarization)
 * and repolarization (crossing the same threshold during recovery).
 * 
 * @param results Simulation results
 * @param threshold Voltage threshold for APD calculation (typically 0.1)
 * @returns APD value or -1 if cannot be calculated
 */
export function calculateAPD(results: MsResults, threshold: number = 0.1): number {
  const { time, v } = results;
  
  // Find activation time (first crossing of threshold)
  let activationIndex = -1;
  for (let i = 1; i < v.length; i++) {
    if (v[i-1] < threshold && v[i] >= threshold) {
      activationIndex = i;
      break;
    }
  }
  
  if (activationIndex === -1) return -1;
  
  // Find repolarization time (crossing threshold after peak)
  // First, find the peak
  let peakIndex = activationIndex;
  for (let i = activationIndex; i < v.length; i++) {
    if (v[i] > v[peakIndex]) {
      peakIndex = i;
    } else if (v[i] < v[peakIndex] * 0.9) {
      // We're clearly past the peak if voltage drops below 90% of peak
      break;
    }
  }
  
  // Now find repolarization time
  let repolarizationIndex = -1;
  for (let i = peakIndex; i < v.length - 1; i++) {
    if (v[i] > threshold && v[i+1] <= threshold) {
      repolarizationIndex = i + 1;
      break;
    }
  }
  
  if (repolarizationIndex === -1) return -1;
  
  // Calculate APD
  return time[repolarizationIndex] - time[activationIndex];
}

/**
 * Calculate the maximum upstroke velocity (dV/dt max) during depolarization
 * 
 * @param results Simulation results
 * @returns Maximum upstroke velocity
 */
export function calculateMaxUpstrokeVelocity(results: MsResults): number {
  const { v, time } = results;
  let maxUpstroke = 0;
  
  for (let i = 1; i < v.length; i++) {
    const dvdt = (v[i] - v[i-1]) / (time[i] - time[i-1]);
    if (dvdt > maxUpstroke) {
      maxUpstroke = dvdt;
    }
  }
  
  return maxUpstroke;
}

/**
 * Presets for different cell types or conditions
 */
export const MS_CELL_PRESETS: Record<string, Partial<MsParams>> = {
  "Normal Cell": DEFAULT_MS_PARAMS,
  "Slow Conduction": {
    tau_in: 0.5,     // Slower depolarization
    tau_out: 6.0,
    tau_open: 120.0,
    tau_close: 80.0,
    v_gate: 0.13
  },
  "Long APD": {
    tau_in: 0.3,
    tau_out: 12.0,    // Slower repolarization = longer APD
    tau_open: 120.0,
    tau_close: 80.0,
    v_gate: 0.13
  },
  "Short APD": {
    tau_in: 0.3,
    tau_out: 3.0,     // Faster repolarization = shorter APD
    tau_open: 120.0,
    tau_close: 80.0,
    v_gate: 0.13
  },
  "Reduced Excitability": {
    tau_in: 0.3,
    tau_out: 6.0,
    tau_open: 180.0,  // Slower recovery
    tau_close: 80.0,
    v_gate: 0.15      // Higher threshold
  }
}; 