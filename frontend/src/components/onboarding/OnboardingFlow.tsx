import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { CheckCircle2, BookOpen, Heart, TrendingUp } from 'lucide-react';

interface OnboardingFlowProps {
    open: boolean;
    onComplete: () => void;
}

const ONBOARDING_STEPS = [
    {
        title: 'Welcome to MicroCare',
        description: 'Your personal mental wellness companion',
        icon: Heart,
        content: 'MicroCare helps you track your mood, reflect on your day, and build healthy mental wellness habits.',
    },
    {
        title: 'Daily Journal Entries',
        description: 'Express yourself freely',
        icon: BookOpen,
        content: 'Write daily entries to capture your thoughts, feelings, and experiences. Tag them with moods and topics for easy reflection.',
    },
    {
        title: 'Track Your Progress',
        description: 'See how far you\'ve come',
        icon: TrendingUp,
        content: 'Monitor your emotional patterns over time and celebrate your growth journey.',
    },
];

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const { user } = useAuth();

    // Reset to first step when dialog opens
    useEffect(() => {
        if (open) {
            setCurrentStep(0);
        }
    }, [open]);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setIsCompleting(true);
        try {
            await apiClient.post('/api/v1/users/complete-onboarding', {});
            onComplete();
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
        } finally {
            setIsCompleting(false);
        }
    };

    const currentStepData = ONBOARDING_STEPS[currentStep];
    const Icon = currentStepData.icon;
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Icon className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">{currentStepData.title}</DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {currentStepData.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <p className="text-center text-muted-foreground">{currentStepData.content}</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {ONBOARDING_STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 w-2 rounded-full transition-colors ${index === currentStep ? 'bg-primary' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                disabled={isCompleting}
                            >
                                Back
                            </Button>
                        )}
                        <Button onClick={handleNext} disabled={isCompleting}>
                            {isCompleting ? (
                                'Completing...'
                            ) : isLastStep ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Get Started
                                </>
                            ) : (
                                'Next'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
