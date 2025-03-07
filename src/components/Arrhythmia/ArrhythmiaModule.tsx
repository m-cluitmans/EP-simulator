import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import ReentrySimulation from './ReentrySimulation';
import MechanismExplainer from './MechanismExplainer';

// Arrhythmia scenario types
export enum ArrhythmiaScenario {
  ANATOMICAL_REENTRY = 'anatomical',
  FUNCTIONAL_REENTRY = 'functional',
  TRIGGER_INITIATION = 'trigger',
  SUBSTRATE_MAINTENANCE = 'substrate',
  SOURCE_SINK_MISMATCH = 'source_sink',
  WAVEFRONT_LENGTH = 'wavefront_length'
}

// Educational section types
export enum EducationalSection {
  REENTRY_TYPES = 'reentry_types',
  TRIGGER_VS_SUBSTRATE = 'trigger_vs_substrate',
  ADVANCED_CONCEPTS = 'advanced_concepts'
}

const ArrhythmiaModule: React.FC = () => {
  // State for the currently selected educational section
  const [currentSection, setCurrentSection] = useState<EducationalSection>(EducationalSection.REENTRY_TYPES);
  
  // State for the currently selected demonstration scenario
  const [currentScenario, setCurrentScenario] = useState<ArrhythmiaScenario>(ArrhythmiaScenario.ANATOMICAL_REENTRY);
  
  // State for whether a simulation is running
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Update scenario when changing sections to ensure a relevant scenario is selected
  useEffect(() => {
    // When changing sections, update to a relevant default scenario
    if (currentSection === EducationalSection.REENTRY_TYPES) {
      setCurrentScenario(ArrhythmiaScenario.ANATOMICAL_REENTRY);
    } else if (currentSection === EducationalSection.TRIGGER_VS_SUBSTRATE) {
      setCurrentScenario(ArrhythmiaScenario.TRIGGER_INITIATION);
    } else if (currentSection === EducationalSection.ADVANCED_CONCEPTS) {
      setCurrentScenario(ArrhythmiaScenario.SOURCE_SINK_MISMATCH);
    }
  }, [currentSection]);
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Arrhythmia Mechanisms</h2>
      
      {/* Educational Section Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Educational Topics</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-4 py-2 rounded-md ${currentSection === EducationalSection.REENTRY_TYPES ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setCurrentSection(EducationalSection.REENTRY_TYPES)}
          >
            Functional vs. Anatomical Reentry
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${currentSection === EducationalSection.TRIGGER_VS_SUBSTRATE ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setCurrentSection(EducationalSection.TRIGGER_VS_SUBSTRATE)}
          >
            Triggers vs. Substrate
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${currentSection === EducationalSection.ADVANCED_CONCEPTS ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setCurrentSection(EducationalSection.ADVANCED_CONCEPTS)}
          >
            Advanced Concepts
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scenario Selection & Controls */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {currentSection === EducationalSection.REENTRY_TYPES 
                ? 'Reentry Scenarios' 
                : currentSection === EducationalSection.TRIGGER_VS_SUBSTRATE
                ? 'Arrhythmia Mechanisms'
                : 'Advanced Concepts'
              }
            </h3>
            
            {currentSection === EducationalSection.REENTRY_TYPES && (
              <div className="space-y-4">
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.ANATOMICAL_REENTRY)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.ANATOMICAL_REENTRY ? 'text-blue-600' : 'text-gray-700'}`}>
                    Anatomical Reentry
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Wave circulates around a fixed, non-conductive obstacle
                  </p>
                </div>
                
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.FUNCTIONAL_REENTRY)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.FUNCTIONAL_REENTRY ? 'text-blue-600' : 'text-gray-700'}`}>
                    Functional Reentry
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Wave rotates around a functional core without fixed obstacle
                  </p>
                </div>
              </div>
            )}
            
            {currentSection === EducationalSection.TRIGGER_VS_SUBSTRATE && (
              <div className="space-y-4">
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.TRIGGER_INITIATION)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.TRIGGER_INITIATION ? 'text-blue-600' : 'text-gray-700'}`}>
                    Arrhythmia Triggers
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Premature beats initiating an arrhythmia
                  </p>
                </div>
                
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.SUBSTRATE_MAINTENANCE)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.SUBSTRATE_MAINTENANCE ? 'text-blue-600' : 'text-gray-700'}`}>
                    Arrhythmia Substrate
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Tissue properties that maintain an arrhythmia
                  </p>
                </div>
              </div>
            )}
            
            {currentSection === EducationalSection.ADVANCED_CONCEPTS && (
              <div className="space-y-4">
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.SOURCE_SINK_MISMATCH)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.SOURCE_SINK_MISMATCH ? 'text-blue-600' : 'text-gray-700'}`}>
                    Source-Sink Mismatch
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Unequal distribution of current source vs current sink
                  </p>
                </div>
                
                <div className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setCurrentScenario(ArrhythmiaScenario.WAVEFRONT_LENGTH)}>
                  <h4 className={`font-medium ${currentScenario === ArrhythmiaScenario.WAVEFRONT_LENGTH ? 'text-blue-600' : 'text-gray-700'}`}>
                    Wavefront Length
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Relationship between conduction velocity and refractory period
                  </p>
                </div>
              </div>
            )}
            
            {/* Simulation Controls */}
            <div className="mt-6">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`w-full py-2 px-4 rounded-md ${isSimulating 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {isSimulating ? 'Stop Simulation' : 'Run Simulation'}
              </button>
            </div>
          </div>
          
          {/* Explanation Panel */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">About These Demonstrations</h3>
            <p className="text-sm text-gray-600">
              These visualizations are simplified educational demonstrations designed to illustrate key concepts in arrhythmia mechanisms.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Each animation highlights specific characteristics of different arrhythmia types, focusing on the core educational concepts rather than precise physiological simulation.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Use the controls above to explore different arrhythmia scenarios and educational topics.
            </p>
          </div>
        </div>
        
        {/* Right Column: Simulation and Explainer */}
        <div className="lg:col-span-2">
          {/* Simulation visualization */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Simulation</h3>
            <ReentrySimulation 
              scenario={currentScenario}
              isRunning={isSimulating}
            />
          </div>
          
          {/* Educational content */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Understanding the Mechanism</h3>
            <MechanismExplainer
              scenario={currentScenario}
              activeSection={currentSection}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrhythmiaModule; 