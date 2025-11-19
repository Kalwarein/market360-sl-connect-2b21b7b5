import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface MultiStepFormProps {
  steps: Step[];
  onComplete: () => void | Promise<void>;
  onBack?: () => void;
  submitText?: string;
  backText?: string;
}

export function MultiStepForm({ 
  steps, 
  onComplete, 
  onBack,
  submitText = 'Submit',
  backText = 'Back'
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    const step = steps[currentStep];
    
    if (step.validate) {
      setLoading(true);
      const isValid = await step.validate();
      setLoading(false);
      
      if (!isValid) {
        return;
      }
    }

    if (isLastStep) {
      setLoading(true);
      await onComplete();
      setLoading(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (isFirstStep && onBack) {
      onBack();
    } else {
      setCurrentStep(Math.max(0, currentStep - 1));
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {isFirstStep ? backText : 'Previous'}
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                'Processing...'
              ) : isLastStep ? (
                submitText
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
