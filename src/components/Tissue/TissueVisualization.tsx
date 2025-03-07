import React, { useRef, useEffect } from 'react';
import { TissueData, TissueSimulationResults } from '../../models/TissueModel';
import { VisualizationMode } from '../../store/slices/tissueSlice';

interface TissueVisualizationProps {
  visualizationMode: VisualizationMode;
  currentData: TissueData | null;
  results: TissueSimulationResults | null;
  cellSize: number;
  colorScales: {
    voltage: (voltage: number) => string;
    activationTime: (time: number) => string;
    apd: (duration: number) => string;
  };
  onCellClick?: (row: number, col: number) => void;
  selectedCell?: { row: number; col: number } | null;
}

const TissueVisualization: React.FC<TissueVisualizationProps> = ({
  visualizationMode,
  currentData,
  results,
  cellSize,
  colorScales,
  onCellClick,
  selectedCell
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Safe color scale wrapper to handle edge cases
  const safeDraw = (value: number, colorScale: (value: number) => string): string => {
    try {
      // Handle special values
      if (value === undefined || value === null || Number.isNaN(value)) {
        return 'rgb(200, 200, 200)'; // Default gray for invalid values
      }
      return colorScale(value);
    } catch (error) {
      console.warn('Error applying color scale:', error);
      return 'rgb(200, 200, 200)'; // Fallback color
    }
  };
  
  // Handle click events on the canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the position relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale coordinates if canvas is displayed at a different size than its intrinsic size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert to cell coordinates
    const col = Math.floor((x * scaleX) / cellSize);
    const row = Math.floor((y * scaleY) / cellSize);
    
    // Call the callback with the cell coordinates
    onCellClick(row, col);
  };
  
  // Draw the tissue on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If we don't have data, exit
    if (!currentData && !results) return;
    
    // Get the appropriate data for the current visualization mode
    let dataToVisualize: number[][] = [];
    let colorScale = colorScales.voltage; // Default to voltage color scale
    
    switch (visualizationMode) {
      case VisualizationMode.VOLTAGE:
        // For voltage, use current snapshot data
        if (currentData) {
          dataToVisualize = currentData.v;
          colorScale = colorScales.voltage;
        }
        break;
        
      case VisualizationMode.ACTIVATION_TIMES:
        // For activation times, use the activation times from results
        if (results) {
          dataToVisualize = results.activationTimes;
          colorScale = colorScales.activationTime;
        }
        break;
        
      case VisualizationMode.ACTION_POTENTIAL_DURATION:
        // For APD, use the APD data from results
        if (results) {
          dataToVisualize = results.apd;
          colorScale = colorScales.apd;
        }
        break;
        
      default:
        // Default to voltage if available
        if (currentData) {
          dataToVisualize = currentData.v;
        }
    }
    
    // Exit if we don't have data to visualize
    if (!dataToVisualize || !dataToVisualize.length) return;
    
    // Ensure all rows have data
    const validRows = dataToVisualize.filter(row => Array.isArray(row) && row.length > 0);
    if (validRows.length === 0) return;
    
    // Resize canvas to match the grid size
    const rows = validRows.length;
    const cols = validRows[0].length;
    
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    
    // Special handling for activation times - filter out negative values (unactivated cells)
    let filteredData = validRows.map(row => [...row]);
    if (visualizationMode === VisualizationMode.ACTIVATION_TIMES) {
      // Find the maximum activation time for proper coloring
      const validTimes = filteredData.flat().filter(val => val >= 0);
      const maxTime = validTimes.length ? Math.max(...validTimes) : 0;
      
      // Set unactivated cells (value -1) to a special value for visualization
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (filteredData[i][j] < 0) {
            filteredData[i][j] = -1; // Will be handled specially
          }
        }
      }
    }
    
    // Draw each cell
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols && j < filteredData[i].length; j++) {
        const value = filteredData[i][j];
        
        // Special handling for unactivated cells in activation time view
        if (visualizationMode === VisualizationMode.ACTIVATION_TIMES && value < 0) {
          ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'; // Gray for unactivated cells
        } else {
          // Use the color scale for the current visualization mode with error handling
          ctx.fillStyle = safeDraw(value, colorScale);
        }
        
        // Draw the cell
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        
        // Add cell borders for clarity when cells are large enough
        if (cellSize > 3) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
        
        // Highlight the selected cell if any
        if (selectedCell && selectedCell.row === i && selectedCell.col === j) {
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
          ctx.lineWidth = 1;
        }
      }
    }
    
    // Add visualization legend
    drawLegend(ctx, canvas.width, canvas.height, visualizationMode);
    
  }, [visualizationMode, currentData, results, cellSize, colorScales, selectedCell]);
  
  // Helper function to draw a legend for the visualization
  const drawLegend = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    mode: VisualizationMode
  ) => {
    // Position the legend in the bottom right corner
    const legendWidth = 150;
    const legendHeight = 20;
    const x = width - legendWidth - 10;
    const y = height - legendHeight - 10;
    
    // Create a gradient for the legend
    const gradient = ctx.createLinearGradient(x, y, x + legendWidth, y);
    
    // Set up gradient colors based on visualization mode
    switch (mode) {
      case VisualizationMode.VOLTAGE:
        gradient.addColorStop(0, 'blue');       // Negative voltage (resting)
        gradient.addColorStop(0.5, 'white');    // Zero voltage (threshold)
        gradient.addColorStop(1, 'red');        // Positive voltage (excited)
        break;
        
      case VisualizationMode.ACTIVATION_TIMES:
        gradient.addColorStop(0, 'blue');       // Early activation
        gradient.addColorStop(0.25, 'cyan');
        gradient.addColorStop(0.5, 'green');
        gradient.addColorStop(0.75, 'yellow');
        gradient.addColorStop(1, 'red');        // Late activation
        break;
        
      case VisualizationMode.ACTION_POTENTIAL_DURATION:
        gradient.addColorStop(0, 'green');      // Short APD
        gradient.addColorStop(0.5, 'yellow');
        gradient.addColorStop(1, 'red');        // Long APD
        break;
    }
    
    // Draw legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(x - 5, y - 5, legendWidth + 10, legendHeight + 25);
    
    // Draw the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, legendWidth, legendHeight);
    
    // Add border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeRect(x, y, legendWidth, legendHeight);
    
    // Add labels
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // Label based on visualization mode
    let leftLabel = '', rightLabel = '', centerLabel = '';
    switch (mode) {
      case VisualizationMode.VOLTAGE:
        leftLabel = 'Resting';
        centerLabel = 'Voltage';
        rightLabel = 'Excited';
        break;
        
      case VisualizationMode.ACTIVATION_TIMES:
        leftLabel = 'Early';
        centerLabel = 'Activation Time';
        rightLabel = 'Late';
        break;
        
      case VisualizationMode.ACTION_POTENTIAL_DURATION:
        leftLabel = 'Short';
        centerLabel = 'APD';
        rightLabel = 'Long';
        break;
    }
    
    ctx.fillText(leftLabel, x, y + legendHeight + 12);
    ctx.fillText(centerLabel, x + legendWidth / 2, y + legendHeight + 12);
    ctx.fillText(rightLabel, x + legendWidth, y + legendHeight + 12);
  };
  
  return (
    <div className="tissue-visualization">
      <canvas 
        ref={canvasRef}
        className="border rounded cursor-pointer"
        style={{ maxWidth: '100%', height: 'auto' }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};

export default TissueVisualization; 