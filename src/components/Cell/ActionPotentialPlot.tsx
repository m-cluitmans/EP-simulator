import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FhnResults } from '../../models/FitzHughNagumoModel';

interface ActionPotentialPlotProps {
  data: FhnResults;
  width?: number;
  height?: number;
  comparisonData?: FhnResults | null;
  showComparison?: boolean;
  highlightPhases?: boolean;
}

// AP phases for educational annotations
interface APPhase {
  name: string;
  startIdx: number;
  endIdx: number;
  color: string;
  description: string;
}

/**
 * Component for plotting action potentials from the FitzHugh-Nagumo model
 */
const ActionPotentialPlot: React.FC<ActionPotentialPlotProps> = ({
  data,
  width = 600,
  height = 400,
  comparisonData = null,
  showComparison = false,
  highlightPhases = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });
  
  // Identify "regions" of the FitzHugh-Nagumo model dynamics
  // Using more appropriate terminology for this simplified model
  const identifyPhases = (data: FhnResults): APPhase[] => {
    const { v } = data;
    const phases: APPhase[] = [];
    
    // Find the resting/initial state
    let excitationStart = 0;
    for (let i = 1; i < v.length; i++) {
      if (v[i] > v[i-1] && v[i] > -0.3) {
        excitationStart = i;
        break;
      }
    }
    
    // Find fast depolarization start (steepest upstroke)
    let fastDepolarizationStart = excitationStart;
    let maxDvDt = 0;
    for (let i = excitationStart; i < v.length - 1; i++) {
      const dvdt = v[i+1] - v[i];
      if (dvdt > maxDvDt) {
        maxDvDt = dvdt;
        fastDepolarizationStart = i;
      }
      if (v[i] > 0.5) break; // Stop once we're well into the upstroke
    }
    
    // Find peak (end of depolarization)
    let peak = fastDepolarizationStart;
    for (let i = fastDepolarizationStart + 1; i < v.length; i++) {
      if (v[i] < v[i-1]) {
        peak = i;
        break;
      }
    }
    
    // Find start of recovery/repolarization
    let repolarizationStart = peak;
    const peakValue = v[peak];
    for (let i = peak + 1; i < v.length; i++) {
      if (v[i] < peakValue * 0.9) {
        repolarizationStart = i;
        break;
      }
    }
    
    // Find return to resting state (zero crossing during repolarization)
    let restingReturn = repolarizationStart;
    for (let i = repolarizationStart + 1; i < v.length; i++) {
      if (v[i] < 0) {
        restingReturn = i;
        break;
      }
    }
    
    // Get final resting phase
    let finalResting = Math.min(v.length - 1, restingReturn + Math.floor((v.length - restingReturn) * 0.3));
    
    // Add phases if we successfully identified them
    if (excitationStart > 0) {
      // Initial resting state
      phases.push({
        name: "Resting State",
        startIdx: 0,
        endIdx: excitationStart,
        color: "rgba(200, 220, 255, 0.3)",
        description: "Initial equilibrium state of the system"
      });
      
      // Excitation phase (similar to depolarization but for FHN)
      phases.push({
        name: "Excitation",
        startIdx: excitationStart,
        endIdx: peak,
        color: "rgba(255, 150, 150, 0.3)",
        description: "Rapid change of state variable (similar to depolarization)"
      });
      
      // Early recovery phase (starts declining from peak)
      phases.push({
        name: "Early Recovery",
        startIdx: peak,
        endIdx: repolarizationStart,
        color: "rgba(255, 200, 150, 0.3)",
        description: "Beginning of recovery process after peak"
      });
      
      // Main recovery phase (major part of repolarization)
      phases.push({
        name: "Recovery",
        startIdx: repolarizationStart,
        endIdx: restingReturn,
        color: "rgba(150, 255, 150, 0.3)",
        description: "Main recovery period (similar to repolarization)"
      });
      
      // Refractory period and return to rest
      phases.push({
        name: "Refractory Period",
        startIdx: restingReturn,
        endIdx: finalResting,
        color: "rgba(220, 220, 255, 0.3)",
        description: "System returning to resting state, less excitable"
      });
    }
    
    return phases;
  };
  
  useEffect(() => {
    if (!svgRef.current || !data || data.time.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Set up margins and dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create the main group for the plot
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.time) || 100])
      .range([0, innerWidth]);
    
    // Find the min and max values for y-axis
    let yMin = d3.min(data.v) || -1;
    let yMax = d3.max(data.v) || 1;
    
    // If comparison data is available, include its values in the domain calculation
    if (showComparison && comparisonData && comparisonData.v.length > 0) {
      yMin = Math.min(yMin, d3.min(comparisonData.v) || -1);
      yMax = Math.max(yMax, d3.max(comparisonData.v) || 1);
    }
    
    // Add some padding to y domain
    yMin = yMin - 0.1 * (yMax - yMin);
    yMax = yMax + 0.1 * (yMax - yMin);
    
    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    // Add axes to the plot
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);
    
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);
    
    // Add axis labels
    g.append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .text("Time");
    
    g.append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .text("Membrane Potential");
    
    // Create line generator
    const line = d3
      .line<number>()
      .x((d: number, i: number) => xScale(data.time[i]))
      .y((d: number) => yScale(d));
    
    // If highlighting phases, identify and draw them
    if (highlightPhases) {
      const phases = identifyPhases(data);
      
      // Draw phase backgrounds
      phases.forEach((phase, index) => {
        const startX = xScale(data.time[phase.startIdx]);
        const endX = xScale(data.time[phase.endIdx]);
        
        // Draw phase background
        g.append("rect")
          .attr("x", startX)
          .attr("y", 0)
          .attr("width", endX - startX)
          .attr("height", innerHeight)
          .attr("fill", phase.color)
          .attr("class", "phase-highlight")
          .on("mouseover", function(event: MouseEvent) {
            setTooltip({
              visible: true,
              x: event.pageX,
              y: event.pageY,
              content: `${phase.name}: ${phase.description}`
            });
          })
          .on("mouseout", function() {
            setTooltip({ ...tooltip, visible: false });
          });
        
        // Add phase label - stagger vertically to prevent overlap
        const labelY = innerHeight - 10 - (index % 2) * 15;
        g.append("text")
          .attr("x", startX + (endX - startX) / 2)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#333")
          .text(phase.name);
      });
    }
    
    // Draw the main action potential trace
    g.append("path")
      .datum(data.v)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Draw the recovery variable if available
    g.append("path")
      .datum(data.w)
      .attr("fill", "none")
      .attr("stroke", "lightgrey")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("d", line);
    
    // Draw comparison data if available
    if (showComparison && comparisonData && comparisonData.v.length > 0) {
      const comparisonLine = d3
        .line<number>()
        .x((d: number, i: number) => xScale(comparisonData.time[i]))
        .y((d: number) => yScale(d));
      
      g.append("path")
        .datum(comparisonData.v)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", comparisonLine);
    }
    
    // Add legend
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerWidth - 150}, 10)`);
    
    // Main trace legend item
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);
    
    legend.append("text")
      .attr("x", 25)
      .attr("y", 4)
      .text("Voltage (v)");
    
    // Recovery variable legend item
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", 20)
      .attr("x2", 20)
      .attr("y2", 20)
      .attr("stroke", "lightgrey")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");
    
    legend.append("text")
      .attr("x", 25)
      .attr("y", 24)
      .text("Recovery (w)");
    
    // Comparison trace legend item (if showing comparison)
    if (showComparison && comparisonData) {
      legend.append("line")
        .attr("x1", 0)
        .attr("y1", 40)
        .attr("x2", 20)
        .attr("y2", 40)
        .attr("stroke", "red")
        .attr("stroke-width", 2);
      
      legend.append("text")
        .attr("x", 25)
        .attr("y", 44)
        .text("Comparison");
    }
    
  }, [data, width, height, comparisonData, showComparison, highlightPhases, tooltip]);
  
  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="action-potential-plot">
        {/* D3 will populate this */}
      </svg>
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="absolute z-10 bg-white shadow-lg p-2 rounded text-sm"
          style={{ 
            left: `${tooltip.x + 10}px`, 
            top: `${tooltip.y - 10}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default ActionPotentialPlot; 