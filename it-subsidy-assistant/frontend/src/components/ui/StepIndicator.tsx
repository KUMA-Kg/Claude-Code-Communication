import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  steps, 
  currentStep, 
  orientation = 'horizontal',
  className 
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'inactive';
  };

  return (
    <div 
      className={cn(
        "flex",
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start',
        className
      )}
      role="navigation"
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <div 
            key={step.id} 
            className={cn(
              "flex items-center",
              orientation === 'horizontal' ? 'flex-1' : 'w-full mb-8'
            )}
          >
            {/* Step Circle */}
            <div className="relative flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  status === 'completed' && "bg-primary border-primary",
                  status === 'active' && "bg-primary border-primary shadow-lg shadow-primary/25",
                  status === 'inactive' && "bg-background border-muted-foreground/30"
                )}
              >
                {status === 'completed' ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <span 
                    className={cn(
                      "text-sm font-semibold",
                      status === 'active' && "text-primary-foreground",
                      status === 'inactive' && "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Step Label */}
              <div className={cn(
                "ml-4",
                orientation === 'vertical' && "min-w-[200px]"
              )}>
                <p 
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    status === 'active' && "text-foreground",
                    status === 'completed' && "text-foreground",
                    status === 'inactive' && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && orientation === 'vertical' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div 
                className={cn(
                  "transition-all duration-300",
                  orientation === 'horizontal' ? 
                    "flex-1 h-0.5 mx-4" : 
                    "w-0.5 h-12 ml-5 mt-4"
                )}
              >
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    status === 'completed' ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;