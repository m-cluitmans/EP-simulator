// Define the QuizQuestion interface first before importing
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

// Now import from other files
import { cellModuleQuizQuestions } from './cellEducation';
import { tissueModuleQuizQuestions } from './tissueEducation';
import { arrhythmiaModuleQuizQuestions } from './arrhythmiaEducation';

// Organize all quizzes by module and topic
export const quizzes = {
  cell: {
    actionPotentialBasics: {
      title: "Action Potential Basics",
      questions: cellModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'basic')
    },
    actionPotentialAdvanced: {
      title: "Advanced Action Potential Concepts",
      questions: cellModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty !== 'basic')
    },
    fullQuiz: {
      title: "Cell Module Comprehensive Quiz",
      questions: cellModuleQuizQuestions
    }
  },
  tissue: {
    propagationBasics: {
      title: "Cardiac Propagation Basics",
      questions: tissueModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'basic')
    },
    propagationAdvanced: {
      title: "Advanced Propagation Concepts",
      questions: tissueModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty !== 'basic')
    },
    fullQuiz: {
      title: "Tissue Module Comprehensive Quiz",
      questions: tissueModuleQuizQuestions
    }
  },
  arrhythmia: {
    reentryBasics: {
      title: "Reentry Mechanisms: Basic Concepts",
      questions: arrhythmiaModuleQuizQuestions.filter((q: QuizQuestion) => 
        q.difficulty === 'basic' && 
        q.question.toLowerCase().includes('reentry'))
    },
    fibrosisAndArrhythmias: {
      title: "Fibrosis and Arrhythmias",
      questions: arrhythmiaModuleQuizQuestions.filter((q: QuizQuestion) => 
        q.question.toLowerCase().includes('fibrosis'))
    },
    fullQuiz: {
      title: "Arrhythmia Module Comprehensive Quiz",
      questions: arrhythmiaModuleQuizQuestions
    }
  },
  comprehensive: {
    basicConcepts: {
      title: "Cardiac Electrophysiology: Basic Concepts",
      questions: [
        ...cellModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'basic'),
        ...tissueModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'basic'),
        ...arrhythmiaModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'basic')
      ]
    },
    advancedConcepts: {
      title: "Cardiac Electrophysiology: Advanced Concepts",
      questions: [
        ...cellModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced'),
        ...tissueModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced'),
        ...arrhythmiaModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced')
      ]
    },
    challengeQuiz: {
      title: "Cardiac Electrophysiology Challenge Quiz",
      questions: [
        ...cellModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced'),
        ...tissueModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced'),
        ...arrhythmiaModuleQuizQuestions.filter((q: QuizQuestion) => q.difficulty === 'advanced')
      ].sort(() => Math.random() - 0.5).slice(0, 10) // Random selection of 10 advanced questions
    }
  }
}; 