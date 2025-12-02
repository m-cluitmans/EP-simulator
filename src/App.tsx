import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import './App.css';

// Import models for simulation
import { 
  applyStimulus, 
  DEFAULT_MS_PARAMS 
} from './models/MitchellSchaefferModel';

// Import components
import ActionPotentialPlot from './components/Cell/ActionPotentialPlot';
import CellModule from './components/Cell/CellModule';
import TissueModule from './components/Tissue/TissueModule';
import ArrhythmiaModule from './components/Arrhythmia/ArrhythmiaModule';

// Application tabs
enum AppTab {
  HOME = 'home',
  CELL = 'cell',
  TISSUE = 'tissue',
  ARRHYTHMIA = 'arrhythmia',
  ABOUT = 'about',
}

function App() {
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  
  // Run a simple simulation for initial display
  const initialSimulation = applyStimulus(
    DEFAULT_MS_PARAMS,
    1.0,    // stimulus amplitude
    1.0,    // stimulus duration
    5.0,    // stimulus start time
    50      // timespan
  );
  
  // Render appropriate content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case AppTab.HOME:
        return (
          <div className="flex flex-col items-center p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to the Cardiac Electrophysiology Learning Platform</h2>
            <p className="text-lg mb-6">
              This interactive application helps you understand cardiac electrophysiology concepts through
              visualization and simulation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              {/* Module cards */}
              <div 
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveTab(AppTab.CELL)}
              >
                <h3 className="text-xl font-semibold text-primary mb-2">Single Cell Electrophysiology</h3>
                <p>Explore action potential generation and ion channel dynamics in a single cardiac cell.</p>
              </div>
              <div 
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveTab(AppTab.TISSUE)}
              >
                <h3 className="text-xl font-semibold text-primary mb-2">Tissue Propagation</h3>
                <p>Visualize how electrical signals propagate through cardiac tissue.</p>
              </div>
              <div 
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveTab(AppTab.ARRHYTHMIA)}
              >
                <h3 className="text-xl font-semibold text-primary mb-2">Arrhythmia Mechanisms</h3>
                <p>Investigate mechanisms behind cardiac arrhythmias like conduction block and reentry.</p>
              </div>
            </div>
            <div className="mt-8 w-full max-w-5xl">
              <h3 className="text-xl font-semibold mb-4">Preview:</h3>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <ActionPotentialPlot 
                  data={initialSimulation}
                  width={800}
                  height={400}
                  highlightPhases={true}
                />
              </div>
            </div>
          </div>
        );
        
      case AppTab.CELL:
        return <CellModule />;
        
      case AppTab.TISSUE:
        return <TissueModule />;
        
      case AppTab.ARRHYTHMIA:
        return <ArrhythmiaModule />;
        
      case AppTab.ABOUT:
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">About This Platform</h2>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Purpose</h3>
              <p className="mb-4">
                This interactive learning platform is designed to help students understand cardiac 
                electrophysiology concepts through visual, interactive simulations.
              </p>
              
              <h3 className="text-xl font-semibold mb-3">Models</h3>
              <p className="mb-4">
                The simulations use simplified models of cardiac electrophysiology:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>FitzHugh-Nagumo model for cellular action potentials</li>
                <li>2D reaction-diffusion model for tissue propagation</li>
                <li>Modified parameters to represent different pathological conditions</li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-3">Educational Context</h3>
              <p className="mb-4">
                This application serves as an alternative to more complex computational tools like 
                OpenCARP, focusing on educational clarity rather than complete biophysical accuracy.
              </p>
              
              <h3 className="text-xl font-semibold mb-3">Technical Details</h3>
              <p>
                Built with React, TypeScript, and D3.js. Simulations run client-side in the browser 
                using Web Workers when available for optimal performance.
              </p>
            </div>
          </div>
        );
        
      default:
        return <div>Select a module to begin exploring</div>;
    }
  };
  
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col">
              <h1 
                className="text-2xl font-bold cursor-pointer"
                onClick={() => setActiveTab(AppTab.HOME)}
              >
                Cardiac Electrophysiology Platform
              </h1>
              <div className="bg-yellow-600 text-white px-3 py-1 mt-2 rounded text-sm font-medium">
                Warning: This app is fully AI-generated, not human-verified, and may contain mistakes
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex space-x-4 mt-4 md:mt-0">
              <button 
                className={`px-4 py-2 rounded transition-colors ${activeTab === AppTab.CELL ? 'bg-white text-primary' : 'text-white hover:bg-blue-700'}`}
                onClick={() => setActiveTab(AppTab.CELL)}
              >
                Cell
              </button>
              <button 
                className={`px-4 py-2 rounded transition-colors ${activeTab === AppTab.TISSUE ? 'bg-white text-primary' : 'text-white hover:bg-blue-700'}`}
                onClick={() => setActiveTab(AppTab.TISSUE)}
              >
                Tissue
              </button>
              <button 
                className={`px-4 py-2 rounded transition-colors ${activeTab === AppTab.ARRHYTHMIA ? 'bg-white text-primary' : 'text-white hover:bg-blue-700'}`}
                onClick={() => setActiveTab(AppTab.ARRHYTHMIA)}
              >
                Arrhythmia
              </button>
              <button 
                className={`px-4 py-2 rounded transition-colors ${activeTab === AppTab.ABOUT ? 'bg-white text-primary' : 'text-white hover:bg-blue-700'}`}
                onClick={() => setActiveTab(AppTab.ABOUT)}
              >
                About
              </button>
            </nav>
          </div>
        </header>
        
        {/* Main content */}
        <main className="container mx-auto py-4">
          {renderContent()}
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 p-4 border-t">
          <div className="container mx-auto text-center text-gray-600">
            <p>Cardiac Electrophysiology Learning Platform &copy; {new Date().getFullYear()}</p>
            <p className="text-sm mt-1">
              Created for educational purposes in biomedical engineering and medical sciences.
            </p>
            <p className="text-sm font-semibold mt-2 text-yellow-600">
              Warning: This app is fully AI-generated, not human-verified, and may contain mistakes
            </p>
          </div>
        </footer>
      </div>
    </Provider>
  );
}

export default App;
