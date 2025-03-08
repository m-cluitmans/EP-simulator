import React, { useState, useEffect } from 'react';

interface ParameterPresetManagerProps<T> {
  currentParameters: T;
  presets: Record<string, T>;
  onApplyPreset: (preset: T) => void;
  onSavePreset: (name: string, preset: T) => void;
  onDeletePreset?: (name: string) => void;
  customPresetKey?: string;
}

function ParameterPresetManager<T>({
  currentParameters,
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  customPresetKey = 'custom-presets'
}: ParameterPresetManagerProps<T>) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<Record<string, T>>({});
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem(customPresetKey);
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      console.error('Error loading custom presets:', error);
    }
  }, [customPresetKey]);
  
  // Save custom presets to localStorage when they change
  useEffect(() => {
    if (Object.keys(customPresets).length > 0) {
      localStorage.setItem(customPresetKey, JSON.stringify(customPresets));
    }
  }, [customPresets, customPresetKey]);
  
  // All presets combined (built-in + custom)
  const allPresets = { ...presets, ...customPresets };
  
  // Handle preset selection
  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = event.target.value;
    setSelectedPreset(presetName);
    
    if (presetName && allPresets[presetName]) {
      onApplyPreset(allPresets[presetName]);
    }
  };
  
  // Handle saving a new preset
  const handleSavePreset = () => {
    // Validate preset name
    if (!newPresetName.trim()) {
      setErrorMessage('Please enter a preset name');
      return;
    }
    
    // Check for name collision with built-in presets
    if (presets[newPresetName]) {
      setErrorMessage('Cannot override built-in preset');
      return;
    }
    
    // Save the preset
    const updatedCustomPresets = {
      ...customPresets,
      [newPresetName]: currentParameters
    };
    
    setCustomPresets(updatedCustomPresets);
    onSavePreset(newPresetName, currentParameters);
    
    // Reset form and close dialog
    setNewPresetName('');
    setShowSaveDialog(false);
    setErrorMessage(null);
    
    // Select the newly created preset
    setSelectedPreset(newPresetName);
  };
  
  // Handle deleting a custom preset
  const handleDeletePreset = () => {
    if (!selectedPreset || !customPresets[selectedPreset]) {
      setErrorMessage('Cannot delete built-in preset');
      return;
    }
    
    // Remove from custom presets
    const { [selectedPreset]: _, ...restPresets } = customPresets;
    setCustomPresets(restPresets);
    
    // Call external handler if provided
    if (onDeletePreset) {
      onDeletePreset(selectedPreset);
    }
    
    // Reset selection
    setSelectedPreset('');
  };
  
  return (
    <div className="w-full bg-white rounded-lg p-4 shadow-sm">
      <div className="text-lg font-medium mb-3">Parameter Presets</div>
      
      {/* Preset Selection */}
      <div className="flex items-center space-x-2 mb-4">
        <select
          className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedPreset}
          onChange={handlePresetChange}
        >
          <option value="">-- Select a preset --</option>
          
          {/* Built-in presets */}
          <optgroup label="Built-in Presets">
            {Object.keys(presets).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </optgroup>
          
          {/* Custom presets */}
          {Object.keys(customPresets).length > 0 && (
            <optgroup label="Custom Presets">
              {Object.keys(customPresets).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </optgroup>
          )}
        </select>
        
        <button
          onClick={() => setShowSaveDialog(true)}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
        
        {onDeletePreset && (
          <button
            onClick={handleDeletePreset}
            disabled={!selectedPreset || !customPresets[selectedPreset]}
            className={`px-3 py-2 rounded transition-colors ${
              !selectedPreset || !customPresets[selectedPreset]
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Delete
          </button>
        )}
      </div>
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <div className="text-sm font-medium mb-2">Save Current Parameters as Preset</div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleSavePreset}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Save
            </button>
            
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setNewPresetName('');
                setErrorMessage(null);
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {errorMessage && (
            <div className="mt-2 text-sm text-red-500">{errorMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParameterPresetManager; 