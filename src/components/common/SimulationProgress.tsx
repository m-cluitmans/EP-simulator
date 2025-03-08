import React from 'react';
import { SimulationStatus } from '../../hooks/useSimulation';

interface SimulationProgressProps {
  status: SimulationStatus;
  progress: number;
  estimatedTimeRemaining: number | null;
  onCancel?: () => void;
  getDebugInfo?: () => any;
}

const SimulationProgress: React.FC<SimulationProgressProps> = ({
  status,
  progress,
  estimatedTimeRemaining,
  onCancel,
  getDebugInfo
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  // Generate an appropriate status message
  const getStatusMessage = (): string => {
    switch (status) {
      case SimulationStatus.IDLE:
        return 'Ready to run simulation';
        
      case SimulationStatus.RUNNING:
        if (progress === 0) {
          return 'Initializing simulation...';
        } else if (estimatedTimeRemaining !== null) {
          return `Simulating... (approx. ${formatTime(estimatedTimeRemaining)} remaining)`;
        } else {
          return 'Simulating...';
        }
        
      case SimulationStatus.COMPLETED:
        return 'Simulation completed';
        
      case SimulationStatus.ERROR:
        return 'Simulation failed';
        
      default:
        return 'Unknown status';
    }
  };
  
  // Determine appropriate color for progress bar
  const getProgressBarColor = (): string => {
    switch (status) {
      case SimulationStatus.RUNNING:
        return 'bg-blue-500';
        
      case SimulationStatus.COMPLETED:
        return 'bg-green-500';
        
      case SimulationStatus.ERROR:
        return 'bg-red-500';
        
      default:
        return 'bg-gray-300';
    }
  };
  
  // Handle debug button click
  const handleDebugClick = () => {
    if (!getDebugInfo) return;
    
    const debugInfo = getDebugInfo();
    console.log('=== SIMULATION DEBUG INFO ===');
    console.log('Status:', status);
    console.log('Progress:', progress, '%');
    console.log('Last message type:', debugInfo.lastMessageType);
    console.log('Messages received:', debugInfo.messageCount);
    console.log('Time since last message:', 
      debugInfo.lastMessageTime ? 
      `${(Date.now() - debugInfo.lastMessageTime) / 1000}s ago` : 
      'No messages yet');
    console.log('Time since start:', `${debugInfo.timeSinceStart}s`);
    console.log('Has Worker:', debugInfo.hasWorker ? 'Yes' : 'No');
    console.log('Has Results:', debugInfo.hasResults ? 'Yes' : 'No');
    console.log('============================');
    
    alert(`Debug info logged to console. Status: ${status}, Progress: ${progress}%, Messages: ${debugInfo.messageCount}`);
  };
  
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{getStatusMessage()}</span>
        {progress > 0 && progress < 100 && status === SimulationStatus.RUNNING && (
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor()}`} 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Detailed information */}
      <div className="mt-3 flex justify-between items-center">
        <div className="flex space-x-2">
          {status === SimulationStatus.RUNNING && (
            <div className="flex items-center">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full opacity-75 animate-ping absolute"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full relative"></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">Processing</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {/* Debug button */}
          {getDebugInfo && (
            <button
              onClick={handleDebugClick}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors"
            >
              Debug
            </button>
          )}
          
          {/* Cancel button */}
          {status === SimulationStatus.RUNNING && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationProgress; 