import { useState, useEffect } from "react";
import { getCurrentUser } from "../utils/auth";

interface AIAdviceAgreeResponse {
  success: boolean;
  ai_advice: boolean;
  error?: string;
}

export const useAIAdviceAgree = () => {
  const [aiAdviceAgreed, setAiAdviceAgreed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAdviceAgreement = async (): Promise<AIAdviceAgreeResponse> => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("ユーザーがログインしていません");
      }

      const response = await fetch(
        `http://localhost:5000/api/students/${currentUser.id}/ai-advice`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        ai_advice: data.ai_advice === 1,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      return {
        success: false,
        ai_advice: false,
        error: errorMessage,
      };
    }
  };

  const loadAIAdviceAgreement = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAIAdviceAgreement();

      if (result.success) {
        setAiAdviceAgreed(result.ai_advice);
      } else {
        setError(result.error || "AIアドバイス同意状態の取得に失敗しました");
        setAiAdviceAgreed(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setAiAdviceAgreed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIAdviceAgreement();
  }, []);

  return {
    aiAdviceAgreed,
    loading,
    error,
    refetch: loadAIAdviceAgreement,
  };
};
