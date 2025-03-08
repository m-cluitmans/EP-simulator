import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { TissueSimulationResults } from '../../models/TissueModel';

interface TissueCellActionPotentialProps {
  results: TissueSimulationResults | null;
  selectedCell: { row: number; col: number } | null;
  width?: number;
  height?: number;
}

/**
 * Component for displaying the action potential of a selected cell in the tissue simulation
 */
const TissueCellActionPotential: React.FC<TissueCellActionPotentialProps> = ({
  results,
  selectedCell,
  width = 400,
  height = 250
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    // Clear previous plot
    svg.selectAll('*').remove();
    
    // If no results or no selected cell, don't render anything
    if (!results || !selectedCell) {
      // Display a message when no cell is selected
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text(selectedCell ? 'Loading data...' : 'Click on a cell to view its action potential');
      
      return;
    }
    
    // Add debug info to check if we have valid snapshots
    if (!results.snapshots || results.snapshots.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('fill', 'red')
        .text('No simulation snapshots available');
      
      console.error('No snapshots in results:', results);
      return;
    }
    
    const { row, col } = selectedCell;
    
    // Logging for debugging
    console.log(`Attempting to plot action potential for cell (${row}, ${col})`);
    console.log(`Results have ${results.snapshots.length} snapshots`);
    
    // Make sure the selected cell is within bounds
    if (row < 0 || row >= results.snapshots[0].v.length || 
        col < 0 || col >= results.snapshots[0].v[0].length) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('fill', 'red')
        .text(`Cell coordinates (${row}, ${col}) out of bounds`);
        
      console.error('Cell coordinates out of bounds:', row, col, 'Grid size:', 
                   results.snapshots[0].v.length, results.snapshots[0].v[0].length);
      return;
    }
    
    try {
      // Extract voltage data for the selected cell across all time points
      const timePoints = results.snapshots.map(snapshot => snapshot.time);
      
      // Add validation to ensure the data exists
      const voltageData: number[] = [];
      let missingDataCount = 0;
      
      for (let i = 0; i < results.snapshots.length; i++) {
        const snapshot = results.snapshots[i];
        if (snapshot.v && 
            snapshot.v[row] && 
            typeof snapshot.v[row][col] === 'number') {
          voltageData.push(snapshot.v[row][col]);
        } else {
          missingDataCount++;
          // Use previous value or 0 if no previous value
          voltageData.push(voltageData.length > 0 ? voltageData[voltageData.length - 1] : 0);
        }
      }
      
      if (missingDataCount > 0) {
        console.warn(`Missing data for ${missingDataCount} out of ${results.snapshots.length} time points`);
      }
      
      // Logging for debugging
      console.log(`Successfully extracted voltage data: ${voltageData.length} points`);
      console.log('Time range:', Math.min(...timePoints), 'to', Math.max(...timePoints));
      console.log('Voltage range:', Math.min(...voltageData), 'to', Math.max(...voltageData));
      
      // Combine time and voltage into data points
      const data = timePoints.slice(0, voltageData.length).map((time, i) => ({
        time,
        voltage: voltageData[i]
      }));
      
      // Log for debugging
      console.log('AP Data:', { 
        cell: selectedCell, 
        timePoints: timePoints.slice(0, 5),
        voltageData: voltageData.slice(0, 5),
        dataLength: data.length
      });

      // Create margins
      const margin = { top: 30, right: 20, bottom: 50, left: 50 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      
      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(timePoints) || 100])
        .range([0, innerWidth]);
      
      const yScale = d3.scaleLinear()
        .domain([
          d3.min(voltageData) || -1, 
          d3.max(voltageData) || 1
        ])
        .range([innerHeight, 0])
        .nice();
      
      // Create group for plot contents with margins
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Create axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);
      
      // Add axes to SVG
      g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis);
      
      g.append('g')
        .call(yAxis);
      
      // Add axis labels
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Time');
      
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Voltage');
      
      // Create line generator
      const line = d3.line<{time: number, voltage: number}>()
        .x(d => xScale(d.time))
        .y(d => yScale(d.voltage));
      
      // Add the line path
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);
      
      // Add data points
      g.selectAll('.data-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.time))
        .attr('cy', d => yScale(d.voltage))
        .attr('r', 2)
        .attr('fill', 'steelblue');
      
      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(`Action Potential at Cell (${row}, ${col})`);
    } catch (error) {
      console.error('Error rendering action potential:', error);
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '14px')
        .style('fill', 'red')
        .text('Error rendering action potential');
    }
    
  }, [results, selectedCell, width, height]);

  return (
    <div className="tissue-cell-action-potential bg-white p-2 rounded shadow">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white"
      />
    </div>
  );
};

export default TissueCellActionPotential; 