import { QuizQuestion } from './quizzes';

export const tissueParameterTooltips = {
  diffusionCoefficient: {
    title: 'Diffusion Coefficient',
    content: `Controls the speed of electrical propagation through tissue. Higher values lead to faster conduction. Range: 0.1-5.0`,
    physiological: 'Corresponds to gap junction conductance and tissue connectivity'
  },
  anisotropyRatio: {
    title: 'Anisotropy Ratio',
    content: `Ratio of conduction velocity in longitudinal vs. transverse directions. Higher values create more directional propagation. Range: 1.0-10.0`,
    physiological: 'Reflects myocyte alignment and anisotropic cellular architecture in cardiac tissue'
  },
  stimulusLocation: {
    title: 'Stimulus Location',
    content: `Position where electrical activation begins. Different locations create different propagation patterns.`,
    physiological: 'Corresponds to pacemaker location or site of ectopic activity'
  },
  stimulusStrength: {
    title: 'Stimulus Strength',
    content: `Amplitude of applied stimulus. Must be above threshold to initiate propagation. Range: 1.0-5.0`,
    physiological: 'Similar to amplitude of pacemaker or ectopic impulse'
  }
};

export const tissueEducation = {
  basic: {
    title: 'Cardiac Tissue Propagation',
    content: `
      <p>Cardiac electrical activity propagates from cell to cell through gap junctions. This propagation follows these principles:</p>
      <ul>
        <li>Cells are electrically coupled through low-resistance connections</li>
        <li>Activation spreads from excited to resting cells</li>
        <li>The wavefront moves with a specific conduction velocity</li>
        <li>Propagation requires a source-sink balance between activated and resting cells</li>
      </ul>
      <p>In the tissue simulation, you can observe how these principles create organized wavefronts.</p>
    `
  },
  intermediate: {
    title: 'Reaction-Diffusion Dynamics',
    content: `
      <p>Cardiac tissue propagation is modeled mathematically as a reaction-diffusion system:</p>
      <div style="background-color: #f8f8f8; padding: 10px; border-radius: 4px; margin: 10px 0;">
        <p>∂V/∂t = D∇²V + f(V,h)</p>
        <p>where:</p>
        <ul>
          <li>V: membrane potential</li>
          <li>D: diffusion coefficient tensor</li>
          <li>∇²: Laplacian operator (spatial second derivative)</li>
          <li>f(V,h): cell model nonlinear dynamics (Mitchell Schaeffer model)</li>
        </ul>
      </div>
      <p>The diffusion term (D∇²V) represents cell-to-cell coupling via gap junctions, while f(V,h) represents the single-cell action potential dynamics.</p>
    `
  },
  advanced: {
    title: 'Wave Propagation Properties',
    content: `
      <p>Several important properties characterize wave propagation in cardiac tissue:</p>
      <ul>
        <li><strong>Conduction Velocity (CV):</strong> Speed of wavefront propagation, determined by diffusion coefficient and cell excitability</li>
        <li><strong>Wavelength:</strong> Product of CV and action potential duration (APD), representing the spatial extent of excited tissue</li>
        <li><strong>Source-Sink Relationship:</strong> Balance between depolarizing current from excited cells (source) and load of resting cells (sink)</li>
        <li><strong>Curvature Effect:</strong> Convex wavefronts propagate slower than concave or flat wavefronts due to source-sink mismatch</li>
        <li><strong>Anisotropy:</strong> Directional differences in conduction velocity due to cell orientation</li>
      </ul>
      <p>These properties influence physiological conduction and can create conditions for arrhythmias when altered.</p>
    `
  },
  clinical: {
    title: 'Clinical Relevance',
    content: `
      <p>Understanding tissue propagation has important clinical implications:</p>
      <ul>
        <li><strong>Conduction Disorders:</strong></li>
        <ul>
          <li>Bundle branch blocks: Delayed activation of ventricles</li>
          <li>Heart block: Impaired conduction between atria and ventricles</li>
        </ul>
        <li><strong>Structural Heart Disease:</strong></li>
        <ul>
          <li>Fibrosis: Creates conduction barriers and slows propagation</li>
          <li>Hypertrophy: Increases tissue mass, affecting source-sink relationships</li>
        </ul>
        <li><strong>Treatment Applications:</strong></li>
        <ul>
          <li>Cardiac resynchronization therapy: Coordinating activation sequence</li>
          <li>Ablation procedures: Creating conduction blocks to prevent arrhythmias</li>
        </ul>
      </ul>
      <p>Tissue models help visualize these phenomena and predict therapeutic outcomes.</p>
    `
  }
};

export const tissueModuleQuizQuestions: QuizQuestion[] = [
  {
    question: "What parameter most directly controls conduction velocity in the tissue model?",
    options: ["Diffusion coefficient", "Action potential duration", "Resting membrane potential", "Stimulus amplitude"],
    correctIndex: 0,
    explanation: "The diffusion coefficient directly determines how quickly the electrical signal spreads from cell to cell, thus controlling conduction velocity.",
    difficulty: "basic" as const
  },
  {
    question: "What is the primary mechanism of electrical propagation between cardiac cells?",
    options: ["Gap junctions", "T-tubules", "Intercalated discs", "Voltage-gated channels"],
    correctIndex: 0,
    explanation: "Gap junctions are specialized channels that directly connect adjacent cells, allowing ion flow and electrical propagation between cardiac myocytes.",
    difficulty: "basic" as const
  },
  {
    question: "How does increasing anisotropy ratio affect wave propagation?",
    options: [
      "Makes propagation more directional",
      "Makes propagation more uniform in all directions",
      "Stops propagation completely",
      "Reverses the direction of propagation"
    ],
    correctIndex: 0,
    explanation: "An increased anisotropy ratio means that propagation is faster in one direction (typically along the longitudinal axis of fibers) than in perpendicular directions.",
    difficulty: "intermediate" as const
  },
  {
    question: "What is the 'source-sink relationship' in cardiac propagation?",
    options: [
      "Balance between depolarizing current from excited cells and load of resting cells",
      "Balance between inward and outward currents in single cells",
      "Relationship between stimulus strength and action potential amplitude",
      "Relationship between heart rate and blood pressure"
    ],
    correctIndex: 0,
    explanation: "The source-sink relationship refers to the balance between the depolarizing current provided by excited cells (source) and the electrotonic load imposed by resting cells (sink).",
    difficulty: "intermediate" as const
  },
  {
    question: "In the reaction-diffusion model of cardiac tissue, what does the term D∇²V represent?",
    options: [
      "Cell-to-cell coupling via gap junctions",
      "Action potential generation in individual cells",
      "External stimulus current",
      "Cell membrane capacitance"
    ],
    correctIndex: 0,
    explanation: "The term D∇²V represents the diffusion of voltage between cells, which occurs through gap junctions in real cardiac tissue.",
    difficulty: "advanced" as const
  }
]; 