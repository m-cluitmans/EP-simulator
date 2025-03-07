/**
 * Color scale utilities for visualizing cardiac electrophysiology data
 */

// TypeScript type for RGB color
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Interpolate between two colors
 * 
 * @param color1 First color
 * @param color2 Second color
 * @param factor Interpolation factor (0-1)
 * @returns Interpolated color
 */
export function interpolateColor(
  color1: RGBColor | undefined,
  color2: RGBColor | undefined,
  factor: number
): RGBColor {
  // Default colors if undefined
  const defaultColor: RGBColor = { r: 128, g: 128, b: 128 }; // Gray
  
  // Handle undefined colors
  if (!color1 && !color2) return defaultColor;
  if (!color1) return color2 || defaultColor;
  if (!color2) return color1;
  
  // Ensure factor is between 0 and 1
  const clampedFactor = Math.max(0, Math.min(1, factor));
  
  // Linear interpolation between the colors
  return {
    r: Math.round(color1.r + clampedFactor * (color2.r - color1.r)),
    g: Math.round(color1.g + clampedFactor * (color2.g - color1.g)),
    b: Math.round(color1.b + clampedFactor * (color2.b - color1.b)),
  };
}

/**
 * Convert an RGB color to a CSS color string
 * 
 * @param color RGB color object
 * @returns CSS color string
 */
export function rgbToString(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Create a color scale function that maps values to colors
 * 
 * @param minValue Minimum value in the data
 * @param maxValue Maximum value in the data
 * @param colorStops Array of colors to use for the scale
 * @returns Function that maps a value to a CSS color string
 */
export function createColorScale(
  minValue: number,
  maxValue: number,
  colorStops: RGBColor[]
): (value: number) => string {
  // Handle case when there are no color stops
  if (!colorStops || colorStops.length === 0) {
    return () => 'rgb(128, 128, 128)'; // Default gray
  }
  
  // Handle case when there's only one color stop
  if (colorStops.length === 1) {
    return () => rgbToString(colorStops[0]);
  }
  
  // Range of the data
  const range = maxValue - minValue;
  
  // Handle edge case where min and max are the same
  if (range === 0) {
    return () => rgbToString(colorStops[0]);
  }
  
  return (value: number) => {
    try {
      // Check for invalid values
      if (value === undefined || value === null || Number.isNaN(value)) {
        return rgbToString(colorStops[0]);
      }
      
      // Normalize the value to [0, 1]
      const normalized = (Math.max(minValue, Math.min(maxValue, value)) - minValue) / range;
      
      // Determine which segment of the color scale the value falls in
      const numSegments = colorStops.length - 1;
      const segment = Math.min(numSegments, Math.floor(normalized * numSegments));
      
      // Calculate the factor within this segment
      const segmentFactor = (normalized * numSegments) - segment;
      
      // Get the segment boundary colors
      const color1 = colorStops[segment];
      const color2 = colorStops[Math.min(segment + 1, colorStops.length - 1)];
      
      // Interpolate between the colors at the segment boundaries
      const color = interpolateColor(color1, color2, segmentFactor);
      
      return rgbToString(color);
    } catch (error) {
      console.warn('Error in color scale:', error);
      return 'rgb(128, 128, 128)'; // Default gray on error
    }
  };
}

/**
 * Predefined color scales for different visualizations
 */

// Voltage color scale (blue-white-red)
export const voltageColorStops: RGBColor[] = [
  { r: 0, g: 0, b: 255 },    // Blue for negative (resting)
  { r: 255, g: 255, b: 255 }, // White for zero
  { r: 255, g: 0, b: 0 }     // Red for positive (excited)
];

// Activation time color scale (blue to red rainbow)
export const activationTimeColorStops: RGBColor[] = [
  { r: 0, g: 0, b: 255 },    // Blue (early activation)
  { r: 0, g: 255, b: 255 },  // Cyan
  { r: 0, g: 255, b: 0 },    // Green
  { r: 255, g: 255, b: 0 },  // Yellow
  { r: 255, g: 0, b: 0 }     // Red (late activation)
];

// APD color scale (green-yellow-red)
export const apdColorStops: RGBColor[] = [
  { r: 0, g: 255, b: 0 },    // Green (short APD)
  { r: 255, g: 255, b: 0 },  // Yellow
  { r: 255, g: 0, b: 0 }     // Red (long APD)
];

/**
 * Create a voltage color scale (optimized for action potentials)
 * 
 * @param minVoltage Minimum voltage in the data
 * @param maxVoltage Maximum voltage in the data
 * @returns Color scale function for voltage
 */
export function createVoltageColorScale(
  minVoltage: number = 0.0,  // Mitchell Schaeffer voltage range is [0,1]
  maxVoltage: number = 1.0
): (voltage: number) => string {
  return createColorScale(minVoltage, maxVoltage, voltageColorStops);
}

/**
 * Create an activation time color scale
 * 
 * @param minTime Minimum activation time
 * @param maxTime Maximum activation time
 * @returns Color scale function for activation times
 */
export function createActivationTimeColorScale(
  minTime: number = 0,
  maxTime: number = 100
): (time: number) => string {
  return createColorScale(minTime, maxTime, activationTimeColorStops);
}

/**
 * Create an action potential duration (APD) color scale
 * 
 * @param minApd Minimum APD value
 * @param maxApd Maximum APD value
 * @returns Color scale function for APD
 */
export function createAPDColorScale(
  minApd: number = 0,
  maxApd: number = 50
): (apd: number) => string {
  return createColorScale(minApd, maxApd, apdColorStops);
} 