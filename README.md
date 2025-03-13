# Cardiac Electrophysiology Learning Platform

An interactive web application for teaching cardiac electrophysiology concepts to students in biomedical engineering and medical sciences.

*Warning: This project is FULLY developed by AI, and its code is not human-verified. Use at your own risk.*

You can see an example of the platform [here](https://epsimulator.grantorai.com/).

## Project Overview

This browser-based interactive application serves as an educational tool for understanding cardiac electrophysiology. It provides visual, interactive simulations of action potential generation and propagation, effects of ion channel properties, tissue-level activation patterns, and arrhythmia mechanisms.

## Educational Context

- **Target Audience**: Students with a background in biomedical engineering or medical sciences
- **Purpose**: Alternative to more complex computational tools like OpenCARP, focusing on educational clarity rather than complete biophysical accuracy

## Features

### Single Cell Electrophysiology Module
- Interactive visualization of action potential generation
- Parameter sliders for key ion channel conductances
- Side-by-side comparison between normal and pathological conditions
- Visual representation of ion movements during different AP phases

### Tissue Propagation Module
- 2D grid simulation with color-coded activation visualization
- Controls for tissue properties (conductivity)
- Multiple visualization modes (LATs, APDs, wavefront propagation)

### Arrhythmia Mechanism Explorer
- S1-S2 pacing protocol with adjustable timing
- Introduction of repolarization gradients, conduction obstacles, and fibrosis patterns

## Technical Approach

### Architecture
- **Frontend Framework**: React with TypeScript
- **State Management**: Redux with Redux Toolkit
- **Styling**: Tailwind CSS
- **Visualization**: D3.js for plots, HTML Canvas for 2D simulations
- **Simulation Engine**: JavaScript with Web Workers for performance

### Models
1. **Simplified Cellular Models**: Mitchell Schaeffer model (4-variable system)
2. **Tissue Model**: 2D reaction-diffusion system on a grid

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (version 6 or higher)

### Installation

1. Clone the repository:
```
git clone https://github.com/m-cluitmans/EP-simulator.git
cd cardiac-ep-platform
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## Usage

1. Navigate through the different modules using the top navigation bar:
   - **Cell**: Explore single cell action potential dynamics
   - **Tissue**: Visualize propagation across cardiac tissue
   - **Arrhythmia**: Investigate mechanisms of arrhythmias

2. Use the interactive controls to adjust parameters and observe their effects on simulations

## Development

### Project Structure

```
src/
├── components/        # React components
│   ├── Cell/          # Single cell module components
│   ├── Tissue/        # Tissue module components 
│   └── Arrhythmia/    # Arrhythmia module components
├── models/            # Simulation models
├── store/             # Redux store and slices
├── utils/             # Utility functions
└── hooks/             # Custom React hooks
```

### Building for Production

To build the application for production:

```
npm run build
```

This creates a `build` directory with optimized production files.

