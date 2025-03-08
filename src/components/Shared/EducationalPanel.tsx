import React, { useState } from 'react';

interface EducationalPanelProps {
  title: string;
  basicContent: React.ReactNode;
  intermediateContent?: React.ReactNode;
  advancedContent?: React.ReactNode;
  clinicalRelevance?: React.ReactNode;
  className?: string;
}

const EducationalPanel: React.FC<EducationalPanelProps> = ({
  title,
  basicContent,
  intermediateContent,
  advancedContent,
  clinicalRelevance,
  className = ''
}) => {
  const [expandedLevel, setExpandedLevel] = useState<'basic' | 'intermediate' | 'advanced' | 'clinical'>('basic');
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className={`bg-blue-50 border-l-4 border-blue-500 rounded-lg ${className}`}>
      <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
        <span className="text-blue-600">
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4">
          {/* Level tabs */}
          <div className="flex border-b mb-3">
            <button 
              className={`px-3 py-1 ${expandedLevel === 'basic' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setExpandedLevel('basic')}
            >
              Basic
            </button>
            {intermediateContent && (
              <button 
                className={`px-3 py-1 ${expandedLevel === 'intermediate' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                onClick={() => setExpandedLevel('intermediate')}
              >
                Intermediate
              </button>
            )}
            {advancedContent && (
              <button 
                className={`px-3 py-1 ${expandedLevel === 'advanced' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                onClick={() => setExpandedLevel('advanced')}
              >
                Advanced
              </button>
            )}
            {clinicalRelevance && (
              <button 
                className={`px-3 py-1 ${expandedLevel === 'clinical' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
                onClick={() => setExpandedLevel('clinical')}
              >
                Clinical Relevance
              </button>
            )}
          </div>
          
          {/* Content based on selected level */}
          <div className="content-area">
            {expandedLevel === 'basic' && basicContent}
            {expandedLevel === 'intermediate' && intermediateContent}
            {expandedLevel === 'advanced' && advancedContent}
            {expandedLevel === 'clinical' && clinicalRelevance}
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalPanel; 