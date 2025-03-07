import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FhnParams, FhnResults, DEFAULT_FHN_PARAMS, simulateFitzHughNagumo, applyStimulus } from '../../models/FitzHughNagumoModel';

interface CellState {
  params: FhnParams;
  results: FhnResults | null;
  simulationInProgress: boolean;
  selectedPreset: string;
  comparisonResults: FhnResults | null;
  showComparison: boolean;
}

// Define presets for different cell types or conditions
export const CELL_PRESETS = {
  NORMAL: 'Normal',
  REDUCED_SODIUM: 'Reduced Sodium',
  REDUCED_POTASSIUM: 'Reduced Potassium',
  INCREASED_CALCIUM: 'Increased Calcium',
  // The FitzHugh-Nagumo model doesn't directly map to ion channels,
  // but we can use parameter adjustments to mimic these effects
};

const initialState: CellState = {
  params: DEFAULT_FHN_PARAMS,
  results: null,
  simulationInProgress: false,
  selectedPreset: CELL_PRESETS.NORMAL,
  comparisonResults: null,
  showComparison: false,
};

export const cellSlice = createSlice({
  name: 'cell',
  initialState,
  reducers: {
    updateParameters: (state, action: PayloadAction<Partial<FhnParams>>) => {
      state.params = { ...state.params, ...action.payload };
    },
    
    setResults: (state, action: PayloadAction<FhnResults>) => {
      state.results = action.payload;
    },
    
    setSimulationStatus: (state, action: PayloadAction<boolean>) => {
      state.simulationInProgress = action.payload;
    },
    
    applyPreset: (state, action: PayloadAction<string>) => {
      state.selectedPreset = action.payload;
      
      // Apply different parameter sets based on the selected preset
      switch (action.payload) {
        case CELL_PRESETS.NORMAL:
          state.params = { ...DEFAULT_FHN_PARAMS };
          break;
          
        case CELL_PRESETS.REDUCED_SODIUM:
          // Reducing sodium would affect upstroke velocity
          // In FHN model, we can adjust the cubic term coefficient
          state.params = { 
            ...DEFAULT_FHN_PARAMS, 
            a: 0.75,  // Slightly increased 
            epsilon: 0.06  // Slowed dynamics
          };
          break;
          
        case CELL_PRESETS.REDUCED_POTASSIUM:
          // Reduced potassium affects repolarization
          state.params = { 
            ...DEFAULT_FHN_PARAMS, 
            b: 0.7,  // Reduced recovery rate
            epsilon: 0.07  // Slightly slowed dynamics
          };
          break;
          
        case CELL_PRESETS.INCREASED_CALCIUM:
          // Increased calcium affects plateau phase
          state.params = { 
            ...DEFAULT_FHN_PARAMS, 
            a: 0.65, // Lower threshold
            b: 0.9   // Stronger recovery
          };
          break;
          
        default:
          state.params = { ...DEFAULT_FHN_PARAMS };
      }
    },
    
    toggleComparison: (state) => {
      state.showComparison = !state.showComparison;
      
      // If enabling comparison, store the current results as comparison
      if (state.showComparison && state.results && !state.comparisonResults) {
        state.comparisonResults = state.results;
      }
    },
    
    clearComparison: (state) => {
      state.comparisonResults = null;
      state.showComparison = false;
    },
    
    setComparisonResults: (state, action: PayloadAction<FhnResults>) => {
      state.comparisonResults = action.payload;
    },
  },
});

export const { 
  updateParameters, 
  setResults, 
  setSimulationStatus,
  applyPreset,
  toggleComparison,
  clearComparison,
  setComparisonResults
} = cellSlice.actions;

export default cellSlice.reducer; 