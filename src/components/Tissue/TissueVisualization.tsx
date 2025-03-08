import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  useWebGL?: boolean;
}

// Define shaders for WebGL rendering
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

// Interface for WebGL context and resources
interface WebGLContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texCoordBuffer: WebGLBuffer;
  texture: WebGLTexture;
  positionLocation: number;
  texCoordLocation: number;
}

const TissueVisualization: React.FC<TissueVisualizationProps> = ({
  visualizationMode,
  currentData,
  results,
  cellSize,
  colorScales,
  onCellClick,
  selectedCell,
  useWebGL = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const legendCanvasRef = useRef<HTMLCanvasElement>(null);
  const webglContextRef = useRef<WebGLContext | null>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);
  const [viewTransform, setViewTransform] = useState({ 
    scale: 1.0, 
    offsetX: 0, 
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  });
  
  // Handle mouse wheel for zoom - without preventDefault in the callback
  const handleWheel = useCallback((event: WheelEvent) => {
    // Don't call preventDefault here, as it's called in the non-passive listener
    
    const delta = event.deltaY;
    const scaleFactor = delta > 0 ? 0.9 : 1.1; // Zoom in or out
    
    setViewTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(10, prev.scale * scaleFactor))
    }));
  }, []);
  
  // Handle mouse down for pan
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    setViewTransform(prev => ({
      ...prev,
      isDragging: true,
      lastX: event.clientX,
      lastY: event.clientY
    }));
  }, []);
  
  // Handle mouse move for pan
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!viewTransform.isDragging) return;
    
    const dx = event.clientX - viewTransform.lastX;
    const dy = event.clientY - viewTransform.lastY;
    
    setViewTransform(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
      lastX: event.clientX,
      lastY: event.clientY
    }));
  }, [viewTransform.isDragging, viewTransform.lastX, viewTransform.lastY]);
  
  // Handle mouse up to end pan
  const handleMouseUp = useCallback(() => {
    setViewTransform(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
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
  
  // Convert color string to RGB values
  const parseColor = (color: string): [number, number, number] => {
    // Handle rgb/rgba format
    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1]) / 255,
        parseInt(rgbMatch[2]) / 255,
        parseInt(rgbMatch[3]) / 255
      ];
    }
    
    // Handle hex format
    const hexMatch = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (hexMatch) {
      return [
        parseInt(hexMatch[1], 16) / 255,
        parseInt(hexMatch[2], 16) / 255,
        parseInt(hexMatch[3], 16) / 255
      ];
    }
    
    // Default to gray
    return [0.8, 0.8, 0.8];
  };
  
  // Initialize WebGL context
  const initWebGL = useCallback((canvas: HTMLCanvasElement): WebGLContext | null => {
    try {
      // Get WebGL context
      const gl = canvas.getContext('webgl');
      if (!gl) {
        console.warn('WebGL not supported, falling back to Canvas 2D');
        setIsWebGLSupported(false);
        return null;
      }
      
      // Create shader program
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) throw new Error('Failed to create vertex shader');
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) throw new Error('Failed to create fragment shader');
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      
      const program = gl.createProgram();
      if (!program) throw new Error('Failed to create shader program');
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      // Check if shaders compiled and linked successfully
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(`Vertex shader compilation failed: ${gl.getShaderInfoLog(vertexShader)}`);
      }
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(`Fragment shader compilation failed: ${gl.getShaderInfoLog(fragmentShader)}`);
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program linking failed: ${gl.getProgramInfoLog(program)}`);
      }
      
      // Get attribute locations
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
      
      // Create buffers
      const positionBuffer = gl.createBuffer();
      if (!positionBuffer) throw new Error('Failed to create position buffer');
      
      const texCoordBuffer = gl.createBuffer();
      if (!texCoordBuffer) throw new Error('Failed to create texture coordinate buffer');
      
      // Create texture
      const texture = gl.createTexture();
      if (!texture) throw new Error('Failed to create texture');
      
      return {
        gl,
        program,
        positionBuffer,
        texCoordBuffer,
        texture,
        positionLocation,
        texCoordLocation
      };
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      setIsWebGLSupported(false);
      return null;
    }
  }, []);
  
  // Render tissue data using WebGL
  const renderWebGL = useCallback((
    context: WebGLContext,
    data: number[][],
    width: number,
    height: number,
    colorScale: (value: number) => string
  ) => {
    const { gl, program, positionBuffer, texCoordBuffer, texture, positionLocation, texCoordLocation } = context;
    
    // Set up viewport
    gl.viewport(0, 0, width, height);
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    gl.useProgram(program);
    
    // Set up position buffer for a full-screen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  // bottom left
      1, -1,   // bottom right
      -1, 1,   // top left
      1, 1     // top right
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set up texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,  // bottom left
      1, 1,  // bottom right
      0, 0,  // top left
      1, 0   // top right
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Create a texture from the data
    const rows = data.length;
    const cols = data[0].length;
    const pixels = new Uint8Array(cols * rows * 4);
    
    // Fill the texture with data
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const idx = (i * cols + j) * 4;
        const value = data[i][j];
        
        // Get color for this value
        const rgbColor = parseColor(safeDraw(value, colorScale));
        
        pixels[idx] = Math.round(rgbColor[0] * 255);     // R
        pixels[idx + 1] = Math.round(rgbColor[1] * 255); // G
        pixels[idx + 2] = Math.round(rgbColor[2] * 255); // B
        pixels[idx + 3] = 255;                           // A (fully opaque)
      }
    }
    
    // Upload texture data
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // Draw the quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, []);
  
  // Handle click events on the canvas - with improved coordinate calculation
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the position relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Normalize coordinates to [0,1] range based on canvas display size
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;
    
    // Get grid dimensions
    let rows = 0;
    let cols = 0;
    
    if (currentData && currentData.v) {
      rows = currentData.v.length;
      cols = currentData.v[0].length;
    } else if (results && results.snapshots && results.snapshots.length > 0) {
      rows = results.snapshots[0].v.length;
      cols = results.snapshots[0].v[0].length;
    } else {
      console.error('No data available to determine grid dimensions');
      return;
    }
    
    // Convert normalized coordinates to grid coordinates
    // Apply the inverse of any scaling/transformation
    const transformedX = normalizedX;
    const transformedY = normalizedY;
    
    // Convert to cell coordinates (integer positions)
    const col = Math.floor(transformedX * cols);
    const row = Math.floor(transformedY * rows);
    
    // Log click information for debugging
    console.log('Canvas click at:', { 
      canvasX: x, canvasY: y, 
      normalized: { x: normalizedX, y: normalizedY },
      grid: { rows, cols }, 
      cell: { row, col } 
    });
    
    // Add validation to ensure we're within the grid
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      console.warn('Click outside grid bounds:', { row, col, gridRows: rows, gridCols: cols });
      return;
    }
    
    // Call the callback with the cell coordinates
    onCellClick(row, col);
  };
  
  // Canvas2D rendering as fallback
  const renderCanvas2D = (
    canvas: HTMLCanvasElement,
    data: number[][],
    rows: number,
    cols: number,
    cellSize: number,
    colorScale: (value: number) => string,
    mode: VisualizationMode,
    selectedCell?: { row: number; col: number } | null
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply view transform
    ctx.save();
    ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    
    // Draw each cell
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols && j < data[i].length; j++) {
        const value = data[i][j];
        
        // Special handling for unactivated cells in activation time view
        if (mode === VisualizationMode.ACTIVATION_TIMES && value < 0) {
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
      }
    }
    
    // Highlight the selected cell if any
    if (selectedCell) {
      const { row, col } = selectedCell;
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      ctx.lineWidth = 1;
    }
    
    ctx.restore();
  };
  
  // Draw the tissue on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if we should use WebGL and if it's supported
    const shouldUseWebGL = useWebGL && isWebGLSupported;
    
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
    
    // Get dimensions
    const rows = validRows.length;
    const cols = validRows[0].length;
    
    // Resize canvas to match the grid size
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    
    // Special handling for activation times - filter out negative values (unactivated cells)
    let filteredData = validRows.map(row => [...row]);
    if (visualizationMode === VisualizationMode.ACTIVATION_TIMES) {
      // Find the maximum activation time for proper coloring
      const validTimes = filteredData.flat().filter(val => val >= 0);
      // We don't directly use maxTime here, but it's useful for debugging
      // and may be used in future enhancements
      // const maxTime = validTimes.length ? Math.max(...validTimes) : 0;
      
      // Set unactivated cells (value -1) to a special value for visualization
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (filteredData[i][j] < 0) {
            filteredData[i][j] = -1; // Will be handled specially
          }
        }
      }
    }
    
    if (shouldUseWebGL) {
      // Initialize WebGL if not already done
      if (!webglContextRef.current) {
        webglContextRef.current = initWebGL(canvas);
      }
      
      // Render using WebGL if context is available
      if (webglContextRef.current) {
        renderWebGL(
          webglContextRef.current,
          filteredData,
          canvas.width,
          canvas.height,
          colorScale
        );
        
        // Draw selected cell highlight if any
        if (selectedCell) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const { row, col } = selectedCell;
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      } else {
        // Fallback to Canvas2D if WebGL initialization failed
        renderCanvas2D(canvas, filteredData, rows, cols, cellSize, colorScale, visualizationMode, selectedCell);
      }
    } else {
      // Use Canvas2D rendering
      renderCanvas2D(canvas, filteredData, rows, cols, cellSize, colorScale, visualizationMode, selectedCell);
    }
    
    // Draw the legend separately
    const legendCanvas = legendCanvasRef.current;
    if (legendCanvas) {
      drawLegend(legendCanvas, visualizationMode, results);
    }
  }, [visualizationMode, currentData, results, cellSize, colorScales, selectedCell, useWebGL, isWebGLSupported, viewTransform, initWebGL, renderWebGL, renderCanvas2D]);
  
  // Helper function to draw a legend for the visualization
  const drawLegend = (
    canvas: HTMLCanvasElement,
    mode: VisualizationMode,
    results: TissueSimulationResults | null
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set dimensions
    const legendWidth = 150;
    const legendHeight = 20;
    const x = 10;
    const y = 10;
    
    // Create a gradient for the legend
    const gradient = ctx.createLinearGradient(x, y, x + legendWidth, y);
    
    // Set up gradient colors based on visualization mode
    switch (mode) {
      case VisualizationMode.VOLTAGE:
        gradient.addColorStop(0, 'blue');       // Resting potential (0)
        gradient.addColorStop(0.5, 'white');    // Mid-voltage (0.5)
        gradient.addColorStop(1, 'red');        // Excited state (1)
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
    
    // Prepare variables for labels
    let leftLabel = '', rightLabel = '', centerLabel = '';
    
    // Find the range of values in the current data for AT and APD
    let minValue = 0, maxValue = 0;
    if (mode === VisualizationMode.ACTIVATION_TIMES && results) {
      const validTimes = results.activationTimes.flat().filter(val => val >= 0);
      minValue = validTimes.length ? Math.min(...validTimes) : 0;
      maxValue = validTimes.length ? Math.max(...validTimes) : 100;
      
      leftLabel = `${minValue.toFixed(1)}`;
      rightLabel = `${maxValue.toFixed(1)}`;
      centerLabel = 'Activation Time (ms)';
    } 
    else if (mode === VisualizationMode.ACTION_POTENTIAL_DURATION && results) {
      const validApds = results.apd.flat().filter(val => val >= 0);
      minValue = validApds.length ? Math.min(...validApds) : 0;
      maxValue = validApds.length ? Math.max(...validApds) : 100;
      
      leftLabel = `${minValue.toFixed(1)}`;
      rightLabel = `${maxValue.toFixed(1)}`;
      centerLabel = 'APD (ms)';
    }
    else {
      // Voltage mode
      leftLabel = '0.0';
      rightLabel = '1.0';
      centerLabel = 'Voltage (norm.)';
    }
    
    // Draw labels
    ctx.fillText(leftLabel, x, y + legendHeight + 15);
    ctx.fillText(rightLabel, x + legendWidth, y + legendHeight + 15);
    ctx.fillText(centerLabel, x + legendWidth / 2, y + legendHeight + 15);
  };
  
  // Add a useEffect to handle the wheel event with a non-passive listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // This function will be called from the non-passive listener
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault(); // This is allowed in a non-passive listener
      handleWheel(e);
    };
    
    // Add the non-passive wheel event listener
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Clean up
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);
  
  // Add a useEffect to reset the view transform when new results are loaded
  useEffect(() => {
    // Reset the view transform when new data is loaded
    setViewTransform({
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      lastX: 0,
      lastY: 0
    });
    
    console.log("Reset view transform due to new data");
  }, [currentData, results?.snapshots?.length]);
  
  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative border border-gray-300 overflow-hidden"
        style={{ 
          width: '100%', 
          height: 'auto', 
          minHeight: '300px' 
        }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-pointer"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* Separate canvas for legend */}
      <div className="mt-2 w-full">
        <canvas
          ref={legendCanvasRef}
          width={170}
          height={45}
          className="block mx-auto"
        />
      </div>
      
      {/* Controls */}
      <div className="mt-2 flex justify-center space-x-2">
        <button
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => setViewTransform({
            scale: 1.0,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            lastX: 0,
            lastY: 0
          })}
        >
          Reset View
        </button>
        <button
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => setViewTransform(prev => ({
            ...prev,
            scale: Math.min(10, prev.scale * 1.2)
          }))}
        >
          Zoom In
        </button>
        <button
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => setViewTransform(prev => ({
            ...prev,
            scale: Math.max(0.1, prev.scale * 0.8)
          }))}
        >
          Zoom Out
        </button>
      </div>
      
      {/* Info display for selected cell */}
      {selectedCell && currentData && (
        <div className="mt-2 p-2 bg-gray-100 rounded-md text-sm">
          <p>
            <strong>Cell:</strong> Row {selectedCell.row}, Col {selectedCell.col}
          </p>
          <p>
            <strong>Value:</strong> {
              visualizationMode === VisualizationMode.VOLTAGE 
                ? currentData.v[selectedCell.row]?.[selectedCell.col]?.toFixed(3) || 'N/A'
                : visualizationMode === VisualizationMode.ACTIVATION_TIMES && results
                  ? results.activationTimes[selectedCell.row]?.[selectedCell.col]?.toFixed(2) || 'Not activated'
                  : visualizationMode === VisualizationMode.ACTION_POTENTIAL_DURATION && results
                    ? results.apd[selectedCell.row]?.[selectedCell.col]?.toFixed(2) || 'N/A'
                    : 'N/A'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TissueVisualization; 