import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Brain } from "lucide-react";
import { handleOAuthCallback } from "../../services/authService";

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const completeOAuthSignIn = async () => {
      const success = await handleOAuthCallback();

      if (!isMounted) {
        return;
      }

      if (success) {
        navigate("/dashboard", { replace: true });
        return;
      }

      toast.error("OAuth sign-in could not be completed.");
      navigate("/signin", { replace: true });
    };

    completeOAuthSignIn();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-soft-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing sign-in
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your Google or GitHub session is being verified.
        </p>
      </div>
    </div>
  );
};
