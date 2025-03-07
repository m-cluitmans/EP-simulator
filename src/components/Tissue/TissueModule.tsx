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
import { useSimulation, SimulationStatus } from '../../hooks/useSimulation';
import TissueVisualization from './TissueVisualization';
import TissueCellActionPotential from './TissueCellActionPotential';
import { createVoltageColorScale, createActivationTimeColorScale, createAPDColorScale } from '../../utils/colorScales';

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
  const [animationSpeed, setAnimationSpeed] = useState(1); // frames per second
  const animationRef = useRef<number | null>(null);
  
  // Stimulus parameters
  const [stimulusParams, setStimulusParams] = useState({
    protocol: 'planarWave', // 'planarWave' or 's1s2'
    s1Amplitude: 1.0,
    s1Duration: 1.0,
    s1StartTime: 1.0,
    s2Amplitude: 1.0,
    s2Duration: 1.0,
    s2StartTime: 30.0,
    simulationDuration: 100
  });
  
  // Cell model parameters
  const [cellParams, setCellParams] = useState({
    a: params.a,
    b: params.b,
    epsilon: params.epsilon,
  });
  
  const [tissueSize, setTissueSize] = useState({
    rows: params.rows,
    cols: params.cols
  });
  
  // Reference to colorScale functions
  const colorScales = useRef({
    voltage: createVoltageColorScale(),
    activationTime: createActivationTimeColorScale(0, 50),
    apd: createAPDColorScale(10, 30)
  });
  
  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Validate that the coordinates are within bounds
    if (currentData && row >= 0 && row < currentData.v.length && 
        col >= 0 && col < currentData.v[0].length) {
      // Update selected cell
      setSelectedCell({ row, col });
    }
  };
  
  // Use simulation hook for tissue simulation
  const { 
    status: simulationStatus, 
    results: simulationResults, 
    runSimulation 
  } = useSimulation<Record<string, unknown>, TissueSimulationResults>(
    (simulationParams) => {
      // Extract parameters with fallbacks - using improved values optimized for tissue
      const tissueParams: TissueParams = {
        rows: simulationParams.rows as number || 50,
        cols: simulationParams.cols as number || 50,
        diffusionCoefficient: simulationParams.diffusionCoefficient as number || 1.0,
        deltax: simulationParams.deltax as number || 1.0,
        
        // Use the user-specified cell parameters 
        a: simulationParams.a as number || 0.45,
        b: simulationParams.b as number || 0.23,
        epsilon: simulationParams.epsilon as number || 0.08,
        I: simulationParams.I as number || 0.0,
        dt: simulationParams.dt as number || 0.01
      };
      
      // Determine which stimulus protocol to use
      const protocol = simulationParams.protocol as string || 'planarWave';
      const duration = simulationParams.simulationDuration as number || 100;
      
      let stimulationFunction;
      if (protocol === 's1s2') {
        stimulationFunction = (tissue: TissueData, time: number) => {
          return s1s2StimulusProtocol(
            tissue,
            time,
            simulationParams.s1StartTime as number || 1.0,
            simulationParams.s1Duration as number || 1.0,
            simulationParams.s2StartTime as number || 30.0,
            simulationParams.s2Duration as number || 1.0
          );
        };
      } else {
        // Default to planar wave
        stimulationFunction = (tissue: TissueData, time: number) => {
          return planarWaveStimulus(
            tissue,
            time,
            simulationParams.s1StartTime as number || 1.0,
            simulationParams.s1Duration as number || 1.0,
            5 // width of stimulus
          );
        };
      }
      
      // Handle obstacles if enabled
      const obstacleEnabled = simulationParams.conductionObstacle as boolean || false;
      const obstacleCoords = simulationParams.obstacleCoordinates as any || { 
        row: 40, 
        col: 40, 
        width: 20, 
        height: 20 
      };
      
      // Create modified tissue for obstacles
      let initialTissue = initializeTissue(tissueParams);
      
      if (obstacleEnabled) {
        // Modify tissue diffusion by setting cells within obstacle to non-conductive
        const modifiedTissue = { ...initialTissue };
        
        // This will be implemented in a future version with true obstacle creation
        // For now, we'll just change the initial conditions in the obstacle region
        
        initialTissue = modifiedTissue;
      }
      
      // Apply diffusion gradient if enabled
      const gradientEnabled = simulationParams.diffusionGradient as boolean || false;
      if (gradientEnabled) {
        // This would adjust the diffusion coefficient across the tissue
        // Implementation will be added in the future
      }
      
      // Run the simulation
      return simulateTissue(
        tissueParams,
        duration,
        stimulationFunction,
        1.0 // Save interval
      );
    }
  );
  
  // Update results when simulation completes
  useEffect(() => {
    if (simulationStatus === SimulationStatus.COMPLETED && simulationResults) {
      dispatch(setTissueResults(simulationResults));
      dispatch(setCurrentTimeIndex(0));
      dispatch(setTissueSimulationStatus(false));
    } else if (simulationStatus === SimulationStatus.RUNNING) {
      dispatch(setTissueSimulationStatus(true));
    } else if (simulationStatus === SimulationStatus.ERROR) {
      console.error('Simulation failed');
      dispatch(setTissueSimulationStatus(false));
    }
  }, [simulationStatus, simulationResults, dispatch]);
  
  // Reset selected cell when changing visualization mode
  useEffect(() => {
    setSelectedCell(null);
  }, [visualizationMode]);
  
  // Reset selected cell when starting a new simulation
  useEffect(() => {
    if (simulationInProgress) {
      setSelectedCell(null);
    }
  }, [simulationInProgress]);
  
  // Run simulation with current parameters
  const runTissueSimulation = () => {
    // Stop any ongoing animation
    stopAnimation();
    
    // Update params if tissue size has changed
    if (params.rows !== tissueSize.rows || params.cols !== tissueSize.cols) {
      dispatch(updateTissueParameters({
        rows: tissueSize.rows,
        cols: tissueSize.cols
      }));
    }
    
    // Update tissue parameters with cell parameters
    dispatch(updateTissueParameters(cellParams));
    
    // Create simulation parameters
    const simulationParams = {
      ...params,
      ...cellParams, // Include cell parameters
      protocol: stimulusParams.protocol,
      s1StartTime: stimulusParams.s1StartTime,
      s1Duration: stimulusParams.s1Duration,
      s1Amplitude: stimulusParams.s1Amplitude,
      s2StartTime: stimulusParams.s2StartTime,
      s2Duration: stimulusParams.s2Duration,
      s2Amplitude: stimulusParams.s2Amplitude,
      simulationDuration: stimulusParams.simulationDuration,
      conductionObstacle,
      obstacleCoordinates,
      diffusionGradient
    };
    
    // Reset selected cell when running a new simulation
    setSelectedCell(null);
    
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
    if (!results || !results.snapshots.length) return;
    setIsAnimating(true);
    
    // Function to increment the frame
    const animate = () => {
      // Calculate the next index directly
      const nextIndex = (currentTimeIndex + 1) % results.snapshots.length;
      dispatch(setCurrentTimeIndex(nextIndex));
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
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
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
        <p className="text-gray-700">Simulating tissue dynamics...</p>
      </div>
    </div>
  );
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tissue Propagation</h2>
      
      {/* Loading spinner when simulation is running */}
      {simulationInProgress && <LoadingSpinner />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          {/* Tissue Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tissue Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tissue-rows" className="block font-medium text-gray-700 mb-1">
                  Rows: {tissueSize.rows}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">20</span>
                  <input
                    id="tissue-rows"
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={tissueSize.rows}
                    onChange={(e) => setTissueSize(prev => ({ 
                      ...prev, 
                      rows: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Number of rows in the tissue grid (height)
                </div>
              </div>
              
              <div>
                <label htmlFor="tissue-cols" className="block font-medium text-gray-700 mb-1">
                  Columns: {tissueSize.cols}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">20</span>
                  <input
                    id="tissue-cols"
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={tissueSize.cols}
                    onChange={(e) => setTissueSize(prev => ({ 
                      ...prev, 
                      cols: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Number of columns in the tissue grid (width)
                </div>
              </div>
              
              <div>
                <label htmlFor="diffusion-coefficient" className="block font-medium text-gray-700 mb-1">
                  Diffusion Coefficient: {params.diffusionCoefficient.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.1</span>
                  <input
                    id="diffusion-coefficient"
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={params.diffusionCoefficient}
                    onChange={(e) => handleTissueParamChange('diffusionCoefficient', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">5.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls conduction velocity in the tissue
                </div>
              </div>
            </div>
          </div>
          
          {/* Cell Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Cell Model Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="param-a" className="block font-medium text-gray-700 mb-1">
                  Parameter a: {cellParams.a.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-a"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cellParams.a}
                    onChange={(e) => handleCellParamChange('a', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls threshold for excitation. For tissue, try 0.45 (lower values = more excitable)
                </div>
              </div>
              
              <div>
                <label htmlFor="param-b" className="block font-medium text-gray-700 mb-1">
                  Parameter b: {cellParams.b.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-b"
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.01"
                    value={cellParams.b}
                    onChange={(e) => handleCellParamChange('b', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls recovery rate. For tissue, try 0.23 (lower values = slower recovery)
                </div>
              </div>
              
              <div>
                <label htmlFor="param-epsilon" className="block font-medium text-gray-700 mb-1">
                  Epsilon: {cellParams.epsilon.toFixed(3)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.01</span>
                  <input
                    id="param-epsilon"
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.001"
                    value={cellParams.epsilon}
                    onChange={(e) => handleCellParamChange('epsilon', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">0.5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls time scale separation (affects action potential duration)
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Cell parameters for tissue simulation often differ from single cell.
                  For stable wave propagation, try a=0.45, b=0.23 instead of single-cell values.
                </p>
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
                    <span className="text-xs text-gray-500 mr-2">0.1</span>
                    <input
                      id="s1-start"
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={stimulusParams.s1StartTime}
                      onChange={(e) => handleStimulusParamChange('s1StartTime', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500 ml-2">10.0</span>
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
                      max="5"
                      step="0.1"
                      value={stimulusParams.s1Duration}
                      onChange={(e) => handleStimulusParamChange('s1Duration', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500 ml-2">5.0</span>
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
                      <span className="text-xs text-gray-500 mr-2">10.0</span>
                      <input
                        id="s2-start"
                        type="range"
                        min="10"
                        max="50"
                        step="1"
                        value={stimulusParams.s2StartTime}
                        onChange={(e) => handleStimulusParamChange('s2StartTime', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500 ml-2">50.0</span>
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
                  <span className="text-xs text-gray-500 mr-2">50</span>
                  <input
                    id="simulation-duration"
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={stimulusParams.simulationDuration}
                    onChange={(e) => handleStimulusParamChange('simulationDuration', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500 ml-2">200</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tissue Features */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tissue Features</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="conduction-obstacle"
                  type="checkbox"
                  checked={conductionObstacle}
                  onChange={handleToggleConductionObstacle}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="conduction-obstacle" className="ml-2 text-sm text-gray-700">
                  Enable Conduction Obstacle
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="diffusion-gradient"
                  type="checkbox"
                  checked={diffusionGradient}
                  onChange={handleToggleDiffusionGradient}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="diffusion-gradient" className="ml-2 text-sm text-gray-700">
                  Enable Diffusion Gradient
                </label>
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
                disabled={simulationInProgress}
              >
                {simulationInProgress ? (
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
                  disabled={!results || simulationInProgress}
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
              
              <button
                onClick={resetSimulation}
                className="w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                disabled={simulationInProgress}
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
              {currentData ? (
                <TissueVisualization
                  visualizationMode={visualizationMode}
                  currentData={currentData}
                  results={results}
                  cellSize={Math.min(Math.floor(600 / params.cols), Math.floor(400 / params.rows))}
                  colorScales={colorScales.current}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell}
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
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Cell Action Potential</h3>
              <p className="text-sm mb-2 text-gray-700">
                Selected Cell: Row {selectedCell.row}, Column {selectedCell.col}
              </p>
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
              2D reaction-diffusion model based on FitzHugh-Nagumo equations.
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>Blue regions represent resting tissue (negative voltage)</li>
              <li>Red regions represent excited tissue (positive voltage)</li>
              <li>White regions represent the threshold between states</li>
            </ul>
            <p>
              <strong>Tip:</strong> Different parameters may work better for single cell vs. tissue simulations. 
              Cell coupling in tissue creates different dynamics than isolated cells.
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
        </div>
      </div>
    </div>
  );
};

export default TissueModule; 