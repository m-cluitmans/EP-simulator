import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MsParams, 
  applyStimulus,
  calculateAPD,
  calculateMaxUpstrokeVelocity,
  MsResults
} from '../../models/MitchellSchaefferModel';
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
import { useSimulation, SimulationStatus, SimulationType } from '../../hooks/useSimulation';
import SimulationProgress from '../common/SimulationProgress';

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
    amplitude: 1.0,
    duration: 1.0,
    startTime: 5.0,
    timeSpan: 500
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
    runSimulation,
    getDebugInfo,
    cancelSimulation
  } = useSimulation<Record<string, unknown>, MsResults>(
    (simulationParams) => {
      // Extract parameters with fallbacks
      const msParams: MsParams = {
        tau_in: simulationParams.tau_in as number || params.tau_in,
        tau_out: simulationParams.tau_out as number || params.tau_out,
        tau_open: simulationParams.tau_open as number || params.tau_open,
        tau_close: simulationParams.tau_close as number || params.tau_close,
        v_gate: simulationParams.v_gate as number || params.v_gate,
        dt: simulationParams.dt as number || params.dt
      };
      
      const amplitude = simulationParams.amplitude as number || stimulusParams.amplitude;
      const duration = simulationParams.duration as number || stimulusParams.duration;
      const startTime = simulationParams.startTime as number || stimulusParams.startTime;
      const timeSpan = simulationParams.timeSpan as number || stimulusParams.timeSpan;
      
      // Run simulation with parameters
      return applyStimulus(msParams, amplitude, duration, startTime, timeSpan);
    },
    SimulationType.CELL // Specify this is a cell simulation
  );
  
  // Update results when simulation completes
  useEffect(() => {
    if (simulationStatus === SimulationStatus.COMPLETED && simulationResults) {
      dispatch(setResults(simulationResults));
      
      // Calculate metrics
      const apd = calculateAPD(simulationResults, 0.1);
      const maxUpstrokeVelocity = calculateMaxUpstrokeVelocity(simulationResults);
      
      setMetrics({
        apd,
        maxUpstrokeVelocity
      });
    }
  }, [simulationStatus, simulationResults, dispatch]);
  
  // Run current simulation
  const runCurrentSimulation = () => {
    // Create properly structured parameters for the simulation
    const simulationParams = {
      // Cell model parameters - should be in params property
      params: {
        tau_in: params.tau_in,
        tau_out: params.tau_out,
        tau_open: params.tau_open,
        tau_close: params.tau_close,
        v_gate: params.v_gate,
        dt: params.dt
      },
      
      // Simulation parameters
      timeSpan: 500, // Set a longer timespan (500ms)
      initialV: 0,    // Start at resting potential
      initialH: 1,    // Gate fully available
      
      // Stimulus parameters if enabled
      stimulusFn: {
        amplitude: stimulusParams.amplitude,
        duration: stimulusParams.duration,
        start: stimulusParams.startTime
      }
    };
    
    console.log("Running cell simulation with parameters:", simulationParams);
    
    // Run the simulation with properly structured parameters
    runSimulation(simulationParams);
  };
  
  // Handle parameter changes
  const handleParamChange = (paramName: keyof MsParams, value: number) => {
    dispatch(updateParameters({ [paramName]: value }));
  };
  
  // Handle stimulus parameter changes
  const handleStimulusParamChange = (paramName: string, value: number) => {
    setStimulusParams(prev => ({ ...prev, [paramName]: value }));
  };
  
  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    dispatch(applyPreset(preset));
  };
  
  // Toggle comparison mode
  const handleToggleComparison = () => {
    dispatch(toggleComparison());
  };
  
  // Store current simulation as comparison
  const handleStoreComparison = () => {
    if (results) {
      dispatch(setComparisonResults(results));
      dispatch(toggleComparison());
    }
  };
  
  // Clear comparison
  const handleClearComparison = () => {
    dispatch(clearComparison());
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Single Cell Model</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          {/* Presets */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Cell Presets</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {Object.values(CELL_PRESETS).map(preset => (
                <button
                  key={preset}
                  className={`px-3 py-2 rounded ${
                    selectedPreset === preset 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          
          {/* Model Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Mitchell Schaeffer Model Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tau-in" className="block font-medium text-gray-700 mb-1">
                  τᵢₙ (Depolarization): {params.tau_in.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.1</span>
                  <input
                    id="tau-in"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={params.tau_in}
                    onChange={(e) => handleParamChange('tau_in', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">1.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls the speed of depolarization (upstroke velocity). Lower values = faster depolarization.
                </div>
              </div>
              
              <div>
                <label htmlFor="tau-out" className="block font-medium text-gray-700 mb-1">
                  τₒᵤₜ (Repolarization): {params.tau_out.toFixed(1)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">1.0</span>
                  <input
                    id="tau-out"
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.5"
                    value={params.tau_out}
                    onChange={(e) => handleParamChange('tau_out', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">15.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls repolarization time. Higher values = longer action potential duration.
                </div>
              </div>
              
              <div>
                <label htmlFor="tau-open" className="block font-medium text-gray-700 mb-1">
                  τₒₚₑₙ (Recovery): {params.tau_open.toFixed(0)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">50</span>
                  <input
                    id="tau-open"
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={params.tau_open}
                    onChange={(e) => handleParamChange('tau_open', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">200</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls the recovery time. Higher values = longer refractory period.
                </div>
              </div>
              
              <div>
                <label htmlFor="tau-close" className="block font-medium text-gray-700 mb-1">
                  τcₗₒₛₑ (Inactivation): {params.tau_close.toFixed(0)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">50</span>
                  <input
                    id="tau-close"
                    type="range"
                    min="50"
                    max="150"
                    step="10"
                    value={params.tau_close}
                    onChange={(e) => handleParamChange('tau_close', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">150</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Controls gate inactivation speed. Lower values = faster inactivation.
                </div>
              </div>
              
              <div>
                <label htmlFor="v-gate" className="block font-medium text-gray-700 mb-1">
                  Vₗₐₜₑ (Threshold): {params.v_gate.toFixed(2)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.05</span>
                  <input
                    id="v-gate"
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.01"
                    value={params.v_gate}
                    onChange={(e) => handleParamChange('v_gate', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">0.3</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Threshold for gate switching. Higher values = higher threshold for activation.
                </div>
              </div>
            </div>
          </div>
          
          {/* Stimulus Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Stimulus Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="stimulus-amplitude" className="block font-medium text-gray-700 mb-1">
                  Amplitude: {stimulusParams.amplitude.toFixed(1)}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">0.5</span>
                  <input
                    id="stimulus-amplitude"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
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
                    max="2.0"
                    step="0.1"
                    value={stimulusParams.duration}
                    onChange={(e) => handleStimulusParamChange('duration', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">2.0</span>
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
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={stimulusParams.startTime}
                    onChange={(e) => handleStimulusParamChange('startTime', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">10.0</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="simulation-timespan" className="block font-medium text-gray-700 mb-1">
                  Simulation Duration: {stimulusParams.timeSpan}
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">20</span>
                  <input
                    id="simulation-timespan"
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={stimulusParams.timeSpan}
                    onChange={(e) => handleStimulusParamChange('timeSpan', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 ml-2">100</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={runCurrentSimulation}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Run Simulation
              </button>
            </div>
          </div>
          
          {/* Comparison Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Comparison Options</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleStoreComparison}
                disabled={!results}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 transition-colors"
              >
                Save Current for Comparison
              </button>
              
              <button
                onClick={handleToggleComparison}
                disabled={!comparisonResults}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
              >
                {showComparison ? 'Hide Comparison' : 'Show Comparison'}
              </button>
              
              <button
                onClick={handleClearComparison}
                disabled={!comparisonResults}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                Clear Saved Comparison
              </button>
              
              <div className="flex items-center mt-2">
                <input
                  id="highlight-phases"
                  type="checkbox"
                  checked={highlightPhases}
                  onChange={() => setHighlightPhases(!highlightPhases)}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="highlight-phases" className="ml-2 text-sm text-gray-700">
                  Highlight AP Phases
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Potential Visualization */}
        <div className="lg:col-span-2">
          {/* Plots */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Mitchell Schaeffer Action Potential</h3>
            
            {results ? (
              <div>
                <ActionPotentialPlot 
                  data={results} 
                  width={600}
                  height={400}
                  comparisonData={comparisonResults}
                  showComparison={showComparison}
                  highlightPhases={highlightPhases}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                <p className="text-gray-500">Run a simulation to see action potential</p>
              </div>
            )}
          </div>
          
          {/* Metrics */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Action Potential Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Action Potential Duration</div>
                  <div className="text-xl font-semibold">{metrics.apd > 0 ? metrics.apd.toFixed(2) : 'N/A'} time units</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Max Upstroke Velocity</div>
                  <div className="text-xl font-semibold">{metrics.maxUpstrokeVelocity.toFixed(3)} dV/dt</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Educational Content */}
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4">
            <h3 className="text-lg font-semibold text-primary mb-2">About the Mitchell Schaeffer Model</h3>
            
            <p className="mb-2">
              The Mitchell Schaeffer model is a phenomenological model that captures key dynamics of cardiac action potentials
              using a reduced set of variables and parameters with clear physiological interpretations.
            </p>
            
            <p className="mb-2">
              Key advantages of this model:
            </p>
            
            <ul className="list-disc ml-6 mb-2">
              <li>No spontaneous automaticity - cells only activate in response to stimuli</li>
              <li>Parameters directly control specific AP features (upstroke, duration, etc.)</li>
              <li>Computationally efficient while producing realistic action potentials</li>
              <li>Can reproduce reentry and other complex cardiac dynamics</li>
            </ul>
            
            <p>
              <strong>Tip:</strong> To explore different cell behaviors, try adjusting τₒᵤₜ to change
              action potential duration, or τᵢₙ to change upstroke velocity.
            </p>
          </div>
          
          {/* Add the simulation progress component */}
          {simulationStatus !== SimulationStatus.IDLE && (
            <div className="my-4">
              <SimulationProgress 
                status={simulationStatus}
                progress={simulationStatus === SimulationStatus.COMPLETED ? 100 : 0}
                estimatedTimeRemaining={null}
                onCancel={cancelSimulation}
                getDebugInfo={getDebugInfo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CellModule; 