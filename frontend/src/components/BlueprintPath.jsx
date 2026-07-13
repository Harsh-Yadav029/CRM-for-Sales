import React from 'react';
import { motion } from 'framer-motion';

const BlueprintPath = ({
  steps = [],
  currentStep = 0,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 w-full select-none ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={idx}>
            {/* Step Stop Button */}
            <div className="flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => onStepClick && onStepClick(idx)}
                disabled={!onStepClick}
                className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold font-mono transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gold border-gold text-ink'
                    : isActive
                    ? 'border-gold text-gold bg-white ring-4 ring-gold/15'
                    : 'border-line text-slate-400 bg-white'
                }`}
              >
                {/* Completed stop marker filled animation */}
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="material-symbols-outlined text-[16px] font-bold"
                  >
                    check
                  </motion.span>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>
              {step.title && (
                <span className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-wide font-label">
                  {step.title}
                </span>
              )}
            </div>

            {/* Connecting Dashed Path */}
            {idx < steps.length - 1 && (
              <div className="flex-1 min-w-[30px] h-[2px] relative flex items-center">
                {/* Background Line */}
                <div className="absolute inset-0 border-t-2 border-dashed border-line"></div>
                {/* Active Progress Line */}
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute left-0 top-0 h-full border-t-2 border-dashed border-gold"
                ></motion.div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BlueprintPath;
export { BlueprintPath };
