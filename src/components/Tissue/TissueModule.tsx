import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TissueParams, 
  TissueData,
  TissueSimulationResults,
  initializeTissue,
  stepTissue,
  simulateTissue,
  planarWaveStimulus,
  s1s2StimulusProtocol
} from '../../models/TissueModel';
import { RootState } from '../../store';
import {
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
  VisualizationMode
} from '../../store/slices/tissueSlice';
import { useSimulation, SimulationStatus, SimulationType } from '../../hooks/useSimulation';
import TissueVisualization from './TissueVisualization';
import TissueCellActionPotential from './TissueCellActionPotential';
import { createVoltageColorScale, createActivationTimeColorScale, createAPDColorScale } from '../../utils/colorScales';
import SimulationProgress from '../common/SimulationProgress';
// Import educational components
import EnhancedTooltip from '../Shared/EnhancedTooltip';
import EducationalPanel from '../Shared/EducationalPanel';
import SelfAssessmentQuiz from '../Shared/SelfAssessmentQuiz';
// Import educational content
import { tissueParameterTooltips, tissueEducation, tissueModuleQuizQuestions } from '../../data/tissueEducation';

const TissueModule: React.FC = () => {
  const dispatch = useDispatch();
  const {
    params,
    currentData,
    results,
    simulationInProgress,
    currentTimeIndex,
    visualizationMode,
    diffusionGradient,
    conductionObstacle,
    obstacleCoordinates
  } = useSelector((state: RootState) => state.tissue);
  
  // State for selected cell
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(5); // frames per second - increased default
  const animationRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0); // Track current index directly in ref
  
  // Reference to colorScale functions
  const colorScales = useRef({
    voltage: createVoltageColorScale(),
    activationTime: createActivationTimeColorScale(0, 50),
    apd: createAPDColorScale(10, 30)
  });
  
  // Use the actual data ranges to update color scales when results are available
  useEffect(() => {
    if (results) {
      // For activation times
      const validTimes = results.activationTimes.flat().filter(val => val >= 0);
      if (validTimes.length > 0) {
        const minTime = Math.min(...validTimes);
        const maxTime = Math.max(...validTimes);
        colorScales.current.activationTime = createActivationTimeColorScale(minTime, maxTime);
      }
      
      // For APD
      const validApds = results.apd.flat().filter(val => val > 0);
      if (validApds.length > 0) {
        const minApd = Math.min(...validApds);
        const maxApd = Math.max(...validApds);
        colorScales.current.apd = createAPDColorScale(minApd, maxApd);
      }
    }
  }, [results]);
  
  // Add local state for the properties that don't exist in the Redux state
  const [tissueSize, setTissueSize] = useState({
    rows: params.rows,
    cols: params.cols
  });
  
  // Cell model parameters as local state
  const [cellParams, setCellParams] = useState({
    tau_in: params.tau_in,
    tau_out: params.tau_out,
    tau_open: params.tau_open,
    tau_close: params.tau_close,
    v_gate: params.v_gate
  });
  
  // Stimulus parameters as local state
  const [stimulusParams, setStimulusParams] = useState({
    protocol: 'planarWave', // 'planarWave' or 's1s2'
    s1Amplitude: 1.0,
    s1Duration: 1.0,
    s1StartTime: 1.0,
    s2Amplitude: 1.0,
    s2Duration: 1.0,
    s2StartTime: 30.0,
    simulationDuration: 100 // Simulation duration in ms
  });
  
  // Repolarization gradient state
  const [repolarizationGradient, setRepolarizationGradient] = useState({
    left: 60,  // Default left side tau_close value
    right: 100 // Default right side tau_close value
  });
  
  // Add an effect to reset selected cell when results change
  useEffect(() => {
    // Reset selected cell when results change (new simulation run)
    setSelectedCell(null);
    console.log("Results changed, resetting selected cell");
  }, [results]);
  
  // Add an effect to sync tissueSize with Redux params
  useEffect(() => {
    // Keep local tissueSize in sync with Redux params
    setTissueSize({
      rows: params.rows,
      cols: params.cols
    });
  }, [params.rows, params.cols]);
  
  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    console.log(`Cell click at (${row}, ${col})`);
    
    // Validate that the coordinates are within bounds
    if (results && results.snapshots && results.snapshots.length > 0 &&
        row >= 0 && row < results.snapshots[0].v.length && 
        col >= 0 && col < results.snapshots[0].v[0].length) {
      console.log(`Setting selected cell to (${row}, ${col})`);
      setSelectedCell({ row, col });
    } else {
      console.error('Invalid cell coordinates or missing results:', {
        hasResults: !!results,
        hasSnapshots: results && !!results.snapshots,
        snapshotCount: results && results.snapshots ? results.snapshots.length : 0,
        row,
        col
      });
    }
  };
  
  // Use simulation hook for tissue simulation
  const { 
    status, 
    results: simulationResults, 
    runSimulation,
    getDebugInfo,
    cancelSimulation,
    estimatedTimeRemaining
  } = useSimulation<Record<string, unknown>, TissueSimulationResults>(
    (simulationParams) => {
      // Extract parameters with fallbacks - using improved values optimized for tissue
      const tissueParams: TissueParams = {
        rows: simulationParams.rows as number || 50,
        cols: simulationParams.cols as number || 50,
        diffusionCoefficient: simulationParams.diffusionCoefficient as number || 1.0,
        deltax: simulationParams.deltax as number || 1.0,
        tau_in: simulationParams.tau_in as number || 0.3,      // Fast depolarization
        tau_out: simulationParams.tau_out as number || 6.0,     // Moderate repolarization
        tau_open: simulationParams.tau_open as number || 120.0,  // Slow recovery
        tau_close: simulationParams.tau_close as number || 80.0,  // Moderate gate closing
        v_gate: simulationParams.v_gate as number || 0.13,     // Standard threshold
        dt: simulationParams.dt as number || 0.05              // Time step, increased for tissue
      };
      
      // Run the simulation
      return simulateTissue(
        tissueParams,
        simulationParams.duration as number || 50,
        simulationParams.stimulusType === 'planar' ? 
          (tissue, time) => planarWaveStimulus(
            tissue, 
            time, 
            simulationParams.stimulusStartTime as number || 1.0,
            simulationParams.stimulusDuration as number || 1.0,
            simulationParams.stimulusWidth as number || 5
          ) :
          simulationParams.stimulusType === 's1s2' ?
            (tissue, time) => s1s2StimulusProtocol(
              tissue,
              time,
              simulationParams.s1StartTime as number || 1.0,
              simulationParams.s1Duration as number || 1.0,
              simulationParams.s2StartTime as number || 150.0,
              simulationParams.s2Duration as number || 1.0
            ) :
            (tissue) => tissue,
        2.0,
        simulationParams.hasObstacle as boolean || false,
        simulationParams.obstacleCenter as {row: number, col: number} || {row: 0, col: 0},
        simulationParams.obstacleRadius as number || 10,
        simulationParams.hasRepolarizationGradient as boolean || false,
        simulationParams.tauCloseValues as {left: number, right: number} || {left: 80, right: 80}
      );
    },
    SimulationType.TISSUE // Specify this is a tissue simulation
  );
  
  // Update results when simulation completes
  useEffect(() => {
    if (status === SimulationStatus.COMPLETED && simulationResults) {
      dispatch(setTissueResults(simulationResults));
      dispatch(setCurrentTimeIndex(0));
      dispatch(setTissueSimulationStatus(false));
    } else if (status === SimulationStatus.RUNNING) {
      dispatch(setTissueSimulationStatus(true));
    } else if (status === SimulationStatus.ERROR) {
      console.error('Simulation failed');
      dispatch(setTissueSimulationStatus(false));
    }
  }, [status, simulationResults, dispatch]);
  
  // Reset selected cell when changing visualization mode
  useEffect(() => {
    setSelectedCell(null);
  }, [visualizationMode]);
  
  // Run current simulation
  const runTissueSimulation = () => {
    // Reset selected cell when starting a new simulation
    setSelectedCell(null);
    
    // Stop any ongoing animation
    stopAnimation();
    
    // Immediately update params if tissue size has changed
    if (params.rows !== tissueSize.rows || params.cols !== tissueSize.cols) {
      dispatch(updateTissueParameters({
        rows: tissueSize.rows,
        cols: tissueSize.cols
      }));
    }
    
    // Update tissue parameters with cell parameters
    dispatch(updateTissueParameters(cellParams));
    
    // Calculate obstacle center
    const obstacleCenter = {
      row: Math.floor(tissueSize.rows / 2),
      col: Math.floor(tissueSize.cols / 2)
    };
    
    // Create properly structured parameters matching the expected worker format
    const simulationParams = {
      // Cell and tissue parameters inside the params property
      params: {
        tau_in: cellParams.tau_in,
        tau_out: cellParams.tau_out,
        tau_open: cellParams.tau_open,
        tau_close: cellParams.tau_close,
        v_gate: cellParams.v_gate,
        dt: 0.05, // Fixed time step
        rows: tissueSize.rows,
        cols: tissueSize.cols,
        diffusionCoefficient: params.diffusionCoefficient || 0.1,
        deltax: params.deltax || 1.0
      },
      
      // Specify duration and stimulus type (required by worker)
      duration: stimulusParams.simulationDuration,
      stimulusType: stimulusParams.protocol === 's1s2' ? 's1s2' : 'planar',
      
      // Stimulus parameters
      stimulusParams: {
        // Common parameters
        startTime: stimulusParams.s1StartTime,
        duration: stimulusParams.s1Duration,
        width: 5,
        
        // S1-S2 specific parameters
        s1StartTime: stimulusParams.s1StartTime,
        s1Duration: stimulusParams.s1Duration,
        s2StartTime: stimulusParams.s2StartTime, 
        s2Duration: stimulusParams.s2Duration
      },
      
      // Obstacle configuration
      hasObstacle: conductionObstacle,
      obstacleCenter: obstacleCoordinates ? 
        { row: obstacleCoordinates.row, col: obstacleCoordinates.col } :
        obstacleCenter,
      obstacleRadius: obstacleCoordinates ? 
        Math.min(obstacleCoordinates.width, obstacleCoordinates.height) / 2 : 
        10,
      
      // Repolarization gradient
      hasRepolarizationGradient: diffusionGradient,
      tauCloseValues: {
        left: repolarizationGradient.left,
        right: repolarizationGradient.right
      }
    };
    
    console.log("Running tissue simulation with parameters:", simulationParams);
    
    // Run the simulation
    runSimulation(simulationParams);
  };
  
  // Handle parameter changes
  const handleTissueParamChange = (paramName: keyof TissueParams, value: number) => {
    dispatch(updateTissueParameters({ [paramName]: value }));
  };
  
  // Handle cell parameter changes
  const handleCellParamChange = (paramName: string, value: number) => {
    setCellParams(prev => ({ ...prev, [paramName]: value }));
  };
  
  // Handle stimulus parameter changes
  const handleStimulusParamChange = (paramName: string, value: number | string) => {
    setStimulusParams(prev => ({ ...prev, [paramName]: value }));
  };
  
  // Handle visualization mode changes
  const handleVisualizationModeChange = (mode: VisualizationMode) => {
    dispatch(setVisualizationMode(mode));
  };
  
  // Animation controls
  const startAnimation = () => {
    // Check if we have results to animate
    if (!results || !results.snapshots.length) return;
    
    // Stop any existing animation
    stopAnimation();
    
    // Initialize animation state
    setIsAnimating(true);
    currentIndexRef.current = currentTimeIndex; // Sync with current displayed index
    
    // Start interval-based animation
    const intervalId = window.setInterval(() => {
      // Calculate next frame
      currentIndexRef.current = (currentIndexRef.current + 1) % results.snapshots.length;
      
      // Update the UI by dispatching to Redux
      dispatch(setCurrentTimeIndex(currentIndexRef.current));
    }, 1000 / animationSpeed);
    
    // Store interval ID for cleanup
    animationRef.current = intervalId as unknown as number;
  };
  
  const stopAnimation = () => {
    if (animationRef.current !== null) {
      window.clearInterval(animationRef.current as unknown as number);
      animationRef.current = null;
    }
    setIsAnimating(false);
  };
  
  const resetSimulation = () => {
    // Stop animation if running
    stopAnimation();
    
    // Reset selected cell
    setSelectedCell(null);
    
    dispatch(resetTissueState());
  };
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        window.clearInterval(animationRef.current as unknown as number);
        animationRef.current = null;
      }
    };
  }, []);
  
  // Stop animation when manually changing time index
  useEffect(() => {
    // Update our ref to match current index when it changes externally (e.g. slider)
    currentIndexRef.current = currentTimeIndex;
  }, [currentTimeIndex]);
  
  // Handle animation speed change  
  const handleAnimationSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseInt(e.target.value);
    setAnimationSpeed(newSpeed);
    
    // Restart animation with new speed if currently running
    if (isAnimating) {
      startAnimation();
    }
  };
  
  // Toggle features
  const handleToggleDiffusionGradient = () => {
    dispatch(toggleDiffusionGradient());
  };
  
  const handleToggleConductionObstacle = () => {
    dispatch(toggleConductionObstacle());
  };
  
  const handleUpdateObstacle = (coords: { 
    row: number; 
    col: number; 
    width: number; 
    height: number 
  }) => {
    dispatch(setObstacleCoordinates(coords));
  };
  
  // Fix the repolarization gradient control value change handlers
  // onChange handler for left value
  const handleLeftGradientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepolarizationGradient(prev => ({
      ...prev,
      left: parseInt(e.target.value)
    }));
  };
  
  // onChange handler for right value
  const handleRightGradientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepolarizationGradient(prev => ({
      ...prev,
      right: parseInt(e.target.value)
    }));
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tissue Propagation</h2>
      
      {/* Show loading spinner during simulation */}
      {(status === SimulationStatus.RUNNING || results) && (
        <div className="my-4">
          <SimulationProgress 
            status={status}
            progress={status === SimulationStatus.COMPLETED ? 100 : status === SimulationStatus.RUNNING ? 50 : 0}
            estimatedTimeRemaining={estimatedTimeRemaining}
            onCancel={cancelSimulation}
            getDebugInfo={getDebugInfo}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          {/* Tissue Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tissue Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <EnhancedTooltip content={
                  <div>
                    <div className="font-bold mb-1">{tissueParameterTooltips.diffusionCoefficient.title}</div>
                    <div className="mb-2">{tissueParameterTooltips.diffusionCoefficient.content}</div>
                    <div className="text-xs text-gray-500">Physiological meaning: {tissueParameterTooltips.diffusionCoefficient.physiological}</div>
                  </div>
                }>
                  <label htmlFor="diffusion-coefficient" className="block font-medium text-gray-700 mb-1">
                    Diffusion Coefficient: {params.diffusionCoefficient.toFixed(2)}
                  </label>
                </EnhancedTooltip>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.1</span>
                  <input
                    id="diffusion-coefficient"
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={params.diffusionCoefficient}
                    onChange={(e) => handleTissueParamChange('diffusionCoefficient', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">5.0</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cell Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Cell Model Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <EnhancedTooltip content={
                  <div>
                    <div className="font-bold mb-1">τ_in (Tau In)</div>
                    <div className="mb-2">Controls the speed of depolarization (upstroke velocity). Lower values = faster depolarization.</div>
                    <div className="text-xs text-gray-500">Physiological meaning: Corresponds to sodium channel activation kinetics</div>
                  </div>
                }>
                  <label htmlFor="param-tau_in" className="block font-medium text-gray-700 mb-1">
                    Parameter tau_in: {cellParams.tau_in.toFixed(2)}
                  </label>
                </EnhancedTooltip>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-tau_in"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cellParams.tau_in}
                    onChange={(e) => handleCellParamChange('tau_in', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.0</span>
                </div>
              </div>
              
              <div>
                <EnhancedTooltip content={
                  <div>
                    <div className="font-bold mb-1">τ_out (Tau Out)</div>
                    <div className="mb-2">Controls the speed of repolarization. Higher values = longer action potential duration.</div>
                    <div className="text-xs text-gray-500">Physiological meaning: Corresponds to potassium channel kinetics</div>
                  </div>
                }>
                  <label htmlFor="param-tau_out" className="block font-medium text-gray-700 mb-1">
                    Parameter tau_out: {cellParams.tau_out.toFixed(2)}
                  </label>
                </EnhancedTooltip>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-tau_out"
                    type="range"
                    min="0"
                    max="10"
                    step="0.01"
                    value={cellParams.tau_out}
                    onChange={(e) => handleCellParamChange('tau_out', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">10.0</span>
                </div>
              </div>
              
              <div>
                <EnhancedTooltip content={
                  <div>
                    <div className="font-bold mb-1">τ_open (Tau Open)</div>
                    <div className="mb-2">Controls the recovery time for the h-gate. Higher values = longer refractory period.</div>
                    <div className="text-xs text-gray-500">Physiological meaning: Corresponds to recovery from inactivation of sodium channels</div>
                  </div>
                }>
                  <label htmlFor="param-tau_open" className="block font-medium text-gray-700 mb-1">
                    Parameter tau_open: {cellParams.tau_open.toFixed(2)}
                  </label>
                </EnhancedTooltip>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-tau_open"
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={cellParams.tau_open}
                    onChange={(e) => handleCellParamChange('tau_open', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
              </div>
              
              <div>
                <EnhancedTooltip content={
                  <div>
                    <div className="font-bold mb-1">τ_close (Tau Close)</div>
                    <div className="mb-2">Controls the inactivation time for the h-gate. Lower values = faster inactivation.</div>
                    <div className="text-xs text-gray-500">Physiological meaning: Corresponds to sodium channel inactivation kinetics</div>
                  </div>
                }>
                  <label htmlFor="param-tau_close" className="block font-medium text-gray-700 mb-1">
                    Parameter tau_close: {cellParams.tau_close.toFixed(2)}
                  </label>
                </EnhancedTooltip>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-tau_close"
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={cellParams.tau_close}
                    onChange={(e) => handleCellParamChange('tau_close', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stimulation Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Stimulation Protocol</h3>
            
            <div className="mb-4">
              <label className="block font-medium text-gray-700 mb-1">Protocol Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`px-3 py-2 rounded ${
                    stimulusParams.protocol === 'planarWave' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handleStimulusParamChange('protocol', 'planarWave')}
                >
                  Planar Wave
                </button>
                <button
                  className={`px-3 py-2 rounded ${
                    stimulusParams.protocol === 's1s2' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handleStimulusParamChange('protocol', 's1s2')}
                >
                  S1-S2 Protocol
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* S1 Stimulus Parameters */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">S1 Stimulus</h4>
                
                <div className="mb-3">
                  <label htmlFor="s1-start" className="block text-sm text-gray-700 mb-1">
                    Start Time: {stimulusParams.s1StartTime.toFixed(1)}
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">0</span>
                    <input
                      id="s1-start"
                      type="range"
                      min="0"
                      max="500"
                      step="5"
                      value={stimulusParams.s1StartTime}
                      onChange={(e) => handleStimulusParamChange('s1StartTime', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500 ml-2">500</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="s1-duration" className="block text-sm text-gray-700 mb-1">
                    Duration: {stimulusParams.s1Duration.toFixed(1)}
                  </label>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">0.1</span>
                    <input
                      id="s1-duration"
                      type="range"
                      min="0.1"
                      max="20"
                      step="0.5"
                      value={stimulusParams.s1Duration}
                      onChange={(e) => handleStimulusParamChange('s1Duration', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500 ml-2">20.0</span>
                  </div>
                </div>
              </div>
              
              {/* S2 Stimulus Parameters - only show when S1-S2 protocol is selected */}
              {stimulusParams.protocol === 's1s2' && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">S2 Stimulus</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="s2-start" className="block text-sm text-gray-700 mb-1">
                      Start Time: {stimulusParams.s2StartTime.toFixed(1)}
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">0</span>
                      <input
                        id="s2-start"
                        type="range"
                        min="0"
                        max="500"
                        step="5"
                        value={stimulusParams.s2StartTime}
                        onChange={(e) => handleStimulusParamChange('s2StartTime', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500 ml-2">500</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="s2-duration" className="block text-sm text-gray-700 mb-1">
                      Duration: {stimulusParams.s2Duration.toFixed(1)}
                    </label>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">0.1</span>
                      <input
                        id="s2-duration"
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={stimulusParams.s2Duration}
                        onChange={(e) => handleStimulusParamChange('s2Duration', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500 ml-2">5.0</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="simulation-duration" className="block text-sm text-gray-700 mb-1">
                  Simulation Duration: {stimulusParams.simulationDuration}
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">100</span>
                  <input
                    id="simulation-duration"
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={stimulusParams.simulationDuration}
                    onChange={(e) => handleStimulusParamChange('simulationDuration', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500 ml-2">2000</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Advanced settings (placeholders for future implementation) */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tissue Features</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center mb-2">
                  <input
                    id="conduction-obstacle"
                    type="checkbox"
                    checked={conductionObstacle}
                    onChange={handleToggleConductionObstacle}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="conduction-obstacle" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Conduction Obstacle
                  </label>
                </div>
                {conductionObstacle && (
                  <div className="ml-6 space-y-2">
                    <p className="text-xs text-gray-600">
                      Adds a circular region with no conductivity in the center of the tissue.
                    </p>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Obstacle Radius: {obstacleCoordinates.width}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="1"
                        value={obstacleCoordinates.width}
                        onChange={(e) => handleUpdateObstacle({
                          ...obstacleCoordinates,
                          width: parseInt(e.target.value),
                          height: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <input
                    id="repolarization-gradient"
                    type="checkbox"
                    checked={diffusionGradient}
                    onChange={handleToggleDiffusionGradient}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="repolarization-gradient" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Repolarization Gradient
                  </label>
                </div>
                {diffusionGradient && (
                  <div className="ml-6 space-y-2">
                    <p className="text-xs text-gray-600">
                      Creates a gradient of tau_close values from left to right across the tissue,
                      affecting repolarization time.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Left Value: {repolarizationGradient.left.toFixed(0)}
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="120"
                          step="5"
                          value={repolarizationGradient.left}
                          onChange={handleLeftGradientChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Right Value: {repolarizationGradient.right.toFixed(0)}
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="120"
                          step="5"
                          value={repolarizationGradient.right}
                          onChange={handleRightGradientChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Simulation Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Simulation Controls</h3>
            
            <div className="space-y-3">
              <button
                onClick={runTissueSimulation}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                disabled={status === SimulationStatus.RUNNING}
              >
                {status === SimulationStatus.RUNNING ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Simulating...
                  </>
                ) : (
                  'Run Simulation'
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startAnimation}
                  className={`px-3 py-2 rounded ${
                    isAnimating ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  disabled={!results || status === SimulationStatus.RUNNING}
                >
                  {isAnimating ? 'Playing' : 'Play'}
                </button>
                <button
                  onClick={stopAnimation}
                  className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  disabled={!isAnimating}
                >
                  Stop
                </button>
              </div>
              
              {/* Animation speed control */}
              <div className="mt-2">
                <label htmlFor="animation-speed" className="block text-sm text-gray-700 mb-1">
                  Animation Speed: {animationSpeed} fps
                </label>
                <input
                  id="animation-speed"
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={animationSpeed}
                  onChange={handleAnimationSpeedChange}
                  className="w-full"
                  disabled={status === SimulationStatus.RUNNING}
                />
              </div>
              
              <button
                onClick={resetSimulation}
                className="w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                disabled={status === SimulationStatus.RUNNING}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {/* Visualization Panel */}
        <div className="lg:col-span-2">
          {/* Tissue Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tissue Visualization</h3>
              
              {/* Visualization Mode Selector */}
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    visualizationMode === VisualizationMode.VOLTAGE 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handleVisualizationModeChange(VisualizationMode.VOLTAGE)}
                >
                  Voltage
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    visualizationMode === VisualizationMode.ACTIVATION_TIMES 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handleVisualizationModeChange(VisualizationMode.ACTIVATION_TIMES)}
                  disabled={!results}
                >
                  Activation Times
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    visualizationMode === VisualizationMode.ACTION_POTENTIAL_DURATION 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handleVisualizationModeChange(VisualizationMode.ACTION_POTENTIAL_DURATION)}
                  disabled={!results}
                >
                  APD
                </button>
              </div>
            </div>
            
            {/* Timeline slider - only show for voltage visualization */}
            {visualizationMode === VisualizationMode.VOLTAGE && results && results.snapshots.length > 0 && (
              <div className="mb-4">
                <label htmlFor="time-slider" className="block text-sm text-gray-700 mb-1">
                  Time: {results.snapshots[currentTimeIndex]?.time.toFixed(1)}
                </label>
                <input
                  id="time-slider"
                  type="range"
                  min="0"
                  max={results.snapshots.length - 1}
                  step="1"
                  value={currentTimeIndex}
                  onChange={(e) => dispatch(setCurrentTimeIndex(parseInt(e.target.value)))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Tissue Visualization Component */}
            <div className="border rounded p-1">
              {results ? (
                <TissueVisualization
                  visualizationMode={visualizationMode}
                  currentData={currentData || (results && results.snapshots.length > 0 ? results.snapshots[currentTimeIndex] : null)}
                  results={results}
                  cellSize={Math.min(Math.floor(600 / params.cols), Math.floor(400 / params.rows))}
                  colorScales={colorScales.current}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell}
                  useWebGL={true}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                  <p className="text-gray-500">
                    Run a simulation to see tissue activity
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action potential visualization for selected cell */}
          {selectedCell && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Cell Action Potential</h3>
              <p className="text-sm mb-2 text-gray-700">
                Selected Cell: Row {selectedCell.row}, Column {selectedCell.col}
              </p>
              <div className="mb-2 text-xs text-gray-600">
                {results && results.snapshots && results.snapshots.length > 0 ? 
                  `Showing data from ${results.snapshots.length} time points` : 
                  'No time points available'}
              </div>
              <TissueCellActionPotential 
                results={results}
                selectedCell={selectedCell}
              />
            </div>
          )}
          
          {/* Educational Notes */}
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-primary mb-2">About Tissue Propagation</h3>
            <p className="mb-2">
              This simulation shows how electrical impulses propagate through cardiac tissue using a 
              2D reaction-diffusion model based on the Mitchell Schaeffer equations.
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>Blue regions represent resting tissue (low voltage)</li>
              <li>Red regions represent excited tissue (high voltage)</li>
              <li>White regions represent the threshold between states</li>
            </ul>
            <p className="mb-2">
              <strong>Key advantages of the Mitchell Schaeffer model:</strong>
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>No spontaneous automaticity - cells only activate when stimulated</li>
              <li>Parameters have direct physiological interpretation</li>
              <li>Can realistically simulate conduction block and reentry</li>
            </ul>
            <p>
              <strong>Tip:</strong> The simulation runs longer (1000ms) to properly demonstrate 
              the Mitchell Schaeffer dynamics which have longer recovery periods.
            </p>
          </div>
          
          {/* Metrics Panel - only show when results are available */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Propagation Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Maximum Activation Time</div>
                  <div className="text-xl font-semibold">
                    {Math.max(...results.activationTimes.flatMap(row => row.filter(val => val >= 0))).toFixed(1)} time units
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Average APD</div>
                  <div className="text-xl font-semibold">
                    {(results.apd.flat().reduce((a, b) => a + b, 0) / results.apd.flat().filter(Boolean).length).toFixed(1)} time units
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Add educational content after the simulation results */}
          <div className="mt-8">
            <EducationalPanel
              title="Cardiac Tissue Propagation"
              basicContent={<div dangerouslySetInnerHTML={{ __html: tissueEducation.basic.content }} />}
              intermediateContent={<div dangerouslySetInnerHTML={{ __html: tissueEducation.intermediate.content }} />}
              advancedContent={<div dangerouslySetInnerHTML={{ __html: tissueEducation.advanced.content }} />}
              clinicalRelevance={<div dangerouslySetInnerHTML={{ __html: tissueEducation.clinical.content }} />}
              className="mb-6"
            />
            
            <SelfAssessmentQuiz
              title="Test Your Knowledge: Cardiac Tissue Propagation"
              questions={tissueModuleQuizQuestions}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TissueModule; 