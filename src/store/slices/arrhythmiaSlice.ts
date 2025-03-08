import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  TissueParams, 
  TissueSimulationResults,
  DEFAULT_TISSUE_PARAMS
} from '../../models/TissueModel';

// S1-S2 protocol parameters
interface S1S2Protocol {
  s1Amplitude: number;
  s1Duration: number;
  s1Location: { row: number, col: number, width: number, height: number };
  s2Amplitude: number;
  s2Duration: number;
  s2Location: { row: number, col: number, width: number, height: number };
  couplingInterval: number; // Time between S1 and S2 stimuli
}

// Different types of arrhythmia mechanisms to demonstrate
export enum ArrhythmiaType {
  NORMAL = 'normal',
  REENTRY = 'reentry',
  FIBROSIS = 'fibrosis',
}

// Fibrosis pattern types
export enum FibrosisPattern {
  NONE = 'none',
  DIFFUSE = 'diffuse',
  COMPACT = 'compact',
  PATCHY = 'patchy',
}

interface ArrhythmiaState {
  tissueParams: TissueParams;
  s1s2Protocol: S1S2Protocol;
  selectedArrhythmiaType: ArrhythmiaType;
  fibrosisPattern: FibrosisPattern;
  fibrosisDensity: number; // 0-1 scale
  results: TissueSimulationResults | null;
  simulationInProgress: boolean;
  currentTimeIndex: number;
  identifiedReentry: boolean;
  identifiedBlock: boolean;
}

const initialS1S2Protocol: S1S2Protocol = {
  s1Amplitude: 1.0,
  s1Duration: 2.0,
  s1Location: { row: 10, col: 10, width: 5, height: 100 },
  s2Amplitude: 1.0,
  s2Duration: 2.0,
  s2Location: { row: 30, col: 60, width: 20, height: 40 },
  couplingInterval: 345.0, // Default value for typical arrhythmia studies
};

const initialState: ArrhythmiaState = {
  tissueParams: DEFAULT_TISSUE_PARAMS,
  s1s2Protocol: initialS1S2Protocol,
  selectedArrhythmiaType: ArrhythmiaType.NORMAL,
  fibrosisPattern: FibrosisPattern.NONE,
  fibrosisDensity: 0.0,
  results: null,
  simulationInProgress: false,
  currentTimeIndex: 0,
  identifiedReentry: false,
  identifiedBlock: false,
};

export const arrhythmiaSlice = createSlice({
  name: 'arrhythmia',
  initialState,
  reducers: {
    updateTissueParams: (state, action: PayloadAction<Partial<TissueParams>>) => {
      state.tissueParams = { ...state.tissueParams, ...action.payload };
    },
    
    updateS1S2Protocol: (state, action: PayloadAction<Partial<S1S2Protocol>>) => {
      state.s1s2Protocol = { ...state.s1s2Protocol, ...action.payload };
    },
    
    setArrhythmiaType: (state, action: PayloadAction<ArrhythmiaType>) => {
      state.selectedArrhythmiaType = action.payload;
      
      // Configure appropriate parameters for the selected arrhythmia type
      switch (action.payload) {
        case ArrhythmiaType.NORMAL:
          // Reset to default settings but with S2 amplitude set to 0
          state.s1s2Protocol = { 
            ...initialS1S2Protocol,
            s2Amplitude: 0.0  // Set S2 amplitude to 0 to disable the second stimulus
          };
          state.fibrosisPattern = FibrosisPattern.NONE;
          state.fibrosisDensity = 0.0;
          break;
          
        case ArrhythmiaType.REENTRY:
          // Create settings for demonstrating reentry
          state.s1s2Protocol = {
            ...initialS1S2Protocol,
            s1Location: { row: 10, col: 10, width: 5, height: 100 },
            s2Location: { row: 30, col: 60, width: 20, height: 40 },
            couplingInterval: 345.0
          };
          state.fibrosisPattern = FibrosisPattern.NONE;
          state.fibrosisDensity = 0.0;
          break;
          
        case ArrhythmiaType.FIBROSIS:
          // Create settings for demonstrating fibrosis effects
          state.s1s2Protocol = {
            ...initialS1S2Protocol,
            s1Location: { row: 10, col: 10, width: 5, height: 100 },
            s2Location: { row: 30, col: 60, width: 20, height: 40 },
            couplingInterval: 345.0
          };
          state.fibrosisPattern = FibrosisPattern.PATCHY;
          state.fibrosisDensity = 0.2;
          break;
      }
    },
    
    setFibrosisPattern: (state, action: PayloadAction<FibrosisPattern>) => {
      state.fibrosisPattern = action.payload;
    },
    
    setFibrosisDensity: (state, action: PayloadAction<number>) => {
      // Clamp density between 0 and 1
      state.fibrosisDensity = Math.max(0, Math.min(1, action.payload));
    },
    
    setArrhythmiaResults: (state, action: PayloadAction<TissueSimulationResults>) => {
      console.log("arrhythmiaSlice: Setting results", { 
        hasResults: !!action.payload,
        snapshotsCount: action.payload?.snapshots?.length || 0
      });
      state.results = action.payload;
      state.currentTimeIndex = 0;
    },
    
    setArrhythmiaSimulationStatus: (state, action: PayloadAction<boolean>) => {
      state.simulationInProgress = action.payload;
    },
    
    setCurrentArrhythmiaTimeIndex: (state, action: PayloadAction<number>) => {
      state.currentTimeIndex = action.payload;
    },
    
    identifyReentry: (state, action: PayloadAction<boolean>) => {
      state.identifiedReentry = action.payload;
    },
    
    identifyBlock: (state, action: PayloadAction<boolean>) => {
      state.identifiedBlock = action.payload;
    },
    
    resetArrhythmiaState: (state) => {
      return { ...initialState, tissueParams: state.tissueParams };
    },
  },
});

export const {
  updateTissueParams,
  updateS1S2Protocol,
  setArrhythmiaType,
  setFibrosisPattern,
  setFibrosisDensity,
  setArrhythmiaResults,
  setArrhythmiaSimulationStatus,
  setCurrentArrhythmiaTimeIndex,
  identifyReentry,
  identifyBlock,
  resetArrhythmiaState,
} = arrhythmiaSlice.actions;

export default arrhythmiaSlice.reducer; 