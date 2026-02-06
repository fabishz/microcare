import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/**
 * OnboardingManager
 * Manages the display of the onboarding flow for new users
 * Shows the onboarding dialog when a user is authenticated but hasn't completed onboarding
 */
export function OnboardingManager() {
    const { user } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // Show onboarding if user is logged in but hasn't completed it
        if (user && !user.hasCompletedOnboarding) {
            setShowOnboarding(true);
        } else {
            setShowOnboarding(false);
        }
    }, [user]);

    const handleComplete = () => {
        setShowOnboarding(false);
        // Force a page reload to fetch the updated user profile
        window.location.reload();
    };

    return <OnboardingFlow open={showOnboarding} onComplete={handleComplete} />;
}
