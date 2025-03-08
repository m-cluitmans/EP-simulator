import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateS1S2Protocol } from '../../store/slices/arrhythmiaSlice';
import EnhancedTooltip from '../Shared/EnhancedTooltip';
import { arrhythmiaParameterTooltips } from '../../data/arrhythmiaEducation';

interface S1S2ControlsProps {
  className?: string;
}

const S1S2Controls: React.FC<S1S2ControlsProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const s1s2Protocol = useSelector((state: RootState) => state.arrhythmia.s1s2Protocol);
  
  // Handle input change for number fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      dispatch(updateS1S2Protocol({ [field]: value }));
    }
  };
  
  // Handle location change
  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    locationField: string, 
    coordField: string
  ) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      dispatch(updateS1S2Protocol({
        [locationField]: {
          ...s1s2Protocol[locationField as keyof typeof s1s2Protocol] as any,
          [coordField]: value
        }
      }));
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 mb-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">S1-S2 Protocol Settings</h3>
      
      {/* S1 Stimulus Settings */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">S1 Stimulus (First Stimulus)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amplitude
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={s1s2Protocol.s1Amplitude}
              min={0}
              max={2}
              step={0.1}
              onChange={(e) => handleInputChange(e, 's1Amplitude')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (ms)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={s1s2Protocol.s1Duration}
              min={0}
              max={50}
              step={1}
              onChange={(e) => handleInputChange(e, 's1Duration')}
            />
          </div>
        </div>
        
        <div className="mt-3">
          <EnhancedTooltip content={
            <div>
              <div className="font-bold mb-1">{arrhythmiaParameterTooltips.s1Count.title}</div>
              <div className="mb-2">{arrhythmiaParameterTooltips.s1Count.content}</div>
              <div className="text-xs text-gray-500">Physiological meaning: {arrhythmiaParameterTooltips.s1Count.physiological}</div>
            </div>
          }>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S1 Count: {s1s2Protocol.s1Count}
            </label>
          </EnhancedTooltip>
          <input
            type="range"
            className="w-full"
            min={1}
            max={10}
            step={1}
            value={s1s2Protocol.s1Count}
            onChange={(e) => handleInputChange(e, 's1Count')}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
        
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            S1 Location
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Row</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s1Location.row}
                min={0}
                max={99}
                onChange={(e) => handleLocationChange(e, 's1Location', 'row')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Column</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s1Location.col}
                min={0}
                max={99}
                onChange={(e) => handleLocationChange(e, 's1Location', 'col')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s1Location.width}
                min={1}
                max={100}
                onChange={(e) => handleLocationChange(e, 's1Location', 'width')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s1Location.height}
                min={1}
                max={100}
                onChange={(e) => handleLocationChange(e, 's1Location', 'height')}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* S2 Stimulus Settings */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">S2 Stimulus (Premature Stimulus)</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amplitude
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={s1s2Protocol.s2Amplitude}
              min={0}
              max={2}
              step={0.1}
              onChange={(e) => handleInputChange(e, 's2Amplitude')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (ms)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={s1s2Protocol.s2Duration}
              min={0}
              max={50}
              step={1}
              onChange={(e) => handleInputChange(e, 's2Duration')}
            />
          </div>
        </div>
        
        <div className="mt-3">
          <EnhancedTooltip content={
            <div>
              <div className="font-bold mb-1">{arrhythmiaParameterTooltips.s1s2Interval.title}</div>
              <div className="mb-2">{arrhythmiaParameterTooltips.s1s2Interval.content}</div>
              <div className="text-xs text-gray-500">Physiological meaning: {arrhythmiaParameterTooltips.s1s2Interval.physiological}</div>
            </div>
          }>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S1-S2 Coupling Interval: {s1s2Protocol.s1s2Interval} ms
            </label>
          </EnhancedTooltip>
          <input
            type="range"
            className="w-full"
            min={150}
            max={400}
            step={5}
            value={s1s2Protocol.s1s2Interval}
            onChange={(e) => handleInputChange(e, 's1s2Interval')}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>150 ms</span>
            <span>400 ms</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            For reentry induction, an interval of 320-350ms usually works well.
          </div>
        </div>
        
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            S2 Location
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Row</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s2Location.row}
                min={0}
                max={99}
                onChange={(e) => handleLocationChange(e, 's2Location', 'row')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Column</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s2Location.col}
                min={0}
                max={99}
                onChange={(e) => handleLocationChange(e, 's2Location', 'col')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s2Location.width}
                min={1}
                max={100}
                onChange={(e) => handleLocationChange(e, 's2Location', 'width')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={s1s2Protocol.s2Location.height}
                min={1}
                max={100}
                onChange={(e) => handleLocationChange(e, 's2Location', 'height')}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Coupling Interval */}
      <div className="mt-4 pt-2 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coupling Interval (ms)
        </label>
        <div className="flex items-center">
          <input
            type="range"
            className="flex-grow mr-2"
            value={s1s2Protocol.couplingInterval}
            min={5}
            max={800}
            step={5}
            onChange={(e) => handleInputChange(e, 'couplingInterval')}
          />
          <input
            type="number"
            className="w-20 px-2 py-1 border rounded-md"
            value={s1s2Protocol.couplingInterval}
            min={5}
            max={800}
            step={5}
            onChange={(e) => handleInputChange(e, 'couplingInterval')}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Time interval between S1 and S2 stimuli. For studying arrhythmias, values between 100-800ms are typical. 
          Shorter intervals (&lt;250ms) are more likely to induce reentry.
        </p>
      </div>
    </div>
  );
};

export default S1S2Controls; 