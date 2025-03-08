import React, { useEffect, useRef } from 'react';
import { TissueSimulationResults } from '../../models/TissueModel';

interface ActionPotentialGraphProps {
  results: TissueSimulationResults;
  selectedCell: { row: number; col: number } | null;
  width?: number;
  height?: number;
}

const ActionPotentialGraph: React.FC<ActionPotentialGraphProps> = ({
  results,
  selectedCell,
  width = 400,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw the action potential graph
  useEffect(() => {
    if (!results || !results.snapshots || !selectedCell) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Extract voltage data for the selected cell
    const { row, col } = selectedCell;
    const voltageData = results.snapshots.map(snapshot => ({
      time: snapshot.time,
      voltage: snapshot.v[row]?.[col] ?? 0
    }));
    
    if (voltageData.length === 0) {
      // No data to display
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('No voltage data available for this cell', width / 2, height / 2);
      return;
    }
    
    // Find max and min values for scaling
    const timeMin = voltageData[0].time;
    const timeMax = voltageData[voltageData.length - 1].time;
    const voltageMin = 0; // Usually voltage is between 0 and 1
    const voltageMax = 1;
    
    // Padding for axes
    const padding = {
      left: 40,
      right: 20,
      top: 20,
      bottom: 30
    };
    
    // Graph dimensions
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Scaling functions
    const scaleX = (time: number) => 
      padding.left + (time - timeMin) / (timeMax - timeMin) * graphWidth;
    const scaleY = (voltage: number) => 
      height - padding.bottom - (voltage - voltageMin) / (voltageMax - voltageMin) * graphHeight;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    
    // Y-axis
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();
    
    // Draw axis labels
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Time (ms)', width / 2, height - 5);
    
    // Y-axis label
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Voltage (normalized)', 0, 0);
    ctx.restore();
    
    // Draw time ticks on X-axis
    const timeStep = Math.ceil((timeMax - timeMin) / 5); // 5 ticks
    for (let time = Math.ceil(timeMin); time <= timeMax; time += timeStep) {
      const x = scaleX(time);
      ctx.beginPath();
      ctx.moveTo(x, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom + 5);
      ctx.stroke();
      ctx.fillText(time.toString(), x, height - padding.bottom + 15);
    }
    
    // Draw voltage ticks on Y-axis
    const voltageStep = 0.2; // 5 ticks: 0, 0.2, 0.4, 0.6, 0.8, 1.0
    for (let voltage = voltageMin; voltage <= voltageMax; voltage += voltageStep) {
      const y = scaleY(voltage);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left - 5, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(voltage.toFixed(1), padding.left - 8, y + 4);
    }
    
    // Draw voltage line
    ctx.beginPath();
    ctx.strokeStyle = '#2563EB'; // Blue
    ctx.lineWidth = 2;
    
    // Plot the line
    for (let i = 0; i < voltageData.length; i++) {
      const { time, voltage } = voltageData[i];
      const x = scaleX(time);
      const y = scaleY(voltage);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw title
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`Action Potential at Cell (${row}, ${col})`, width / 2, padding.top - 5);
    
    // Mark activation time if available
    if (results.activationTimes && results.activationTimes[row]?.[col] > 0) {
      const activationTime = results.activationTimes[row][col];
      const activationX = scaleX(activationTime);
      
      // Draw vertical line at activation time
      ctx.beginPath();
      ctx.strokeStyle = '#EF4444'; // Red
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(activationX, padding.top);
      ctx.lineTo(activationX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label for activation time
      ctx.fillStyle = '#EF4444';
      ctx.textAlign = 'center';
      ctx.font = '10px Arial';
      ctx.fillText(`Activation: ${activationTime.toFixed(1)} ms`, activationX, padding.top + 12);
    }
    
    // Mark APD if available
    if (results.apd && results.apd[row]?.[col] > 0) {
      const apdValue = results.apd[row][col];
      const repolarizationTime = (results.activationTimes?.[row]?.[col] || 0) + apdValue;
      
      if (repolarizationTime <= timeMax) {
        const activationTime = results.activationTimes?.[row]?.[col] || 0;
        const activationX = scaleX(activationTime);
        const repolarizationX = scaleX(repolarizationTime);
        
        // Draw APD span
        ctx.fillStyle = 'rgba(249, 168, 212, 0.2)'; // Light pink with transparency
        ctx.fillRect(activationX, padding.top, repolarizationX - activationX, graphHeight);
        
        // APD Label
        ctx.fillStyle = '#DB2777'; // Pink
        ctx.textAlign = 'center';
        ctx.font = '10px Arial';
        ctx.fillText(
          `APD: ${apdValue.toFixed(1)} ms`, 
          activationX + (repolarizationX - activationX) / 2, 
          height - padding.bottom - 10
        );
      }
    }
  }, [results, selectedCell, width, height]);
  
  if (!selectedCell) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded h-full">
        <p className="text-gray-500">Click on a cell in the tissue to view its action potential</p>
      </div>
    );
  }
  
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
      />
    </div>
  );
};

export default ActionPotentialGraph; 