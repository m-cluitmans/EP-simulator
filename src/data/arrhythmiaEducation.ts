import { QuizQuestion } from './quizzes';

export const arrhythmiaParameterTooltips = {
  s1s2Interval: {
    title: 'S1-S2 Interval',
    content: `Time between basic (S1) and premature (S2) stimuli. Shorter intervals are more likely to induce reentry. Range: 150-400ms`,
    physiological: 'Corresponds to coupling interval of premature beats in clinical settings'
  },
  s1Count: {
    title: 'S1 Count',
    content: `Number of basic (S1) stimuli before premature (S2) stimulus. Higher counts establish more stable rhythm. Range: 1-10`,
    physiological: 'Similar to pacing protocols used in electrophysiology studies'
  },
  fibrosisDensity: {
    title: 'Fibrosis Density',
    content: `Percentage of tissue replaced by non-conductive fibrotic tissue. Higher values create more conduction barriers. Range: 0-40%`,
    physiological: 'Represents collagen deposition in scarred cardiac tissue'
  },
  fibrosisPattern: {
    title: 'Fibrosis Pattern',
    content: `Spatial arrangement of fibrotic tissue. Different patterns create different arrhythmia vulnerabilities.`,
    physiological: 'Corresponds to various pathological fibrosis patterns (diffuse, patchy, compact)'
  },
  excitabilityGradient: {
    title: 'Excitability Gradient',
    content: `Spatial variation in excitability across tissue. Creates heterogeneity in conduction properties.`,
    physiological: 'Corresponds to regional differences in ion channel expression or pathological changes'
  },
  // MS model parameter tooltips for arrhythmia module
  tau_in: {
    title: 'τ_in (Tau In)',
    content: `Controls the speed of depolarization (upstroke velocity). In arrhythmias, reduced upstroke velocity can lead to conduction slowing, a key factor in reentry.`,
    physiological: 'Represents sodium channel activity, which can be altered by mutations, drug effects, or ischemia'
  },
  tau_out: {
    title: 'τ_out (Tau Out)',
    content: `Controls repolarization rate and action potential duration (APD). In arrhythmias, heterogeneity in APD can create dispersion of refractoriness.`,
    physiological: 'Represents potassium channel function, often affected in long QT syndrome or heart failure'
  },
  tau_open: {
    title: 'τ_open (Tau Open)',
    content: `Controls recovery time after excitation. In arrhythmias, slower recovery times increase refractoriness and affect vulnerability to reentry.`,
    physiological: 'Corresponds to sodium channel recovery from inactivation, affected by sodium channel-blocking drugs'
  },
  tau_close: {
    title: 'τ_close (Tau Close)',
    content: `Controls gate closing during excitation. In arrhythmias, altering this parameter affects the action potential shape and excitability window.`,
    physiological: 'Related to sodium channel inactivation kinetics, which can be affected by genetic mutations in Brugada syndrome'
  },
  v_gate: {
    title: 'V_gate',
    content: `Threshold voltage for gate dynamics. Higher values reduce tissue excitability, which can create regions of functional block in arrhythmias.`,
    physiological: 'Corresponds to action potential threshold, which can be elevated in ischemic tissue or by certain antiarrhythmic drugs'
  }
};

export const reentryEducation = {
  basic: {
    title: 'Reentry Mechanisms',
    content: `
      <p>Reentry occurs when an electrical impulse returns to its point of origin and reactivates tissue that has already recovered. Key requirements for reentry:</p>
      <ul>
        <li>Unidirectional block in one pathway</li>
        <li>Slow conduction in alternative pathway</li>
        <li>Tissue must recover excitability before the returning wavefront</li>
      </ul>
      <p>This creates a self-sustaining circuit that can drive rapid, abnormal heartbeats.</p>
    `
  },
  intermediate: {
    title: 'Types of Reentrant Circuits',
    content: `
      <p>Reentry can occur in several different patterns:</p>
      <ul>
        <li><strong>Anatomical Reentry:</strong> Wave circulates around a fixed anatomical obstacle (e.g., scar tissue)</li>
        <li><strong>Functional Reentry:</strong> Circuit forms around regions of refractory tissue without fixed obstacles</li>
        <li><strong>Spiral Wave/Rotor:</strong> Self-sustaining spiral pattern of activation</li>
        <li><strong>Figure-of-Eight Reentry:</strong> Two counter-rotating circuits sharing a common pathway</li>
      </ul>
      <p>The S1-S2 protocol in this module can induce these different reentry patterns depending on the timing and tissue properties.</p>
    `
  },
  advanced: {
    title: 'Initiation and Maintenance of Reentry',
    content: `
      <p>The initiation of reentry typically requires specific conditions:</p>
      <ul>
        <li><strong>Vulnerable Window:</strong> Critical time period when a premature stimulus can induce unidirectional block</li>
        <li><strong>Critical Wavelength:</strong> Wavelength (CV × refractory period) must be shorter than the path length of the circuit</li>
        <li><strong>Dispersion of Refractoriness:</strong> Spatial heterogeneity in recovery times creates potential for unidirectional block</li>
      </ul>
      <p>Maintenance of reentry depends on:</p>
      <ul>
        <li><strong>Excitable Gap:</strong> Recovered tissue ahead of the wavefront</li>
        <li><strong>Source-Sink Balance:</strong> Sufficient current from activated cells to excite recovered cells</li>
        <li><strong>Wavefront-Wavetail Interactions:</strong> Relationship between activation and recovery phases</li>
      </ul>
      <p>In the simulation, observe how these factors influence whether reentry is transient or sustained.</p>
    `
  },
  clinical: {
    title: 'Clinical Relevance and Treatment',
    content: `
      <p>Reentrant arrhythmias include:</p>
      <ul>
        <li><strong>Atrial Flutter:</strong> Macro-reentrant circuit in the atrium</li>
        <li><strong>Atrial Fibrillation:</strong> Multiple irregular reentrant circuits</li>
        <li><strong>Ventricular Tachycardia:</strong> Reentry around ventricular scar tissue</li>
        <li><strong>Ventricular Fibrillation:</strong> Chaotic reentrant wavefronts, often spiral waves</li>
      </ul>
      <p>Treatment strategies target the necessary conditions for reentry:</p>
      <ul>
        <li><strong>Antiarrhythmic Drugs:</strong> Alter refractory periods and conduction velocity</li>
        <li><strong>Catheter Ablation:</strong> Create conduction block to interrupt reentrant circuits</li>
        <li><strong>Defibrillation:</strong> Terminate all electrical activity to reset the heart</li>
        <li><strong>Anti-fibrotic Therapies:</strong> Prevent structural changes that create reentry substrates</li>
      </ul>
      <p>Understanding the fundamental mechanisms of reentry helps guide these clinical interventions.</p>
    `
  }
};

export const fibrosisEducation = {
  basic: {
    title: 'Cardiac Fibrosis Basics',
    content: `
      <p>Cardiac fibrosis is the excessive deposition of extracellular matrix proteins (primarily collagen) in the heart. In the context of arrhythmias, fibrosis:</p>
      <ul>
        <li>Creates barriers to electrical conduction</li>
        <li>Forces wavefronts to travel around non-conductive regions</li>
        <li>Increases the heterogeneity of tissue properties</li>
        <li>Can separate groups of cardiomyocytes, impairing cell-to-cell coupling</li>
      </ul>
      <p>In the simulation, fibrotic regions appear as non-conductive areas that block normal wave propagation.</p>
    `
  },
  intermediate: {
    title: 'Fibrosis Patterns and Their Effects',
    content: `
      <p>Different patterns of fibrosis have different effects on electrical propagation:</p>
      <ul>
        <li><strong>Diffuse Fibrosis:</strong> Scattered fibrotic deposits throughout tissue; slows conduction and increases its heterogeneity</li>
        <li><strong>Patchy Fibrosis:</strong> Clusters of fibrotic tissue; creates potential channels for slow conduction and reentry</li>
        <li><strong>Compact Fibrosis/Scarring:</strong> Dense region of fibrosis (e.g., post-infarction scar); forms barriers around which reentry can occur</li>
        <li><strong>Interstitial Fibrosis:</strong> Fibrosis between individual cells; disrupts cell-to-cell coupling</li>
      </ul>
      <p>In the simulation, you can explore how different fibrosis patterns affect vulnerability to arrhythmias.</p>
    `
  },
  advanced: {
    title: 'Fibrosis and Arrhythmia Mechanisms',
    content: `
      <p>Fibrosis contributes to arrhythmias through several mechanisms:</p>
      <ul>
        <li><strong>Zigzag Conduction:</strong> Wavefronts follow tortuous paths through non-fibrotic tissue, slowing conduction</li>
        <li><strong>Current-to-Load Mismatch:</strong> Narrow conducting channels between fibrotic regions create source-sink imbalances</li>
        <li><strong>Functional Conduction Block:</strong> Regions where activation fails due to excessive fibrosis and reduced coupling</li>
        <li><strong>Micro-Reentry:</strong> Small reentrant circuits that form around fibrotic obstacles</li>
        <li><strong>Ectopic Activity:</strong> Fibrosis can promote abnormal automaticity at the border zones</li>
      </ul>
      <p>The simulation demonstrates how these mechanisms interact to create complex arrhythmogenic substrates.</p>
    `
  },
  clinical: {
    title: 'Clinical Implications of Fibrosis',
    content: `
      <p>Cardiac fibrosis is associated with various clinical conditions:</p>
      <ul>
        <li><strong>Post-Myocardial Infarction:</strong> Scar formation after heart attack</li>
        <li><strong>Cardiomyopathies:</strong> Fibrosis in various patterns depending on type</li>
        <li><strong>Aging:</strong> Progressive fibrosis with advancing age</li>
        <li><strong>Hypertension:</strong> Reactive fibrosis due to pressure overload</li>
      </ul>
      <p>Clinical management includes:</p>
      <ul>
        <li><strong>Imaging:</strong> MRI with late gadolinium enhancement to detect fibrosis</li>
        <li><strong>Electroanatomic Mapping:</strong> Identify areas of low voltage corresponding to fibrosis</li>
        <li><strong>Targeted Ablation:</strong> Focus on fibrotic border zones to interrupt circuits</li>
        <li><strong>Anti-fibrotic Therapies:</strong> Medications targeting fibrosis development (ACE inhibitors, ARBs)</li>
      </ul>
      <p>The simulation helps understand how these clinical interventions might affect arrhythmia susceptibility.</p>
    `
  }
};

export const arrhythmiaModuleQuizQuestions: QuizQuestion[] = [
  {
    question: "What are the three key requirements for reentry?",
    options: [
      "Unidirectional block, slow conduction, and tissue recovery",
      "Fast conduction, complete block, and high stimulus amplitude",
      "Multiple stimuli, cardiac fibrosis, and ion channel dysfunction",
      "Increased automaticity, triggered activity, and conduction block"
    ],
    correctIndex: 0,
    explanation: "Reentry requires unidirectional block in one pathway, slow conduction in an alternate pathway, and tissue recovery before the returning wavefront arrives.",
    difficulty: "basic" as const
  },
  {
    question: "In the S1-S2 protocol, what does S2 represent?",
    options: [
      "A premature stimulus",
      "A stronger stimulus",
      "A second electrode",
      "A special stimulus waveform"
    ],
    correctIndex: 0,
    explanation: "In the S1-S2 protocol, S1 represents basic stimuli that establish a stable rhythm, while S2 is a premature stimulus delivered earlier than the basic cycle length.",
    difficulty: "basic" as const
  },
  {
    question: "How does cardiac fibrosis contribute to arrhythmias?",
    options: [
      "Creates barriers to electrical conduction",
      "Increases tissue excitability",
      "Eliminates action potential refractory periods",
      "Prevents calcium overload"
    ],
    correctIndex: 0,
    explanation: "Cardiac fibrosis creates non-conductive barriers that force electrical wavefronts to take alternate paths, potentially setting up conditions for reentry.",
    difficulty: "intermediate" as const
  },
  {
    question: "What is meant by the 'vulnerable window' in arrhythmia initiation?",
    options: [
      "Critical time period when a premature stimulus can induce unidirectional block",
      "Period when the heart is vulnerable to mechanical damage",
      "Time when antiarrhythmic drugs are ineffective",
      "Window of opportunity for successful defibrillation"
    ],
    correctIndex: 0,
    explanation: "The vulnerable window is a specific time period during repolarization when a premature stimulus can induce unidirectional block, a key condition for reentry initiation.",
    difficulty: "intermediate" as const
  },
  {
    question: "In the context of reentry, what does the term 'wavelength' refer to?",
    options: [
      "Conduction velocity × refractory period",
      "Distance between stimulating electrodes",
      "Amplitude of the action potential",
      "Duration of the QRS complex"
    ],
    correctIndex: 0,
    explanation: "Wavelength in reentry is defined as conduction velocity multiplied by the refractory period. It represents the spatial extent of the excited tissue. For reentry to occur, the wavelength must be shorter than the path length of the circuit.",
    difficulty: "advanced" as const
  },
  {
    question: "Which arrhythmia mechanism is characterized by a self-sustaining spiral pattern of activation?",
    options: [
      "Spiral wave/rotor",
      "Ectopic focus",
      "AV nodal reentry",
      "Bundle branch block"
    ],
    correctIndex: 0,
    explanation: "A spiral wave or rotor is a self-sustaining spiral pattern of activation that can drive rapid, organized arrhythmias. It's a form of functional reentry without requiring a fixed anatomical obstacle.",
    difficulty: "advanced" as const
  }
]; 