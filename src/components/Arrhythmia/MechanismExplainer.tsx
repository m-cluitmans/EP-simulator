import React from 'react';
import { ArrhythmiaScenario, EducationalSection } from './ArrhythmiaTypes';

interface MechanismExplainerProps {
  scenario: ArrhythmiaScenario;
  activeSection: EducationalSection;
}

/**
 * Component for providing educational content about arrhythmia mechanisms
 */
const MechanismExplainer: React.FC<MechanismExplainerProps> = ({ 
  scenario,
  activeSection
}) => {
  // Content based on the active education section
  const renderEducationalContent = () => {
    switch (activeSection) {
      case EducationalSection.REENTRY_TYPES:
        return renderReentryTypesContent();
      case EducationalSection.TRIGGER_VS_SUBSTRATE:
        return renderTriggerSubstrateContent();
      case EducationalSection.ADVANCED_CONCEPTS:
        return renderAdvancedConceptsContent();
      default:
        return <p>Select an educational topic to learn more.</p>;
    }
  };

  // Content for explaining reentry types
  const renderReentryTypesContent = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Functional vs Anatomical Reentry</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-blue-800">Anatomical Reentry</h4>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Electrical impulse circulates around a fixed anatomical obstacle</li>
              <li>Examples: scar tissue, valve annuli, or blood vessels</li>
              <li>The circuit has a fixed path length determined by the obstacle size</li>
              <li>Classic example: atrial flutter around the tricuspid valve</li>
              <li>Treatments often target the narrow "isthmus" of the circuit</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-purple-800">Functional Reentry</h4>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Does not require a fixed anatomical obstacle</li>
              <li>Maintained by tissue properties and wave dynamics</li>
              <li>Centers around a "phase singularity" point</li>
              <li>Examples: spiral waves, rotors in ventricular tachycardia</li>
              <li>Circuit path can change and move over time</li>
              <li>Can form due to heterogeneity in tissue refractoriness</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mt-4">
          <h4 className="text-lg font-medium">Key Differences</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full mt-2">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Property</th>
                  <th className="px-4 py-2 text-left">Anatomical Reentry</th>
                  <th className="px-4 py-2 text-left">Functional Reentry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2 font-medium">Obstacle</td>
                  <td className="border px-4 py-2">Fixed physical structure</td>
                  <td className="border px-4 py-2">No fixed obstacle required</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Circuit Path</td>
                  <td className="border px-4 py-2">Fixed, stable</td>
                  <td className="border px-4 py-2">Can change and move</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Core</td>
                  <td className="border px-4 py-2">Anatomical barrier</td>
                  <td className="border px-4 py-2">Phase singularity</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Treatment</td>
                  <td className="border px-4 py-2">Ablate critical isthmus</td>
                  <td className="border px-4 py-2">May require substrate modification</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Current scenario relevance */}
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <h4 className="text-lg font-medium">Current Scenario</h4>
          <p className="mt-2">
            {scenario === ArrhythmiaScenario.ANATOMICAL_REENTRY && 
              "The simulation shows anatomical reentry around a fixed obstacle. Notice how the wavefront consistently travels around the circular obstacle in a fixed path."}
            {scenario === ArrhythmiaScenario.FUNCTIONAL_REENTRY && 
              "The simulation shows functional reentry (spiral wave). Notice the rotation around a phase singularity point without a physical obstacle."}
            {(scenario === ArrhythmiaScenario.TRIGGER_INITIATION || scenario === ArrhythmiaScenario.SUBSTRATE_MAINTENANCE) && 
              "Switch to one of the reentry scenarios to see these concepts in action."}
          </p>
        </div>
      </div>
    );
  };
  
  // Content for explaining triggers vs substrate
  const renderTriggerSubstrateContent = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Triggers vs Substrate in Arrhythmias</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-red-800">Triggers</h4>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Events that initiate an arrhythmia</li>
              <li>Examples: premature beats, early afterdepolarizations</li>
              <li>Can originate from increased automaticity</li>
              <li>Often due to catecholamines, electrolyte imbalances, drugs</li>
              <li>May occur at specific locations ("focal sources")</li>
              <li>Can initiate arrhythmia but may not sustain it</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-green-800">Substrate</h4>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Underlying tissue abnormalities that maintain arrhythmias</li>
              <li>Examples: fibrosis, scarring, ion channel heterogeneity</li>
              <li>Creates conditions for reentry circuits</li>
              <li>Often develops slowly with disease progression</li>
              <li>Includes conduction slowing and repolarization gradients</li>
              <li>Provides the "soil" where arrhythmias can grow</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium">Clinical Implications</h4>
          <p className="mt-2">
            Understanding the interplay between triggers and substrate has important clinical implications.
            Arrhythmias often require both a trigger to initiate and a suitable substrate to maintain.
            This concept has been formalized as the "trigger-substrate model" of arrhythmogenesis.
          </p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium">Trigger-Focused Treatment</h5>
              <ul className="list-disc pl-5 mt-1">
                <li>Beta-blockers reduce triggering premature beats</li>
                <li>Calcium channel blockers reduce triggered activity</li>
                <li>Focal ablation of trigger sites</li>
                <li>Treatment of electrolyte imbalances</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium">Substrate-Focused Treatment</h5>
              <ul className="list-disc pl-5 mt-1">
                <li>Substrate modification with ablation</li>
                <li>Antiarrhythmic drugs that modify conduction</li>
                <li>Anti-fibrotic treatments</li>
                <li>Treatment of underlying heart disease</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Current scenario relevance */}
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <h4 className="text-lg font-medium">Current Scenario</h4>
          <p className="mt-2">
            {scenario === ArrhythmiaScenario.TRIGGER_INITIATION && 
              "The simulation demonstrates how a premature beat (trigger) can initiate a reentry circuit. Notice how the premature beat encounters tissue that is still partially refractory, leading to unidirectional block and the formation of a circuit."}
            {scenario === ArrhythmiaScenario.SUBSTRATE_MAINTENANCE && 
              "The simulation shows how tissue heterogeneity (substrate) maintains a reentry circuit. Notice the areas of slow conduction, repolarization gradient, and functional lines of block that stabilize the arrhythmia."}
            {(scenario === ArrhythmiaScenario.ANATOMICAL_REENTRY || scenario === ArrhythmiaScenario.FUNCTIONAL_REENTRY) && 
              "Switch to one of the trigger or substrate scenarios to see these concepts in action."}
          </p>
        </div>
      </div>
    );
  };

  // Content for explaining advanced arrhythmia concepts
  const renderAdvancedConceptsContent = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Advanced Arrhythmia Concepts</h3>
        
        {scenario === ArrhythmiaScenario.SOURCE_SINK_MISMATCH && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-purple-800">Source-Sink Mismatch</h4>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="mb-2">
                The source-sink relationship describes how electrical current flows between depolarized (source) and 
                resting (sink) cardiac tissue. A mismatch occurs when the current source is insufficient to depolarize 
                the downstream sink.
              </p>
              
              <h5 className="font-medium mt-3">Key Concepts:</h5>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><span className="font-medium">Source:</span> Depolarized tissue that provides outward current</li>
                <li><span className="font-medium">Sink:</span> Polarized tissue that receives the current</li>
                <li><span className="font-medium">Safety Factor:</span> Ratio of available current to current needed for propagation</li>
                <li><span className="font-medium">Impedance Mismatch:</span> Occurs at tissue expansions or narrowings</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="text-lg font-medium text-blue-800">Source-Sink Match</h5>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Current source adequate to excite the sink</li>
                  <li>Normal propagation maintained</li>
                  <li>Safety factor {'>'} 1</li>
                  <li>Occurs in uniform tissue or balanced expansions</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-lg font-medium text-red-800">Source-Sink Mismatch</h5>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Current source inadequate to excite the sink</li>
                  <li>Propagation failure or conduction block</li>
                  <li>Safety factor less than 1</li>
                  <li>Common at tissue expansions, branching points</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-lg font-medium">Clinical Relevance</h5>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><span className="font-medium">Unidirectional Block:</span> Source-sink mismatch in one direction but not the other</li>
                <li><span className="font-medium">PVC Failure:</span> Premature beats that fail to propagate due to limited source current</li>
                <li><span className="font-medium">Ischemic Border:</span> Conduction failures at borders between normal and ischemic tissue</li>
                <li><span className="font-medium">Gap Junction Remodeling:</span> Changes that can exacerbate source-sink mismatches</li>
              </ul>
              
              <p className="mt-3">
                Source-sink mismatch explains why conduction fails in certain anatomical or pathological conditions,
                and is fundamental to understanding unidirectional block, which is essential for reentry formation.
              </p>
            </div>
          </div>
        )}
        
        {scenario === ArrhythmiaScenario.WAVEFRONT_LENGTH && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-green-800">Wavelength Concept in Arrhythmias</h4>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="mb-2">
                The wavelength concept relates the size of a reentrant circuit to the properties of the 
                cardiac tissue. It is a fundamental concept for understanding when reentry can be sustained.
              </p>
              
              <div className="border-l-4 border-green-500 pl-3 mt-3">
                <p className="font-medium">Wavelength = Conduction Velocity × Effective Refractory Period</p>
              </div>
              
              <h5 className="font-medium mt-3">Components:</h5>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><span className="font-medium">Conduction Velocity (CV):</span> Speed of impulse propagation</li>
                <li><span className="font-medium">Effective Refractory Period (ERP):</span> Time during which tissue cannot be re-excited</li>
                <li><span className="font-medium">Wavelength:</span> Physical length of the depolarized and refractory tissue</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="text-md font-medium text-blue-800">Normal Wavelength</h5>
                <div className="mt-2 text-center">
                  <div className="inline-block h-4 w-20 bg-blue-500 rounded"></div>
                </div>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li>Normal CV and ERP</li>
                  <li>Wavelength {'>'} circuit length</li>
                  <li>Reentry not possible</li>
                  <li>Normal sinus rhythm</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="text-md font-medium text-yellow-800">Shortened Wavelength</h5>
                <div className="mt-2 text-center">
                  <div className="inline-block h-4 w-12 bg-yellow-500 rounded"></div>
                </div>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li>Reduced CV or ERP</li>
                  <li>Wavelength ≈ circuit length</li>
                  <li>Reentry possible</li>
                  <li>Arrhythmia vulnerable</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-md font-medium text-red-800">Very Short Wavelength</h5>
                <div className="mt-2 text-center">
                  <div className="inline-block h-4 w-6 bg-red-500 rounded"></div>
                </div>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li>Severely reduced CV or ERP</li>
                  <li>Wavelength much less than circuit length</li>
                  <li>Multiple reentry circuits</li>
                  <li>Fibrillation risk</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="text-lg font-medium">Clinical Applications</h5>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="font-medium">Factors That Shorten Wavelength:</h6>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Reduced conduction velocity (fibrosis, gap junction dysfunction)</li>
                    <li>Shortened refractory period (increased K+ channels, drugs)</li>
                    <li>Ischemia (affects both CV and ERP)</li>
                    <li>Electrolyte imbalances (hypokalemia, hypomagnesemia)</li>
                    <li>Autonomic influences (especially sympathetic stimulation)</li>
                  </ul>
                </div>
                
                <div>
                  <h6 className="font-medium">Therapeutic Implications:</h6>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li>Class I antiarrhythmics: Slow CV (may paradoxically promote reentry)</li>
                    <li>Class III antiarrhythmics: Prolong ERP (increase wavelength, prevent reentry)</li>
                    <li>Ablation: Creates barriers to prevent reentrant circuits</li>
                    <li>Autonomic modulation: May affect wavelength</li>
                  </ul>
                </div>
              </div>
              
              <p className="mt-3 text-sm">
                The wavelength concept provides a basis for understanding why certain conditions promote arrhythmias
                and helps explain the mechanisms behind various antiarrhythmic drug effects.
              </p>
            </div>
          </div>
        )}
        
        {/* Current scenario relevance */}
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <h4 className="text-lg font-medium">Simulation Insights</h4>
          <p className="mt-2">
            {scenario === ArrhythmiaScenario.SOURCE_SINK_MISMATCH && 
              "The simulation demonstrates source-sink relationships. Notice how conduction succeeds when the source and sink are balanced, but fails when the sink becomes too large relative to the current source."}
            {scenario === ArrhythmiaScenario.WAVEFRONT_LENGTH && 
              "The simulation shows how wavelength affects reentry. With long wavelengths, the circuit cannot sustain reentry. As wavelength decreases, reentry becomes possible, and with very short wavelengths, multiple reentry circuits can coexist."}
            {(scenario !== ArrhythmiaScenario.SOURCE_SINK_MISMATCH && scenario !== ArrhythmiaScenario.WAVEFRONT_LENGTH) && 
              "Switch to one of the advanced concept scenarios to see these principles in action."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mechanism-explainer p-4 bg-white rounded-lg shadow">
      {renderEducationalContent()}
    </div>
  );
};

export default MechanismExplainer; 