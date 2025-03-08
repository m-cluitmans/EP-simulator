import React, { useRef, useEffect, useState } from 'react';
import { TissueSimulationResults, TissueData } from '../../models/TissueModel';
import { ArrhythmiaType, FibrosisPattern } from '../../store/slices/arrhythmiaSlice';
import { createVoltageColorScale } from '../../utils/colorScales';

interface ArrhythmiaVisualizationProps {
  results: TissueSimulationResults;
  currentTimeIndex: number;
  arrhythmiaType: ArrhythmiaType;
  width?: number;
  height?: number;
  onCellClick?: (row: number, col: number) => void;
}

const ArrhythmiaVisualization: React.FC<ArrhythmiaVisualizationProps> = ({
  results,
  currentTimeIndex,
  arrhythmiaType,
  width = 600,
  height = 400,
  onCellClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  
  // Create a color scale for voltage values
  const colorScale = createVoltageColorScale(0, 1);
  
  // Draw the tissue visualization
  useEffect(() => {
    console.log("ArrhythmiaVisualization: Drawing with results", {
      hasResults: !!results,
      snapshotsCount: results?.snapshots?.length,
      currentTimeIndex
    });
    
    if (!results || !results.snapshots || results.snapshots.length === 0) {
      console.error("ArrhythmiaVisualization: No valid snapshots to render");
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("ArrhythmiaVisualization: Canvas reference is null");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("ArrhythmiaVisualization: Could not get 2D context from canvas");
      return;
    }
    
    // Ensure current index is within bounds
    const safeCurrentIndex = Math.min(Math.max(0, currentTimeIndex), results.snapshots.length - 1);
    
    // Get current snapshot
    const snapshot = results.snapshots[safeCurrentIndex];
    
    if (!snapshot || !snapshot.v || !snapshot.v.length) {
      console.error("ArrhythmiaVisualization: Invalid snapshot data", snapshot);
      return;
    }
    
    console.log(`ArrhythmiaVisualization: Rendering snapshot at time=${snapshot.time.toFixed(2)}`);
    
    // Calculate cell size
    const rows = snapshot.v.length;
    const cols = snapshot.v[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw tissue
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const voltage = snapshot.v[i][j];
        
        // Set fill color based on voltage
        ctx.fillStyle = colorScale(voltage);
        
        // Draw cell rectangle
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      }
    }
    
    // Draw overlay for markers
    drawOverlay();

    // Add this to update the overlay when the selected cell changes
    if (hoveredCell) {
      drawCellInfo(hoveredCell.row, hoveredCell.col);
    }
  }, [results, currentTimeIndex, arrhythmiaType, width, height, hoveredCell]);
  
  // Draw overlay with markers for reentry and block
  const drawOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear overlay
    ctx.clearRect(0, 0, width, height);
    
    if (!results || !results.snapshots || results.snapshots.length === 0) return;
    
    // Calculate cell size
    const rows = results.snapshots[0].v.length;
    const cols = results.snapshots[0].v[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Draw hovered cell highlight
    if (hoveredCell) {
      const { row, col } = hoveredCell;
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
      
      // Show cell information
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x + cellWidth, y, 100, 60);
      ctx.fillStyle = 'black';
      
      if (results.snapshots[currentTimeIndex]) {
        const voltage = results.snapshots[currentTimeIndex].v[row][col];
        const activationTime = results.activationTimes?.[row]?.[col] || 'N/A';
        const apdValue = results.apd?.[row]?.[col] || 'N/A';
        
        ctx.fillText(`Row: ${row}`, x + cellWidth + 5, y + 15);
        ctx.fillText(`Col: ${col}`, x + cellWidth + 5, y + 30);
        ctx.fillText(`V: ${voltage.toFixed(2)}`, x + cellWidth + 5, y + 45);
      }
    }
  };
  
  // Draw cell information on hover
  const drawCellInfo = (row: number, col: number) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || !results || !results.snapshots) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate cell size
    const rows = results.snapshots[0].v.length;
    const cols = results.snapshots[0].v[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const x = col * cellWidth;
    const y = row * cellHeight;
    
    // Draw highlighted border for cell
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
    
    // Show cell information
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x + cellWidth, y, 100, 60);
    ctx.fillStyle = 'black';
    
    const safeIndex = Math.min(currentTimeIndex, results.snapshots.length - 1);
    if (results.snapshots[safeIndex]) {
      const voltage = results.snapshots[safeIndex].v[row][col];
      const activationTime = results.activationTimes?.[row]?.[col] || 'N/A';
      const apdValue = results.apd?.[row]?.[col] || 'N/A';
      
      ctx.fillText(`Row: ${row}`, x + cellWidth + 5, y + 15);
      ctx.fillText(`Col: ${col}`, x + cellWidth + 5, y + 30);
      ctx.fillText(`V: ${voltage.toFixed(2)}`, x + cellWidth + 5, y + 45);
    }
  };
  
  // Handle mouse move to track hovered cell
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!results || !results.snapshots || results.snapshots.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate cell coordinates
    const rows = results.snapshots[0].v.length;
    const cols = results.snapshots[0].v[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    // Update hovered cell if within bounds
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      setHoveredCell({ row, col });
      drawOverlay();
      drawCellInfo(row, col);
    } else {
      setHoveredCell(null);
      drawOverlay();
    }
  };
  
  // Handle mouse click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick || !hoveredCell) return;
    
    const { row, col } = hoveredCell;
    console.log(`Cell clicked: (${row}, ${col})`);
    onCellClick(row, col);
    
    // Highlight the clicked cell more prominently
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    
    if (!results || !results.snapshots) return;
    
    const rows = results.snapshots[0].v.length;
    const cols = results.snapshots[0].v[0].length;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    const x = col * cellWidth;
    const y = row * cellHeight;
    
    // Flash effect - bright yellow border
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
    
    // Fade out after a moment
    setTimeout(() => {
      drawOverlay();
      if (hoveredCell) {
        drawCellInfo(hoveredCell.row, hoveredCell.col);
      }
    }, 300);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredCell(null);
    drawOverlay();
  };
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Main canvas for tissue visualization */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0"
      />
      
      {/* Overlay canvas for interactive elements */}
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Time display */}
      {results && results.snapshots && results.snapshots.length > 0 && (
        <div className="absolute top-0 right-0 bg-white bg-opacity-80 px-2 py-1 text-sm">
          Time: {results.snapshots[currentTimeIndex].time.toFixed(1)} ms
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-0 right-0 bg-white bg-opacity-80 p-2 text-xs">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 mr-1" style={{ background: 'linear-gradient(to right, blue, red)' }}></div>
          <span>Voltage (0-1)</span>
        </div>
      </div>
    </div>
  );
};

export default ArrhythmiaVisualization; 