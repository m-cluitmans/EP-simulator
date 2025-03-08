import React, { useRef, useEffect, useState } from 'react';
import { ArrhythmiaScenario } from './ArrhythmiaTypes';
import { TissueData } from '../../models/TissueModel';
import { createVoltageColorScale } from '../../utils/colorScales';

interface ReentrySimulationProps {
  scenario: ArrhythmiaScenario;
  isRunning: boolean;
  width?: number;
  height?: number;
}

/**
 * Component for visualizing arrhythmia scenarios
 */
const ReentrySimulation: React.FC<ReentrySimulationProps> = ({
  scenario,
  isRunning,
  width = 600,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [frame, setFrame] = useState<number>(0);
  
  // Simulation data - in a real implementation this would come from the model
  const simulationData = useRef<TissueData[]>([]);
  const colorScale = createVoltageColorScale(0, 1);
  
  // Load specific scenario data
  useEffect(() => {
    // This is a placeholder - in a real implementation you would load 
    // pre-computed simulations or generate them on the fly
    
    // Reset animation state
    setFrame(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Placeholder for real data
    simulationData.current = [];
  }, [scenario]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Prepare canvas for rendering
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match container
    canvas.width = width;
    canvas.height = height;
    
    if (isRunning) {
      const animate = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw placeholder visualization
        drawPlaceholderData(ctx, scenario, frame);
        
        // Update frame
        setFrame(prevFrame => (prevFrame + 1) % 120);
        
        // Schedule next frame
        animationRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // When not running, draw a static frame
      drawPlaceholderData(ctx, scenario, frame);
    }
    
    // Cleanup animation on unmount or when running state changes
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRunning, scenario, width, height, frame]);
  
  // Draw placeholder visualization based on the scenario
  const drawPlaceholderData = (
    ctx: CanvasRenderingContext2D, 
    scenario: ArrhythmiaScenario, 
    frameNum: number
  ) => {
    // Parameters for the visualization
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Different visualizations based on the scenario
    switch (scenario) {
      case ArrhythmiaScenario.ANATOMICAL_REENTRY:
        drawAnatomicalReentry(ctx, centerX, centerY, radius, frameNum);
        break;
        
      case ArrhythmiaScenario.FUNCTIONAL_REENTRY:
        drawFunctionalReentry(ctx, centerX, centerY, radius, frameNum);
        break;
        
      case ArrhythmiaScenario.TRIGGER_INITIATION:
        drawTriggerInitiation(ctx, centerX, centerY, radius, frameNum);
        break;
        
      case ArrhythmiaScenario.SUBSTRATE_MAINTENANCE:
        drawSubstrateMaintenance(ctx, centerX, centerY, radius, frameNum);
        break;
        
      case ArrhythmiaScenario.SOURCE_SINK_MISMATCH:
        drawSourceSinkMismatch(ctx, centerX, centerY, radius, frameNum);
        break;
        
      case ArrhythmiaScenario.WAVEFRONT_LENGTH:
        drawWavefrontLength(ctx, centerX, centerY, radius, frameNum);
        break;
    }
  };
  
  // Draw anatomical reentry - wave rotating around a fixed obstacle
  const drawAnatomicalReentry = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Draw the obstacle
    const obstacleRadius = radius * 0.3;
    ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, obstacleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw the tissue grid
    const cellSize = 10;
    const gridRadius = radius;
    
    // Calculate the rotational position based on frame
    const rotationAngle = (frameNum * 3) * (Math.PI / 180);
    
    // Draw each cell in the grid
    for (let i = -gridRadius; i <= gridRadius; i += cellSize) {
      for (let j = -gridRadius; j <= gridRadius; j += cellSize) {
        const x = centerX + i;
        const y = centerY + j;
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(i * i + j * j);
        
        // Skip cells inside the obstacle
        if (distanceFromCenter < obstacleRadius) continue;
        
        // Skip cells outside the tissue
        if (distanceFromCenter > gridRadius) continue;
        
        // Calculate angle of this cell from center
        let angle = Math.atan2(j, i);
        if (angle < 0) angle += 2 * Math.PI;
        
        // Calculate wave value based on rotational position
        const waveAngle = (angle - rotationAngle) % (2 * Math.PI);
        const normalizedWaveValue = (1 + Math.cos(waveAngle)) / 2;
        
        // Draw the cell
        ctx.fillStyle = colorScale(normalizedWaveValue);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      }
    }
    
    // Add educational annotations
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText("Anatomical Reentry: Wave rotates around a fixed obstacle", centerX, height - 20);
  };
  
  // Draw functional reentry - spiral wave/rotor without fixed obstacle
  const drawFunctionalReentry = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Draw the tissue grid
    const cellSize = 10;
    const gridRadius = radius;
    
    // Calculate spiral wave parameters
    const rotationAngle = (frameNum * 3) * (Math.PI / 180);
    const spiralTightness = 0.1;
    
    // Draw each cell in the grid
    for (let i = -gridRadius; i <= gridRadius; i += cellSize) {
      for (let j = -gridRadius; j <= gridRadius; j += cellSize) {
        const x = centerX + i;
        const y = centerY + j;
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(i * i + j * j);
        
        // Skip cells outside the tissue
        if (distanceFromCenter > gridRadius) continue;
        
        // Calculate angle of this cell from center
        let angle = Math.atan2(j, i);
        if (angle < 0) angle += 2 * Math.PI;
        
        // Calculate spiral wave value
        const spiralPhase = angle - spiralTightness * distanceFromCenter + rotationAngle;
        const normalizedWaveValue = (1 + Math.cos(spiralPhase)) / 2;
        
        // Draw the cell
        ctx.fillStyle = colorScale(normalizedWaveValue);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      }
    }
    
    // Add annotation for phase singularity
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add lines pointing to important features
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + 80, centerY - 60);
    ctx.stroke();
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText("Phase Singularity", centerX + 85, centerY - 60);
    
    // Title
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Functional Reentry: Spiral wave rotates around phase singularity", centerX, height - 20);
  };
  
  // Draw trigger initiation - premature beats initiating arrhythmia
  const drawTriggerInitiation = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Draw the tissue
    const cellSize = 10;
    const gridWidth = Math.floor(width / cellSize);
    const gridHeight = Math.floor(height / cellSize);
    
    // Determine the phase of the animation
    const phase = Math.floor(frameNum / 20) % 6;
    
    // Draw a strip of tissue (like a 1D cable)
    const cableHeight = 5;
    const cableY = centerY;
    
    // Background
    ctx.fillStyle = 'rgba(240, 240, 240, 0.5)';
    ctx.fillRect(0, cableY - cableHeight * cellSize / 2, width, cableHeight * cellSize);
    
    // Draw normal propagation for phases 0-1
    if (phase < 2) {
      const wavePositions = phase === 0 ? [0.2] : [0.4];
      
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < cableHeight; y++) {
          const pixelX = x * cellSize;
          const pixelY = cableY - (cableHeight * cellSize / 2) + y * cellSize;
          
          // Calculate value for propagating wave
          let value = 0;
          for (const pos of wavePositions) {
            const normalizedX = x / gridWidth;
            const distance = Math.abs(normalizedX - pos);
            if (distance < 0.1) {
              value = 1 - distance / 0.1;
            }
          }
          
          ctx.fillStyle = colorScale(value);
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
        }
      }
    }
    
    // Draw premature stimulus for phase 2
    if (phase === 2) {
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < cableHeight; y++) {
          const pixelX = x * cellSize;
          const pixelY = cableY - (cableHeight * cellSize / 2) + y * cellSize;
          
          // Normal wave
          let value = 0;
          const normalizedX = x / gridWidth;
          
          // First wave
          const distance1 = Math.abs(normalizedX - 0.6);
          if (distance1 < 0.1) {
            value = 1 - distance1 / 0.1;
          }
          
          // Premature beat (S2)
          const distance2 = Math.abs(normalizedX - 0.3);
          if (distance2 < 0.05) {
            value = 1 - distance2 / 0.05;
          }
          
          ctx.fillStyle = colorScale(value);
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
        }
      }
    }
    
    // Show unidirectional block in phase 3
    if (phase === 3) {
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < cableHeight; y++) {
          const pixelX = x * cellSize;
          const pixelY = cableY - (cableHeight * cellSize / 2) + y * cellSize;
          
          let value = 0;
          const normalizedX = x / gridWidth;
          
          // Forward propagation only
          const distance = Math.abs(normalizedX - 0.25);
          if (distance < 0.05 && normalizedX < 0.3) {
            value = 1 - distance / 0.05;
          }
          
          // First wave continuing
          const distance1 = Math.abs(normalizedX - 0.7);
          if (distance1 < 0.1) {
            value = 1 - distance1 / 0.1;
          }
          
          ctx.fillStyle = colorScale(value);
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
        }
      }
      
      // Add annotation for unidirectional block
      ctx.beginPath();
      ctx.moveTo(width * 0.3, cableY);
      ctx.lineTo(width * 0.3, cableY - 50);
      ctx.stroke();
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText("Unidirectional Block", width * 0.3, cableY - 60);
    }
    
    // Show retrograde propagation in phase 4
    if (phase === 4) {
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < cableHeight; y++) {
          const pixelX = x * cellSize;
          const pixelY = cableY - (cableHeight * cellSize / 2) + y * cellSize;
          
          let value = 0;
          const normalizedX = x / gridWidth;
          
          // Retrograde wave
          const distance = Math.abs(normalizedX - 0.2);
          if (distance < 0.05) {
            value = 1 - distance / 0.05;
          }
          
          // First wave continuing
          const distance1 = Math.abs(normalizedX - 0.8);
          if (distance1 < 0.1) {
            value = 1 - distance1 / 0.1;
          }
          
          ctx.fillStyle = colorScale(value);
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
        }
      }
      
      // Add annotation for retrograde propagation
      ctx.beginPath();
      ctx.moveTo(width * 0.2, cableY);
      ctx.lineTo(width * 0.2, cableY - 50);
      ctx.stroke();
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText("Retrograde Propagation", width * 0.2, cableY - 60);
    }
    
    // Show reentry in phase 5
    if (phase === 5) {
      // Draw circular path with arrow showing reentry circuit
      ctx.beginPath();
      ctx.arc(centerX, cableY + 100, 80, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw arrow
      const arrowAngle = (frameNum * 5) % 360 * (Math.PI / 180);
      const arrowX = centerX + 80 * Math.cos(arrowAngle);
      const arrowY = cableY + 100 + 80 * Math.sin(arrowAngle);
      
      ctx.beginPath();
      ctx.arc(arrowX, arrowY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      
      // Label
      ctx.font = '14px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.fillText("Reentry Circuit Formed", centerX, cableY + 180);
    }
    
    // Add educational label
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText("Trigger: Premature beat initiating reentry", centerX, height - 20);
    
    // Phase indicators
    const phaseLabels = [
      "Normal Propagation",
      "Normal Wave Continues",
      "Premature Beat (S2)",
      "Unidirectional Block",
      "Retrograde Propagation",
      "Reentry Circuit"
    ];
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText(`Phase ${phase + 1}/6: ${phaseLabels[phase]}`, 10, 20);
  };
  
  // Draw substrate maintenance - tissue properties maintaining arrhythmia
  const drawSubstrateMaintenance = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Draw the tissue with heterogeneous properties
    const cellSize = 10;
    const gridRadius = radius;
    
    // Draw grid background with heterogeneity
    ctx.globalAlpha = 0.2;
    for (let i = -gridRadius; i <= gridRadius; i += cellSize) {
      for (let j = -gridRadius; j <= gridRadius; j += cellSize) {
        const x = centerX + i;
        const y = centerY + j;
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(i * i + j * j);
        
        // Skip cells outside the tissue
        if (distanceFromCenter > gridRadius) continue;
        
        // Create repolarization gradient from left to right
        const normalizedX = (x - (centerX - gridRadius)) / (2 * gridRadius);
        
        // Add random fibrosis
        const random = Math.random();
        if (random < 0.1) {
          ctx.fillStyle = 'gray';
          ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
        } 
        else {
          // Color based on APD (repolarization time)
          const gradient = normalizedX;
          ctx.fillStyle = gradient < 0.5 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
          ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1.0;
    
    // Draw reentry wave
    const rotationAngle = (frameNum * 3) * (Math.PI / 180);
    const spiralTightness = 0.05;
    
    for (let i = -gridRadius; i <= gridRadius; i += cellSize) {
      for (let j = -gridRadius; j <= gridRadius; j += cellSize) {
        const x = centerX + i;
        const y = centerY + j;
        
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(i * i + j * j);
        
        // Skip cells outside the tissue
        if (distanceFromCenter > gridRadius) continue;
        
        // Calculate angle of this cell from center
        let angle = Math.atan2(j, i);
        if (angle < 0) angle += 2 * Math.PI;
        
        // Calculate wave value for this cell
        const spiralPhase = angle - spiralTightness * distanceFromCenter + rotationAngle;
        let waveValue = (1 + Math.cos(spiralPhase)) / 2;
        
        // Create a "wavebreak" in the middle-right side by modifying wave properties
        const breakX = (x - centerX) / gridRadius;
        const breakY = (y - centerY) / gridRadius;
        if (breakX > 0.3 && breakX < 0.8 && Math.abs(breakY) < 0.3) {
          // Slow conduction in this region
          waveValue = waveValue * 0.7;
        }
        
        // Skip if this is a fibrosis location (random but fixed per location)
        const randomSeed = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        if (randomSeed > 0.7) continue;
        
        // Draw the cell with wave
        ctx.fillStyle = colorScale(waveValue);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      }
    }
    
    // Add annotations
    // Gradient arrow
    ctx.beginPath();
    ctx.moveTo(centerX - gridRadius + 20, centerY + gridRadius - 30);
    ctx.lineTo(centerX + gridRadius - 20, centerY + gridRadius - 30);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(centerX + gridRadius - 20, centerY + gridRadius - 30);
    ctx.lineTo(centerX + gridRadius - 30, centerY + gridRadius - 35);
    ctx.lineTo(centerX + gridRadius - 30, centerY + gridRadius - 25);
    ctx.fill();
    
    // Text
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText("APD Gradient (short → long)", centerX, centerY + gridRadius - 10);
    
    // Fibrosis annotation
    ctx.beginPath();
    ctx.moveTo(centerX + 50, centerY - 50);
    ctx.lineTo(centerX + 120, centerY - 80);
    ctx.stroke();
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText("Fibrosis", centerX + 125, centerY - 80);
    
    // Title
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Substrate: Tissue heterogeneity maintains reentry", centerX, height - 20);
  };
  
  // Draw source-sink mismatch
  const drawSourceSinkMismatch = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Parameters
    const cellSize = 10;
    const gridRadius = radius * 0.9;
    
    // Phase of the animation (0-5)
    const phase = Math.floor(frameNum / 30) % 3;
    
    // Draw tissue model with narrow pathway
    const narrowPathwayWidth = Math.floor(radius * 0.3);
    const narrowPathwayY = centerY;
    
    // Background (tissue)
    // Draw two separate regions connected by a narrow pathway
    const regionWidth = gridRadius * 0.7;
    const regionHeight = gridRadius * 1.2;
    
    // Left region (small source)
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.fillRect(centerX - gridRadius - regionWidth / 2, centerY - regionHeight / 2, regionWidth, regionHeight);
    
    // Right region (large sink)
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.fillRect(centerX + gridRadius - regionWidth / 2, centerY - regionHeight * 1.2 / 2, regionWidth, regionHeight * 1.2);
    
    // Narrow pathway connecting them
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    ctx.fillRect(centerX - gridRadius + regionWidth / 2, narrowPathwayY - narrowPathwayWidth / 2, 
                 gridRadius * 2 - regionWidth, narrowPathwayWidth);
    
    // Draw conduction in different phases
    const normalizedFrame = frameNum % 120;
    
    // Draw cells
    for (let i = -gridRadius * 2; i <= gridRadius * 2; i += cellSize) {
      for (let j = -gridRadius * 1.5; j <= gridRadius * 1.5; j += cellSize) {
        const x = centerX + i;
        const y = centerY + j;
        
        // Skip if outside the regions or pathway
        const inLeftRegion = 
          x >= centerX - gridRadius - regionWidth / 2 && 
          x <= centerX - gridRadius + regionWidth / 2 &&
          y >= centerY - regionHeight / 2 && 
          y <= centerY + regionHeight / 2;
          
        const inRightRegion = 
          x >= centerX + gridRadius - regionWidth / 2 && 
          x <= centerX + gridRadius + regionWidth / 2 &&
          y >= centerY - regionHeight * 1.2 / 2 && 
          y <= centerY + regionHeight * 1.2 / 2;
          
        const inPathway = 
          x >= centerX - gridRadius + regionWidth / 2 && 
          x <= centerX + gridRadius - regionWidth / 2 &&
          y >= narrowPathwayY - narrowPathwayWidth / 2 && 
          y <= narrowPathwayY + narrowPathwayWidth / 2;
          
        if (!inLeftRegion && !inRightRegion && !inPathway) {
          continue;
        }
        
        // Calculate wave value based on position and phase
        let value = 0;
        
        if (phase === 0) { // Successful propagation (small source - narrow pathway - small sink)
          // Wave starting in left region
          if (normalizedFrame < 30) {
            // Wave in left region only
            if (inLeftRegion) {
              const distFromLeftCenter = Math.sqrt(
                Math.pow(x - (centerX - gridRadius), 2) + 
                Math.pow(y - centerY, 2)
              );
              value = Math.max(0, 1 - distFromLeftCenter / (regionWidth * 0.6) - normalizedFrame * 0.01);
            }
          } else if (normalizedFrame < 60) {
            // Wave propagating through pathway
            if (inPathway) {
              const normalizedX = (x - (centerX - gridRadius)) / (gridRadius * 2);
              const peakX = (normalizedFrame - 30) / 40;
              const distance = Math.abs(normalizedX - peakX);
              value = Math.max(0, 1 - distance * 3);
            }
          } else if (normalizedFrame < 120) {
            // Wave expanding in right region
            if (inRightRegion) {
              const normalizedTime = (normalizedFrame - 60) / 60;
              const distFromRightCenter = Math.sqrt(
                Math.pow(x - (centerX + gridRadius), 2) + 
                Math.pow(y - centerY, 2)
              );
              value = Math.max(0, 1 - distFromRightCenter / (regionWidth * 0.8) - (1 - normalizedTime) * 0.5);
            }
          }
        } else if (phase === 1) { // Source-sink match (narrow pathway - larger sink)
          // Similar but with a wider right region
          if (normalizedFrame < 30) {
            if (inLeftRegion) {
              const distFromLeftCenter = Math.sqrt(
                Math.pow(x - (centerX - gridRadius), 2) + 
                Math.pow(y - centerY, 2)
              );
              value = Math.max(0, 1 - distFromLeftCenter / (regionWidth * 0.6) - normalizedFrame * 0.01);
            }
          } else if (normalizedFrame < 60) {
            if (inPathway) {
              const normalizedX = (x - (centerX - gridRadius)) / (gridRadius * 2);
              const peakX = (normalizedFrame - 30) / 40;
              const distance = Math.abs(normalizedX - peakX);
              value = Math.max(0, 1 - distance * 3);
            }
          } else if (normalizedFrame < 120) {
            if (inRightRegion) {
              const normalizedTime = (normalizedFrame - 60) / 60;
              const distFromRightCenter = Math.sqrt(
                Math.pow(x - (centerX + gridRadius), 2) + 
                Math.pow(y - centerY, 2)
              );
              const delay = distFromRightCenter / 80; // Slower conduction in larger sink
              value = Math.max(0, 1 - distFromRightCenter / (regionWidth) - (1 - normalizedTime + delay) * 0.5);
            }
          }
        } else if (phase === 2) { // Failed propagation (source-sink mismatch)
          // Wave fails to propagate past the junction
          if (normalizedFrame < 40) {
            if (inLeftRegion) {
              const distFromLeftCenter = Math.sqrt(
                Math.pow(x - (centerX - gridRadius), 2) + 
                Math.pow(y - centerY, 2)
              );
              value = Math.max(0, 1 - distFromLeftCenter / (regionWidth * 0.6) - normalizedFrame * 0.01);
            }
          } else if (normalizedFrame < 70) {
            if (inPathway) {
              const normalizedX = (x - (centerX - gridRadius)) / (gridRadius * 2);
              if (normalizedX < 0.3) { // Only propagates partway through pathway
                const peakX = Math.min(0.3, (normalizedFrame - 40) / 70);
                const distance = Math.abs(normalizedX - peakX);
                value = Math.max(0, 1 - distance * 5);
              }
            }
          }
          // No propagation to the right region
        }
        
        // Draw the cell
        ctx.fillStyle = colorScale(value);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      }
    }
    
    // Add informative text
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    
    // Title and phase indicator
    const phaseTexts = [
      "Successful Propagation: Small Sink",
      "Successful Propagation: Matched Source-Sink",
      "Failed Propagation: Source-Sink Mismatch"
    ];
    
    ctx.fillText(`Source-Sink Mismatch: ${phaseTexts[phase]}`, centerX, height - 20);
    
    // Add labels for source and sink
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    
    // Source
    ctx.fillText("Source", centerX - gridRadius, centerY - regionHeight / 2 - 10);
    
    // Sink
    ctx.fillText("Sink", centerX + gridRadius, centerY - regionHeight * 1.2 / 2 - 10);
    
    // Pathway
    ctx.fillText("Narrow Pathway", centerX, narrowPathwayY - narrowPathwayWidth / 2 - 10);
    
    // Add explanation based on phase
    ctx.font = '11px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    
    let explanation = "";
    if (phase === 0) {
      explanation = "Small sink: Current from source is sufficient to depolarize the sink";
    } else if (phase === 1) {
      explanation = "Matched: Current spreads but can still depolarize the larger sink";
    } else {
      explanation = "Mismatch: Source current insufficient to depolarize the large sink";
    }
    
    const textYPosition = height - 40;
    ctx.fillText(explanation, 10, textYPosition);
  };
  
  // Draw wavefront length concept
  const drawWavefrontLength = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    frameNum: number
  ) => {
    // Show circular tissue with different wavelength scenarios
    const cellSize = 10;
    const circleRadius = radius * 0.8;
    
    // Determine which phase of the animation we're in
    const phase = Math.floor(frameNum / 60) % 3;
    
    // Clear the canvas
    ctx.fillStyle = 'rgba(240, 240, 240, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw a circular boundary
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Animation parameters depend on the phase
    let conduction = 0;
    let refractoryPeriod = 0;
    let wavelength = 0;
    
    switch (phase) {
      case 0: // Normal wavelength - no reentry
        conduction = 3;
        refractoryPeriod = 120;
        break;
      case 1: // Short wavelength - reentry possible
        conduction = 2;
        refractoryPeriod = 60;
        break;
      case 2: // Very short wavelength - sustained reentry
        conduction = 2;
        refractoryPeriod = 40;
        break;
    }
    
    // Calculate wavelength = conduction velocity × refractory period
    wavelength = conduction * refractoryPeriod;
    
    // Draw cells in the circle with wavefront and tail
    const normalizedFrame = frameNum % 180;
    
    // Initialize an array to represent the state of the circle
    // 0 = resting, 1 = active/wavefront, 2 = refractory/tail
    const angleStep = 3;
    const states: number[] = Array(Math.floor(360 / angleStep)).fill(0);
    
    // Implement a propagating wavefront based on the phase
    if (phase === 0) { // Normal conduction, stimulus moves around once
      // Wave covers 60 degrees
      const wavefrontStart = (normalizedFrame * conduction) % 360;
      const refractoryStart = Math.max(0, wavefrontStart - 60);
      
      // Mark active region
      for (let i = 0; i < states.length; i++) {
        const angle = i * angleStep;
        
        if (angle >= wavefrontStart && angle < wavefrontStart + 60) {
          states[i] = 1; // Active
        } else if (angle >= refractoryStart && angle < wavefrontStart) {
          states[i] = 2; // Refractory
        }
      }
    } else if (phase === 1) { // Short wavelength - potential reentry
      // Wave covers 60 degrees
      const wavefrontStart = (normalizedFrame * conduction) % 360;
      const refractoryStart = Math.max(0, wavefrontStart - 60);
      
      // For phase 1, allow a second wavefront after some time
      const secondWavefrontStart = (normalizedFrame > 120) ? (normalizedFrame - 120) * conduction : -1;
      const secondRefractoryStart = Math.max(0, secondWavefrontStart - 60);
      
      // Mark active region
      for (let i = 0; i < states.length; i++) {
        const angle = i * angleStep;
        
        if (angle >= wavefrontStart && angle < wavefrontStart + 60) {
          states[i] = 1; // Active
        } else if (angle >= refractoryStart && angle < wavefrontStart) {
          states[i] = 2; // Refractory
        }
        
        // Second wavefront if it exists
        if (secondWavefrontStart >= 0) {
          if (angle >= secondWavefrontStart && angle < secondWavefrontStart + 60) {
            states[i] = 1; // Active
          } else if (angle >= secondRefractoryStart && angle < secondWavefrontStart) {
            states[i] = 2; // Refractory
          }
        }
      }
    } else if (phase === 2) { // Very short wavelength - sustained reentry
      // Multiple wavelets
      for (let offset = 0; offset < 360; offset += 120) {
        const wavefrontStart = (normalizedFrame * conduction + offset) % 360;
        const refractoryStart = Math.max(0, wavefrontStart - 40);
        
        for (let i = 0; i < states.length; i++) {
          const angle = i * angleStep;
          
          if (angle >= wavefrontStart && angle < wavefrontStart + 40) {
            states[i] = 1; // Active
          } else if (angle >= refractoryStart && angle < wavefrontStart) {
            if (states[i] !== 1) states[i] = 2; // Refractory if not already active
          }
        }
      }
    }
    
    // Draw the states
    for (let i = 0; i < states.length; i++) {
      const angle = i * angleStep * (Math.PI / 180);
      
      // Draw cells from center to perimeter
      for (let r = 20; r <= circleRadius; r += cellSize) {
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        if (states[i] === 1) {
          // Active wavefront - red
          ctx.fillStyle = 'rgb(255, 50, 50)';
        } else if (states[i] === 2) {
          // Refractory tail - blue
          ctx.fillStyle = 'rgb(50, 50, 255)';
        } else {
          // Resting - gray
          ctx.fillStyle = 'rgb(200, 200, 200)';
        }
        
        ctx.beginPath();
        ctx.arc(x, y, cellSize/2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    // Draw measurement indicators showing wavelength, ERP and conduction velocity
    // Circuit length indicator
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius + 20, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    
    // Circuit length
    ctx.fillText(`Circuit Length = ${Math.round(2 * Math.PI * (circleRadius + 20))}`, centerX, centerY - circleRadius - 35);
    
    // Wavelength 
    ctx.fillText(`Wavelength = CV × ERP = ${wavelength}`, centerX, centerY - circleRadius - 20);
    
    // CV and ERP
    ctx.textAlign = 'left';
    ctx.fillText(`CV = ${conduction} units/frame`, 10, height - 35);
    ctx.fillText(`ERP = ${refractoryPeriod} frames`, 10, height - 20);
    
    // Title and phase label
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    
    const titles = [
      "Long Wavelength: No Reentry Possible",
      "Medium Wavelength: Reentry Possible",
      "Short Wavelength: Multiple Reentry Circuits"
    ];
    
    ctx.fillText(`Wavefront Length Concept: ${titles[phase]}`, centerX, height - 20);
  };
  
  return (
    <div className="reentry-simulation relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded"
      />
      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white bg-opacity-80 p-3 rounded text-gray-700">
            Click "Run Simulation" to animate
          </div>
        </div>
      )}
    </div>
  );
};

export default ReentrySimulation; 