import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MsParams, MsResults, DEFAULT_MS_PARAMS, MS_CELL_PRESETS } from '../../models/MitchellSchaefferModel';

interface CellState {
  params: MsParams;
  results: MsResults | null;
  simulationInProgress: boolean;
  selectedPreset: string;
  comparisonResults: MsResults | null;
  showComparison: boolean;
}

// Define presets for different cell types or conditions
export const CELL_PRESETS = {
  NORMAL: 'Normal Cell',
  SLOW_CONDUCTION: 'Slow Conduction',
  LONG_APD: 'Long APD',
  SHORT_APD: 'Short APD',
  REDUCED_EXCITABILITY: 'Reduced Excitability',
};

const initialState: CellState = {
  params: DEFAULT_MS_PARAMS,
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
    updateParameters: (state, action: PayloadAction<Partial<MsParams>>) => {
      state.params = { ...state.params, ...action.payload };
    },
    
    setResults: (state, action: PayloadAction<MsResults>) => {
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
          state.params = { ...DEFAULT_MS_PARAMS };
          break;
          
        case CELL_PRESETS.SLOW_CONDUCTION:
          state.params = { 
            ...DEFAULT_MS_PARAMS, 
            tau_in: 0.5,     // Slower depolarization
            tau_out: 6.0,
            tau_open: 120.0,
            tau_close: 80.0,
            v_gate: 0.13
          };
          break;
          
        case CELL_PRESETS.LONG_APD:
          state.params = { 
            ...DEFAULT_MS_PARAMS, 
            tau_in: 0.3,
            tau_out: 12.0,    // Slower repolarization = longer APD
            tau_open: 120.0,
            tau_close: 150.0, // Slower h inactivation = longer plateau
            v_gate: 0.13
          };
          break;
          
        case CELL_PRESETS.SHORT_APD:
          state.params = { 
            ...DEFAULT_MS_PARAMS, 
            tau_in: 0.3,
            tau_out: 3.0,     // Faster repolarization = shorter APD
            tau_open: 120.0,
            tau_close: 30.0,  // Faster h inactivation = shorter plateau
            v_gate: 0.13
          };
          break;
          
        case CELL_PRESETS.REDUCED_EXCITABILITY:
          state.params = { 
            ...DEFAULT_MS_PARAMS, 
            tau_in: 0.3,
            tau_out: 6.0,
            tau_open: 180.0,  // Slower recovery
            tau_close: 80.0,
            v_gate: 0.15      // Higher threshold
          };
          break;
          
        default:
          state.params = { ...DEFAULT_MS_PARAMS };
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
    
    setComparisonResults: (state, action: PayloadAction<MsResults>) => {
      state.comparisonResults = action.payload;
    }
  }
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