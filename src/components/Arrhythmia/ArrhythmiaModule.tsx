import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  ArrhythmiaType,
  FibrosisPattern,
  setArrhythmiaType,
  setFibrosisPattern,
  setFibrosisDensity,
  updateS1S2Protocol,
  setArrhythmiaResults,
  setArrhythmiaSimulationStatus,
  setCurrentArrhythmiaTimeIndex,
  identifyReentry,
  identifyBlock,
  updateTissueParams
} from '../../store/slices/arrhythmiaSlice';
import { SimulationStatus, SimulationType } from '../../hooks/useSimulation';
import ArrhythmiaVisualization from './ArrhythmiaVisualization';
import S1S2Controls from './S1S2Controls';
import { simulateArrhythmia, ArrhythmiaResults } from '../../models/ArrhythmiaModel';
import ActionPotentialGraph from './ActionPotentialGraph';

// Add this CSS at the top of the file, after imports
const spinnerStyle = `
  @keyframes spinner {
    to {transform: rotate(360deg);}
  }
  .spinner {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    vertical-align: text-bottom;
    border: 0.2em solid rgba(255,255,255,0.3);
    border-right-color: white;
    border-radius: 50%;
    animation: spinner 0.75s linear infinite;
  }
`;

// Hook to wrap the simulation function to be compatible with the worker pattern
const useArrhythmiaSimulation = () => {
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<ArrhythmiaResults | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const runSimulation = async (params: any) => {
    try {
      setStatus(SimulationStatus.RUNNING);
      setProgress(0);
      setEstimatedTimeRemaining(null);
      
      // Record start time for time estimation
      startTimeRef.current = Date.now();
      
      // Clear previous results
      setResults(null);
      
      console.log("useArrhythmiaSimulation: Starting simulation with parameters", params);
      
      // Run the simulation in smaller steps to keep the UI responsive
      const simulationResults = simulateArrhythmia(params, (progress) => {
        setProgress(progress);
        
        // Calculate estimated time remaining
        if (progress > 5) {  // Wait until we have some progress to make a better estimate
          const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
          const estimatedTotalSeconds = (elapsedSeconds / progress) * 100;
          const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
          setEstimatedTimeRemaining(remainingSeconds);
        }
      });
      
      console.log("useArrhythmiaSimulation: Simulation complete, results:", {
        hasResults: !!simulationResults,
        snapshotsCount: simulationResults?.snapshots?.length || 0
      });
      
      // Validate results
      if (!simulationResults || 
          !simulationResults.snapshots || 
          simulationResults.snapshots.length === 0) {
        console.error("useArrhythmiaSimulation: Invalid simulation results");
        setStatus(SimulationStatus.ERROR);
        return null;
      }
      
      setResults(simulationResults);
      setStatus(SimulationStatus.COMPLETED);
      setProgress(100);
      setEstimatedTimeRemaining(0);
      
      return simulationResults;
    } catch (error) {
      console.error('Arrhythmia simulation error:', error);
      setStatus(SimulationStatus.ERROR);
      return null;
    }
  };
  
  return { status, progress, results, runSimulation, estimatedTimeRemaining };
};

const ArrhythmiaModule: React.FC = () => {
  const dispatch = useDispatch();
  const {
    tissueParams,
    s1s2Protocol,
    selectedArrhythmiaType,
    fibrosisPattern,
    fibrosisDensity,
    results,
    simulationInProgress,
    currentTimeIndex,
    identifiedReentry: showReentry,
    identifiedBlock: showBlock
  } = useSelector((state: RootState) => state.arrhythmia);
  
  // State for animation control
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  
  // Simulation parameters
  const [simulationDuration, setSimulationDuration] = useState<number>(1500);
  const [saveInterval, setSaveInterval] = useState<number>(5);
  
  // Fibrosis seed for reproducible patterns
  const [fibrosisSeed, setFibrosisSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const regenerateFibrosisSeed = () => {
    setFibrosisSeed(Math.floor(Math.random() * 1000000));
  };
  
  // Setup the simulation hook
  const { status: simulationStatus, progress, runSimulation, estimatedTimeRemaining } = useArrhythmiaSimulation();
  
  // Initial setup of S1-S2 protocol based on arrhythmia type
  useEffect(() => {
    if (simulationStatus === SimulationStatus.RUNNING) {
      dispatch(setArrhythmiaSimulationStatus(true));
    }
  }, [simulationStatus, results, dispatch]);
  
  // Handle animation frames
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastTimestamp = 0;
    const frameInterval = 100 / animationSpeed; // ms per frame
    
    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp >= frameInterval) {
        lastTimestamp = timestamp;
        
        if (results && results.snapshots) {
          dispatch(setCurrentArrhythmiaTimeIndex((currentTimeIndex + 1) % results.snapshots.length));
        }
      }
      
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    if (isAnimating && results && results.snapshots) {
      animationFrameId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, currentTimeIndex, results, animationSpeed, dispatch]);
  
  // Run the arrhythmia simulation
  const runArrhythmiaSimulation = () => {
    // Stop any ongoing animation
    setIsAnimating(false);
    
    // Reset visualization indices
    dispatch(setCurrentArrhythmiaTimeIndex(0));
    dispatch(identifyReentry(false));
    dispatch(identifyBlock(false));
    
    // Prepare simulation parameters
    const simulationParams = {
      ...tissueParams,
      s1Amplitude: s1s2Protocol.s1Amplitude,
      s1Duration: s1s2Protocol.s1Duration,
      s1StartTime: 1.0,
      s1Location: s1s2Protocol.s1Location,
      s2Amplitude: s1s2Protocol.s2Amplitude,
      s2Duration: s1s2Protocol.s2Duration,
      s2StartTime: 1.0 + s1s2Protocol.couplingInterval,
      s2Location: s1s2Protocol.s2Location,
      fibrosisPattern,
      fibrosisDensity,
      fibrosisSeed,
      simulationDuration, // Use the user-defined duration
      saveInterval // Use the user-defined save interval
    };
    
    console.log("Starting simulation with parameters:", simulationParams);
    
    // Run the simulation
    runSimulation(simulationParams)
      .then(results => {
        if (results) {
          console.log("Simulation completed successfully, results:", results);
          console.log("Snapshots count:", results.snapshots?.length || 0);
          dispatch(setArrhythmiaResults(results));
          dispatch(setArrhythmiaSimulationStatus(false));
          
          // Automatically detect and identify arrhythmia patterns
          if ((results as ArrhythmiaResults).reentryDetected) {
            dispatch(identifyReentry(true));
          }
          
          if ((results as ArrhythmiaResults).blockDetected) {
            dispatch(identifyBlock(true));
          }
        } else {
          console.error("Simulation returned null or undefined results");
        }
      })
      .catch(err => {
        console.error("Simulation error:", err);
      });
  };
  
  // Handle arrhythmia type selection
  const handleArrhythmiaTypeChange = (type: ArrhythmiaType) => {
    dispatch(setArrhythmiaType(type));
  };
  
  // Handle fibrosis pattern selection
  const handleFibrosisPatternChange = (pattern: FibrosisPattern) => {
    dispatch(setFibrosisPattern(pattern));
    
    // Auto-regenerate fibrosis seed when pattern changes
    if (pattern !== FibrosisPattern.NONE) {
      const newSeed = Math.floor(Math.random() * 1000000);
      setFibrosisSeed(newSeed);
      console.log(`Generated new fibrosis seed ${newSeed} for pattern ${pattern}`);
    }
  };
  
  // Handle fibrosis density change
  const handleFibrosisDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      dispatch(setFibrosisDensity(value));
    }
  };
  
  // Get reentry and block locations from results if available
  const reentryLocations = (results as ArrhythmiaResults)?.reentryLocations || [];
  const blockLocations = (results as ArrhythmiaResults)?.blockLocations || [];
  
  // Toggle animation state
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };
  
  // Get educational content based on selected arrhythmia type
  const getEducationalContent = () => {
    switch (selectedArrhythmiaType) {
      case ArrhythmiaType.REENTRY:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Reentry</h3>
            <p className="mb-2">
              Reentry occurs when an electrical impulse returns to its point of origin and reactivates tissue that has already recovered.
            </p>
            <p className="mb-2">
              Common conditions for reentry include:
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>Conduction heterogeneity (slow pathways)</li>
              <li>Unidirectional block</li>
              <li>Shortened refractory periods</li>
            </ul>
            <p className="mt-4 text-sm text-blue-600">
              This simulation uses a specific S1-S2 protocol with a coupling interval of 345ms to reliably produce reentry.
            </p>
          </div>
        );
        
      case ArrhythmiaType.FIBROSIS:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Fibrosis Effects</h3>
            <p className="mb-2">
              Cardiac fibrosis is the excessive deposition of extracellular matrix in the heart, replacing contractile tissue with non-conductive scar tissue.
            </p>
            <p className="mb-2">
              Impact on electrical propagation:
            </p>
            <ul className="list-disc ml-6 mb-2">
              <li>Creation of conduction barriers</li>
              <li>Zigzag conduction pathways (slower conduction)</li>
              <li>Source-sink mismatches at tissue boundaries</li>
              <li>Formation of reentry substrates</li>
            </ul>
            <p className="mb-2 text-gray-700">
              Fibrotic regions are non-excitable, meaning they cannot be activated by electrical stimuli. 
              Both S1 and S2 stimuli will have no effect on fibrotic tissue, creating barriers to propagation.
            </p>
            <div className="my-3 bg-blue-50 p-2 rounded text-sm">
              <p className="font-medium mb-1">Fibrosis Patterns:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li><span className="font-semibold">Compact:</span> Few large contiguous areas of fibrosis, resembling scar tissue from myocardial infarction</li>
                <li><span className="font-semibold">Patchy:</span> Many small distributed patches, typical of interstitial or diffuse fibrosis</li>
                <li><span className="font-semibold">Diffuse:</span> Randomly distributed fibrotic cells, representing microscopic collagen deposits</li>
              </ul>
            </div>
            <p className="mt-4 text-sm text-blue-600">
              This simulation uses the same S1-S2 protocol as the reentry case, but with added fibrosis to show how structural changes affect propagation.
            </p>
          </div>
        );
        
      default:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2">Normal Propagation</h3>
            <p className="mb-2">
              Normal cardiac electrical propagation originates from the sinoatrial node and travels through the conduction system to activate the ventricles in a coordinated manner.
            </p>
            <p className="mb-2">
              In this simulation, only a single stimulus (S1) is applied, and the S2 stimulus is disabled to demonstrate normal, uninterrupted wave propagation.
            </p>
            <p className="text-sm text-gray-600 mt-4">
              Note how the wavefront travels uniformly across the tissue without any reentry or irregular patterns.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="p-4">
      <style>{spinnerStyle}</style>
      <h2 className="text-2xl font-bold mb-4">Arrhythmia Mechanisms</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          {/* Arrhythmia Type Selection */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Arrhythmia Type</h3>
            <div className="space-y-2">
              {Object.values(ArrhythmiaType).map((type) => (
                <div 
                  key={type}
                  className={`p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedArrhythmiaType === type 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleArrhythmiaTypeChange(type)}
                >
                  <h4 className={`font-medium ${
                    selectedArrhythmiaType === type ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {type === ArrhythmiaType.NORMAL ? 'Normal Propagation' :
                     type === ArrhythmiaType.REENTRY ? 'Reentry' :
                     'Fibrosis Effects'}
                  </h4>
                </div>
              ))}
            </div>
          </div>
          
          {/* S1-S2 Protocol Controls */}
          <S1S2Controls className="mb-6" />
          
          {/* Fibrosis Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Fibrosis Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fibrosis Pattern
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(FibrosisPattern).map((pattern) => (
                  <button
                    key={pattern}
                    className={`px-3 py-2 rounded-md text-sm ${
                      fibrosisPattern === pattern
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => handleFibrosisPatternChange(pattern)}
                  >
                    {pattern === FibrosisPattern.NONE ? 'None' :
                     pattern === FibrosisPattern.DIFFUSE ? 'Diffuse' :
                     pattern === FibrosisPattern.COMPACT ? 'Compact' :
                     'Patchy'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fibrosis Density: {(fibrosisDensity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                className="w-full"
                min="0"
                max="1"
                step="0.01"
                value={fibrosisDensity}
                onChange={handleFibrosisDensityChange}
                disabled={fibrosisPattern === FibrosisPattern.NONE}
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher density creates more extensive non-conductive regions, promoting conduction blocks and reentry.
              </p>
            </div>
            
            {/* Fibrosis Seed Control */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Fibrosis Seed: {fibrosisSeed}
                </label>
                <button 
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded"
                  onClick={regenerateFibrosisSeed}
                  disabled={fibrosisPattern === FibrosisPattern.NONE}
                >
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Using the same seed will produce identical fibrosis patterns, allowing for direct comparisons.
              </p>
            </div>
          </div>
          
          {/* Simulation Parameters */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Simulation Parameters</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Simulation Duration (ms): {simulationDuration}
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  className="flex-grow mr-2"
                  min={500}
                  max={2000}
                  step={100}
                  value={simulationDuration}
                  onChange={(e) => setSimulationDuration(parseInt(e.target.value))}
                />
                <input
                  type="number"
                  className="w-20 px-2 py-1 border rounded-md"
                  min={500}
                  max={2000}
                  step={100}
                  value={simulationDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 500 && val <= 2000) {
                      setSimulationDuration(val);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For reentry to develop fully, a duration of at least 1500ms is recommended.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Save Interval (ms): {saveInterval}
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  className="flex-grow mr-2"
                  min={1}
                  max={10}
                  step={1}
                  value={saveInterval}
                  onChange={(e) => setSaveInterval(parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  className="w-20 px-2 py-1 border rounded-md"
                  min={1}
                  max={10}
                  step={1}
                  value={saveInterval}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 10) {
                      setSaveInterval(val);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Higher values (5-10ms) are recommended for long simulations to improve performance.
              </p>
            </div>
          </div>
          
          {/* Simulation Controls */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Simulation Controls</h3>
            
            <button
              onClick={runArrhythmiaSimulation}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center"
              disabled={simulationInProgress}
            >
              {simulationInProgress ? (
                <>
                  <div className="spinner mr-2"></div>
                  Simulating...
                </>
              ) : 'Run Simulation'}
            </button>
            
            {simulationInProgress && (
              <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <p>{progress.toFixed(0)}% complete</p>
                  {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                    <p>
                      {estimatedTimeRemaining < 60 
                        ? `${Math.ceil(estimatedTimeRemaining)} sec remaining` 
                        : `${Math.ceil(estimatedTimeRemaining / 60)} min remaining`}
                    </p>
                  )}
                </div>
                {simulationDuration > 1000 && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Long simulations may take several minutes to complete.
                  </p>
                )}
              </div>
            )}
            
            {results && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <button
                    onClick={toggleAnimation}
                    className={`px-4 py-1 rounded ${
                      isAnimating ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {isAnimating ? 'Pause' : 'Play'}
                  </button>
                  
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Speed:</span>
                    <select
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={5}>5x</option>
                    </select>
                  </div>
                </div>
                
                <input
                  type="range"
                  className="w-full"
                  min={0}
                  max={results.snapshots.length - 1}
                  value={currentTimeIndex}
                  onChange={(e) => {
                    dispatch(setCurrentArrhythmiaTimeIndex(parseInt(e.target.value, 10)));
                    setIsAnimating(false);
                  }}
                />
                
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0 ms</span>
                  <span>{results.snapshots[results.snapshots.length - 1].time.toFixed(0)} ms</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Visualization Panel */}
        <div className="lg:col-span-2">
          {/* Arrhythmia Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tissue Visualization</h3>
            
            {results ? (
              <ArrhythmiaVisualization 
                results={results}
                currentTimeIndex={currentTimeIndex}
                arrhythmiaType={selectedArrhythmiaType}
                width={600}
                height={400}
                onCellClick={(row, col) => setSelectedCell({ row, col })}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                <p className="text-gray-500">Run a simulation to see arrhythmia patterns</p>
              </div>
            )}
          </div>
          
          {/* Action Potential Graph */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Action Potential
              {selectedCell && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Cell {selectedCell.row}, {selectedCell.col})
                </span>
              )}
            </h3>
            <div style={{ height: '230px' }}>
              {results ? (
                <ActionPotentialGraph
                  results={results}
                  selectedCell={selectedCell}
                  width={600}
                  height={200}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                  <p className="text-gray-500">Run a simulation and click on a cell to view its action potential</p>
                </div>
              )}
            </div>
            {selectedCell && results && (
              <div className="mt-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  {results.activationTimes && results.activationTimes[selectedCell.row]?.[selectedCell.col] > 0 && (
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="font-medium">Activation Time:</p>
                      <p>{results.activationTimes[selectedCell.row][selectedCell.col].toFixed(2)} ms</p>
                    </div>
                  )}
                  {results.apd && results.apd[selectedCell.row]?.[selectedCell.col] > 0 && (
                    <div className="bg-pink-50 p-2 rounded">
                      <p className="font-medium">APD:</p>
                      <p>{results.apd[selectedCell.row][selectedCell.col].toFixed(2)} ms</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="font-medium">Current Voltage:</p>
                    <p>
                      {results.snapshots[currentTimeIndex]?.v[selectedCell.row]?.[selectedCell.col]?.toFixed(3) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Educational Panel */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            {getEducationalContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrhythmiaModule; 