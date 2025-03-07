import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  TissueParams, 
  TissueData, 
  TissueSimulationResults, 
  DEFAULT_TISSUE_PARAMS,
  planarWaveStimulus
} from '../../models/TissueModel';

// Type for visualization mode selection
export enum VisualizationMode {
  VOLTAGE = 'voltage',
  ACTIVATION_TIMES = 'activationTimes',
  ACTION_POTENTIAL_DURATION = 'apd',
}

interface TissueState {
  params: TissueParams;
  currentData: TissueData | null;
  results: TissueSimulationResults | null;
  simulationInProgress: boolean;
  currentTimeIndex: number;
  visualizationMode: VisualizationMode;
  diffusionGradient: boolean;
  conductionObstacle: boolean;
  obstacleCoordinates: { row: number, col: number, width: number, height: number };
}

const initialState: TissueState = {
  params: DEFAULT_TISSUE_PARAMS,
  currentData: null,
  results: null,
  simulationInProgress: false,
  currentTimeIndex: 0,
  visualizationMode: VisualizationMode.VOLTAGE,
  diffusionGradient: false,
  conductionObstacle: false,
  obstacleCoordinates: { row: 40, col: 40, width: 20, height: 20 },
};

export const tissueSlice = createSlice({
  name: 'tissue',
  initialState,
  reducers: {
    updateTissueParameters: (state, action: PayloadAction<Partial<TissueParams>>) => {
      state.params = { ...state.params, ...action.payload };
    },
    
    setCurrentData: (state, action: PayloadAction<TissueData>) => {
      state.currentData = action.payload;
    },
    
    setTissueResults: (state, action: PayloadAction<TissueSimulationResults>) => {
      state.results = action.payload;
      
      // Initialize current data to the first snapshot if available
      if (action.payload.snapshots && action.payload.snapshots.length > 0) {
        state.currentData = action.payload.snapshots[0];
        state.currentTimeIndex = 0;
      }
    },
    
    setTissueSimulationStatus: (state, action: PayloadAction<boolean>) => {
      state.simulationInProgress = action.payload;
    },
    
    setCurrentTimeIndex: (state, action: PayloadAction<number>) => {
      state.currentTimeIndex = action.payload;
      
      // Update current data to match the selected time index
      if (state.results?.snapshots && action.payload < state.results.snapshots.length) {
        state.currentData = state.results.snapshots[action.payload];
      }
    },
    
    setVisualizationMode: (state, action: PayloadAction<VisualizationMode>) => {
      state.visualizationMode = action.payload;
    },
    
    toggleDiffusionGradient: (state) => {
      state.diffusionGradient = !state.diffusionGradient;
      
      // Apply gradient to tissue parameters if enabled
      if (state.diffusionGradient) {
        // We're not actually modifying the tissue here - this would happen in the simulation
        // but we mark the state so the visualization can represent it
      }
    },
    
    toggleConductionObstacle: (state) => {
      state.conductionObstacle = !state.conductionObstacle;
    },
    
    setObstacleCoordinates: (state, action: PayloadAction<{
      row: number;
      col: number;
      width: number;
      height: number;
    }>) => {
      state.obstacleCoordinates = action.payload;
    },
    
    resetTissueState: (state) => {
      return { ...initialState, params: state.params };
    },
  },
});

export const {
  updateTissueParameters,
  setCurrentData,
  setTissueResults,
  setTissueSimulationStatus,
  setCurrentTimeIndex,
  setVisualizationMode,
  toggleDiffusionGradient,
  toggleConductionObstacle,
  setObstacleCoordinates,
  resetTissueState,
} = tissueSlice.actions;

export default tissueSlice.reducer; 