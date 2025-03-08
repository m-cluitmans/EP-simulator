import React, { useState, useRef, ReactElement } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: ReactElement;
  width?: string;
}

const EnhancedTooltip: React.FC<TooltipProps> = ({
  content,
  children,
  width = '250px'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Create a safer version of events that doesn't cause TypeScript errors
  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Clone the element with our event handlers
  const childWithEvents = React.cloneElement(
    children,
    {
      // Type assertion to allow any props to be added
      ...children.props as any,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }
  );

  return (
    <div className="relative inline-block">
      {childWithEvents}
      
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="absolute z-50 bg-white rounded-lg shadow-lg p-3 border border-gray-200 text-sm"
          style={{ 
            bottom: '100%', 
            left: '50%', 
            transform: 'translateX(-50%) translateY(-8px)',
            width: width
          }}
        >
          <div className="tooltip-content">{content}</div>
          <div 
            className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 transform rotate-45"
            style={{ bottom: '-6px', left: 'calc(50% - 6px)' }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTooltip; 