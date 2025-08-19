import { useState, useCallback } from "react";
import { getCurrentUser } from "../utils/auth";

interface AIAdviceResponse {
  advice: string;
  success: boolean;
}

export const useAIHelp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 取得のみ（生成しない）
  const fetchAIAdvice = useCallback(
    async (stickyId: number): Promise<AIAdviceResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error("ユーザーがログインしていません");

        const params = new URLSearchParams({
          sticky_id: String(stickyId),
          student_id: String(currentUser.id),
        }).toString();

        const response = await fetch(
          `http://localhost:5000/api/ai-help?${params}`
        );
        if (!response.ok) throw new Error("AIアドバイスの取得に失敗しました");
        const data = await response.json();
        return { advice: data.advice || "", success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラーが発生しました";
        setError(errorMessage);
        return { advice: "", success: false };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 生成して保存（メッセージ送信時のみ呼ぶ）
  const generateAIAdvice = useCallback(
    async (stickyId: number): Promise<AIAdviceResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error("ユーザーがログインしていません");

        const response = await fetch(
          "http://localhost:5000/api/ai-help/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sticky_id: stickyId,
              student_id: currentUser.id,
              school_id: currentUser.school_id,
            }),
          }
        );
        if (!response.ok) throw new Error("AIアドバイスの生成に失敗しました");
        const data = await response.json();
        return { advice: data.advice || "", success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラーが発生しました";
        setError(errorMessage);
        return { advice: "", success: false };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { fetchAIAdvice, generateAIAdvice, isLoading, error };
};
