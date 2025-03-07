import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { MsResults } from '../../models/MitchellSchaefferModel';

interface ActionPotentialPlotProps {
  data: MsResults;
  width?: number;
  height?: number;
  comparisonData?: MsResults | null;
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
 * Component for plotting action potentials from the Mitchell Schaeffer model
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
  
  // Identify phases of the Mitchell Schaeffer model action potential
  const identifyPhases = (data: MsResults): APPhase[] => {
    const { v, h } = data;
    const phases: APPhase[] = [];
    
    // Find resting state - beginning of data
    const restingPhaseEnd = Math.min(20, Math.floor(v.length / 10));
    
    phases.push({
      name: 'Resting',
      startIdx: 0,
      endIdx: restingPhaseEnd,
      color: 'rgba(200, 220, 240, 0.5)',
      description: 'Resting membrane potential - gates are open, cell is at equilibrium'
    });
    
    // Find upstroke/depolarization
    let upstrokeStart = restingPhaseEnd;
    for (let i = restingPhaseEnd + 1; i < v.length; i++) {
      if (v[i] > 0.1) {
        upstrokeStart = i;
        break;
      }
    }
    
    // Find the end of upstroke (peak)
    let upstrokeEnd = upstrokeStart;
    for (let i = upstrokeStart + 1; i < v.length; i++) {
      if (v[i] > 0.9) {
        upstrokeEnd = i;
        break;
      }
    }
    
    phases.push({
      name: 'Upstroke',
      startIdx: upstrokeStart,
      endIdx: upstrokeEnd,
      color: 'rgba(255, 200, 200, 0.5)',
      description: 'Rapid depolarization - voltage increases quickly'
    });
    
    // Find the plateau/early repolarization
    let plateauEnd = upstrokeEnd;
    for (let i = upstrokeEnd + 1; i < v.length; i++) {
      if (v[i] < 0.8) {
        plateauEnd = i;
        break;
      }
    }
    
    phases.push({
      name: 'Plateau',
      startIdx: upstrokeEnd,
      endIdx: plateauEnd,
      color: 'rgba(255, 240, 200, 0.5)',
      description: 'Plateau phase - voltage remains elevated'
    });
    
    // Find repolarization phase
    let repolarizationEnd = plateauEnd;
    for (let i = plateauEnd + 1; i < v.length; i++) {
      if (v[i] < 0.1) {
        repolarizationEnd = i;
        break;
      }
    }
    
    phases.push({
      name: 'Repolarization',
      startIdx: plateauEnd,
      endIdx: repolarizationEnd,
      color: 'rgba(200, 255, 200, 0.5)',
      description: 'Repolarization - voltage returns to resting level'
    });
    
    // Recovery phase (after repolarization)
    let recoveryEnd = Math.min(repolarizationEnd + 200, v.length - 1);
    
    phases.push({
      name: 'Recovery',
      startIdx: repolarizationEnd,
      endIdx: recoveryEnd,
      color: 'rgba(220, 220, 255, 0.5)',
      description: 'Recovery period - gates are recovering but cell remains unexcitable'
    });
    
    return phases;
  };
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Parse data
    const { time, v, h } = data;
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(time) || 0])
      .range([0, innerWidth]);
    
    const yVoltageScale = d3.scaleLinear()
      .domain([-0.1, 1.1])  // Mitchell Schaeffer model voltage typically in [0,1]
      .range([innerHeight, 0]);
    
    const yGateScale = d3.scaleLinear()
      .domain([0, 1])  // Mitchell Schaeffer gate variable always in [0,1]
      .range([innerHeight, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yVoltageAxis = d3.axisLeft(yVoltageScale);
    const yGateAxis = d3.axisRight(yGateScale);
    
    // Create container
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Mark phases if enabled
    if (highlightPhases) {
      const phases = identifyPhases(data);
      
      // Add phase bands
      phases.forEach(phase => {
        if (phase.startIdx >= 0 && phase.endIdx >= phase.startIdx) {
          g.append('rect')
            .attr('x', xScale(time[phase.startIdx]))
            .attr('y', 0)
            .attr('width', xScale(time[phase.endIdx]) - xScale(time[phase.startIdx]))
            .attr('height', innerHeight)
            .attr('fill', phase.color)
            .on('mouseover', () => {
              setTooltip({
                visible: true,
                x: xScale(time[Math.floor((phase.startIdx + phase.endIdx) / 2)]) + margin.left,
                y: innerHeight / 2 + margin.top,
                content: `${phase.name}: ${phase.description}`
              });
            })
            .on('mouseout', () => {
              setTooltip({ ...tooltip, visible: false });
            });
          
          // Add phase label
          g.append('text')
            .attr('x', xScale(time[Math.floor((phase.startIdx + phase.endIdx) / 2)]))
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text(phase.name);
        }
      });
    }
    
    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('Time');
    
    // Add Y axis for voltage
    g.append('g')
      .call(yVoltageAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('fill', 'steelblue')
      .attr('text-anchor', 'middle')
      .text('Voltage');
    
    // Add Y axis for gate
    g.append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(yGateAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', 40)
      .attr('fill', 'orange')
      .attr('text-anchor', 'middle')
      .text('Gate variable');
    
    // Create voltage line
    const voltageLine = d3.line<number>()
      .x((_, i) => xScale(time[i]))
      .y(d => yVoltageScale(d));
    
    // Create gate line
    const gateLine = d3.line<number>()
      .x((_, i) => xScale(time[i]))
      .y(d => yGateScale(d));
    
    // Add voltage path
    g.append('path')
      .datum(v)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', voltageLine);
    
    // Add gate path
    g.append('path')
      .datum(h)
      .attr('fill', 'none')
      .attr('stroke', 'orange')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('d', gateLine);
    
    // Plot comparison data if available
    if (showComparison && comparisonData) {
      const comparisonVoltageLine = d3.line<number>()
        .x((_, i) => xScale(comparisonData.time[i]))
        .y(d => yVoltageScale(d));
      
      g.append('path')
        .datum(comparisonData.v)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('d', comparisonVoltageLine);
    }
    
    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 150}, 10)`);
    
    // Voltage legend
    legend.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 20).attr('y2', 0)
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2);
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .style('font-size', '12px')
      .text('Voltage');
    
    // Gate legend
    legend.append('line')
      .attr('x1', 0).attr('y1', 20)
      .attr('x2', 20).attr('y2', 20)
      .attr('stroke', 'orange')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 24)
      .style('font-size', '12px')
      .text('Gate variable (h)');
    
    // Comparison legend if applicable
    if (showComparison && comparisonData) {
      legend.append('line')
        .attr('x1', 0).attr('y1', 40)
        .attr('x2', 20).attr('y2', 40)
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');
      
      legend.append('text')
        .attr('x', 25)
        .attr('y', 44)
        .style('font-size', '12px')
        .text('Comparison');
    }
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Mitchell Schaeffer Action Potential');
    
  }, [data, width, height, comparisonData, showComparison, highlightPhases, tooltip]);
  
  return (
    <div className="action-potential-plot relative">
      <svg ref={svgRef} width={width} height={height} />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="absolute bg-white p-2 shadow-lg rounded border border-gray-300 z-10 max-w-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <p className="text-sm">{tooltip.content}</p>
          <div className="absolute w-2 h-2 bg-white border-b border-r border-gray-300 transform rotate-45" 
            style={{ bottom: '-5px', left: '50%', marginLeft: '-5px' }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ActionPotentialPlot; 