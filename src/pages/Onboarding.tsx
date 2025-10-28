import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingContainer } from "@/components/onboarding/OnboardingContainer";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  // Redirect to swipe if already onboarded
  useEffect(() => {
    if (!profileLoading && profile?.onboarding_completed) {
      navigate("/swipe");
    }
  }, [profileLoading, profile, navigate]);

  const handleComplete = () => {
    navigate("/swipe");
  };

  if (loading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <OnboardingContainer userId={user.id} onComplete={handleComplete} />;
};

export default Onboarding;
