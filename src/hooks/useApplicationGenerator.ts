import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GenerationOptions {
  language_override?: 'auto' | 'en' | 'sv';
  include?: ('cv' | 'cover_letter' | 'email')[];
}

export interface GenerationResult {
  success: boolean;
  language?: 'en' | 'sv';
  job?: {
    title: string;
    company: string;
    location: string;
  };
  cv?: string;
  cover_letter?: string;
  email?: {
    subject: string;
    body: string;
  };
  error?: string;
}

export interface UseApplicationGeneratorReturn {
  generate: (jobId: string, userId: string, options?: GenerationOptions) => Promise<GenerationResult>;
  loading: boolean;
  error: string | null;
  result: GenerationResult | null;
  reset: () => void;
}

export const useApplicationGenerator = (): UseApplicationGeneratorReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const generate = async (
    jobId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-application', {
        body: {
          job_id: jobId,
          user_id: userId,
          language_override: options.language_override || 'auto',
          include: options.include || ['cv', 'cover_letter', 'email'],
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult(data);
      trackGeneration(jobId, data.language, options.include || ['cv', 'cover_letter', 'email']);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const errorResult: GenerationResult = {
        success: false,
        error: errorMessage,
      };
      
      setResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
  };

  return {
    generate,
    loading,
    error,
    result,
    reset,
  };
};

// Analytics tracking helper
function trackGeneration(jobId: string, language: string, include: string[]) {
  console.log('Application generated:', {
    job_id: jobId,
    language,
    included: include,
    timestamp: new Date().toISOString(),
  });
}
