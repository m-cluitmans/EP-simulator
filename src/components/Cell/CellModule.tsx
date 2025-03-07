import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FhnParams, 
  applyStimulus,
  calculateAPD,
  calculateMaxUpstrokeVelocity,
  FhnResults
} from '../../models/FitzHughNagumoModel';
import { RootState } from '../../store';
import { 
  updateParameters,
  setResults,
  applyPreset,
  toggleComparison,
  clearComparison,
  setComparisonResults,
  CELL_PRESETS
} from '../../store/slices/cellSlice';
import ActionPotentialPlot from './ActionPotentialPlot';
import { useSimulation, SimulationStatus } from '../../hooks/useSimulation';

const CellModule: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    params, 
    results, 
    selectedPreset, 
    comparisonResults,
    showComparison 
  } = useSelector((state: RootState) => state.cell);
  
  const [stimulusParams, setStimulusParams] = useState({
    amplitude: 0.5,
    duration: 1.0,
    startTime: 5.0,
    timeSpan: 50
  });
  
  const [highlightPhases, setHighlightPhases] = useState(true);
  const [metrics, setMetrics] = useState<{
    apd: number;
    maxUpstrokeVelocity: number;
  }>({ apd: 0, maxUpstrokeVelocity: 0 });
  
  // Use our custom simulation hook with proper type handling
  const { 
    status: simulationStatus, 
    results: simulationResults, 
    runSimulation
  } = useSimulation<Record<string, unknown>, FhnResults>(
    (params) => {
      // Safe extraction of parameters with fallbacks
      const modelParams = {
        a: params.a as number || 0.7,
        b: params.b as number || 0.8,
        epsilon: params.epsilon as number || 0.08,
        I: params.I as number || 0,
        dt: params.dt as number || 0.01
      };
      
      const stimParams = {
        stimulusAmplitude: params.stimulusAmplitude as number || 0.5,
        stimulusDuration: params.stimulusDuration as number || 1.0,
        stimulusStart: params.stimulusStart as number || 5.0,
        timeSpan: params.timeSpan as number || 50
      };
      
      // Run the simulation with explicit parameters
      return applyStimulus(
        modelParams,
        stimParams.stimulusAmplitude,
        stimParams.stimulusDuration,
        stimParams.stimulusStart,
        stimParams.timeSpan
      );
    }
  );
  
  // Update results when simulation completes
  useEffect(() => {
    if (simulationStatus === SimulationStatus.COMPLETED && simulationResults) {
      dispatch(setResults(simulationResults));
      
      // Calculate metrics
      const apd = calculateAPD(simulationResults);
      const maxUpstrokeVelocity = calculateMaxUpstrokeVelocity(simulationResults);
      setMetrics({ apd, maxUpstrokeVelocity });
    }
  }, [simulationStatus, simulationResults, dispatch]);
  
  // Run simulation with current parameter set
  const runCurrentSimulation = () => {
    // Create a plain object with all parameters
    const simulationParams = {
      ...params,
      stimulusAmplitude: stimulusParams.amplitude,
      stimulusDuration: stimulusParams.duration,
      stimulusStart: stimulusParams.startTime,
      timeSpan: stimulusParams.timeSpan
    };
    
    runSimulation(simulationParams);
  };
  
  // Handle parameter change
  const handleParamChange = (paramName: keyof FhnParams, value: number) => {
    dispatch(updateParameters({ [paramName]: value }));
  };
  
  // Handle stimulus parameter change
  const handleStimulusParamChange = (paramName: string, value: number) => {
    setStimulusParams(prev => ({ ...prev, [paramName]: value }));
  };
  
  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    dispatch(applyPreset(preset));
  };
  
  // Toggle comparison
  const handleToggleComparison = () => {
    dispatch(toggleComparison());
  };
  
  // Store current results as comparison
  const handleStoreComparison = () => {
    if (results) {
      dispatch(setComparisonResults(results));
    }
  };
  
  // Clear comparison
  const handleClearComparison = () => {
    dispatch(clearComparison());
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Single Cell Electrophysiology</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">FitzHugh-Nagumo Parameters</h3>
            
            {/* Parameter Sliders */}
            <div className="space-y-4">
              <div>
                <label htmlFor="param-a" className="block font-medium text-gray-700 mb-1">
                  Parameter a: {params.a.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-a"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={params.a}
                    onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls the threshold for excitation (rest state)
                </div>
              </div>
              
              <div>
                <label htmlFor="param-b" className="block font-medium text-gray-700 mb-1">
                  Parameter b: {params.b.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="param-b"
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.01"
                    value={params.b}
                    onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls the recovery rate (similar to potassium current)
                </div>
              </div>
              
              <div>
                <label htmlFor="param-epsilon" className="block font-medium text-gray-700 mb-1">
                  Epsilon: {params.epsilon.toFixed(3)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.01</span>
                  <input
                    id="param-epsilon"
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.001"
                    value={params.epsilon}
                    onChange={(e) => handleParamChange('epsilon', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">0.5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls time scale separation (lower = slower recovery)
                </div>
              </div>
              
              <div>
                <label htmlFor="param-dt" className="block font-medium text-gray-700 mb-1">
                  Time Step (dt): {params.dt.toFixed(3)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.001</span>
                  <input
                    id="param-dt"
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={params.dt}
                    onChange={(e) => handleParamChange('dt', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">0.1</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Numerical integration time step (smaller = more accurate but slower)
                </div>
              </div>
            </div>
            
            {/* Stimulus Controls */}
            <h3 className="text-lg font-semibold mt-6 mb-4">Stimulus Parameters</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="stimulus-amplitude" className="block font-medium text-gray-700 mb-1">
                  Amplitude: {stimulusParams.amplitude.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.0</span>
                  <input
                    id="stimulus-amplitude"
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={stimulusParams.amplitude}
                    onChange={(e) => handleStimulusParamChange('amplitude', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">2.0</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="stimulus-duration" className="block font-medium text-gray-700 mb-1">
                  Duration: {stimulusParams.duration.toFixed(1)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.1</span>
                  <input
                    id="stimulus-duration"
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={stimulusParams.duration}
                    onChange={(e) => handleStimulusParamChange('duration', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">5.0</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="stimulus-start" className="block font-medium text-gray-700 mb-1">
                  Start Time: {stimulusParams.startTime.toFixed(1)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">1.0</span>
                  <input
                    id="stimulus-start"
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={stimulusParams.startTime}
                    onChange={(e) => handleStimulusParamChange('startTime', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">20.0</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="timespan" className="block font-medium text-gray-700 mb-1">
                  Simulation Length: {stimulusParams.timeSpan.toFixed(0)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">20</span>
                  <input
                    id="timespan"
                    type="range"
                    min="20"
                    max="200"
                    step="1"
                    value={stimulusParams.timeSpan}
                    onChange={(e) => handleStimulusParamChange('timeSpan', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={runCurrentSimulation}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                disabled={simulationStatus === SimulationStatus.RUNNING}
              >
                {simulationStatus === SimulationStatus.RUNNING ? 'Simulating...' : 'Run Simulation'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePresetSelect(CELL_PRESETS.NORMAL)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedPreset === CELL_PRESETS.NORMAL 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => handlePresetSelect(CELL_PRESETS.REDUCED_SODIUM)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedPreset === CELL_PRESETS.REDUCED_SODIUM 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Reduced Na+
                </button>
                <button
                  onClick={() => handlePresetSelect(CELL_PRESETS.REDUCED_POTASSIUM)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedPreset === CELL_PRESETS.REDUCED_POTASSIUM 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Reduced K+
                </button>
                <button
                  onClick={() => handlePresetSelect(CELL_PRESETS.INCREASED_CALCIUM)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedPreset === CELL_PRESETS.INCREASED_CALCIUM 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Increased Ca2+
                </button>
              </div>
            </div>
          </div>
          
          {/* Comparison Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Comparison Tools</h3>
            <div className="space-y-3">
              <button
                onClick={handleToggleComparison}
                className={`w-full px-4 py-2 rounded ${
                  showComparison 
                    ? 'bg-blue-100 text-primary border border-primary' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {showComparison ? 'Hide Comparison' : 'Show Comparison'}
              </button>
              
              {showComparison && (
                <>
                  <button
                    onClick={handleStoreComparison}
                    className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    disabled={!results}
                  >
                    Store Current as Comparison
                  </button>
                  
                  <button
                    onClick={handleClearComparison}
                    className="w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    Clear Comparison
                  </button>
                </>
              )}
              
              <div className="flex items-center mt-4">
                <input
                  id="highlight-phases"
                  type="checkbox"
                  checked={highlightPhases}
                  onChange={() => setHighlightPhases(!highlightPhases)}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="highlight-phases" className="ml-2 text-sm text-gray-700">
                  Highlight FHN Model Phases
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visualization Panel */}
        <div className="lg:col-span-2">
          {/* Action Potential Plot */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Action Potential</h3>
            
            {results ? (
              <ActionPotentialPlot 
                data={results}
                width={800}
                height={400}
                comparisonData={comparisonResults}
                showComparison={showComparison}
                highlightPhases={highlightPhases}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                <p className="text-gray-500">
                  Run a simulation to see the action potential
                </p>
              </div>
            )}
          </div>
          
          {/* Educational Note */}
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-primary mb-2">About the FitzHugh-Nagumo Model</h3>
            <p className="mb-2">
              The FitzHugh-Nagumo model is a simplified 2-variable mathematical model for excitable systems. 
              While it doesn't capture all the ionic details of cardiac cells, it demonstrates key concepts:
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>Excitability and threshold behavior</li>
              <li>Refractory periods</li>
              <li>Response to stimulation</li>
            </ul>
            <p>
              <strong>Tip:</strong> Try changing the parameter values and observe how they affect the 
              action potential shape and dynamics. The "a" parameter affects the threshold, while "epsilon" 
              controls the recovery time scale.
            </p>
          </div>
          
          {/* Metrics Panel */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Action Potential Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Action Potential Duration</div>
                  <div className="text-xl font-semibold">{metrics.apd.toFixed(2)} time units</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Max Upstroke Velocity</div>
                  <div className="text-xl font-semibold">{metrics.maxUpstrokeVelocity.toFixed(2)} dV/dt</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CellModule; 