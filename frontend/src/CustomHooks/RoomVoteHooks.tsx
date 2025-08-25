import { useState, useCallback } from "react";
import { getCurrentUser } from "../utils/auth";

interface RoomVoteData {
  sticky_id: number;
  message_id: number;
  voter_id: number;
  school_id: string;
  vote_type: string;
}

interface RoomVoteResponse {
  success: boolean;
  message?: string;
}

export const useRoomVote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRoomVote = useCallback(
    async (voteData: RoomVoteData): Promise<RoomVoteResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          throw new Error("ユーザーがログインしていません");
        }

        const response = await fetch("http://localhost:5000/api/room-vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(voteData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "投票の送信に失敗しました");
        }

        const data = await response.json();
        return { success: true, message: data.message };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "不明なエラーが発生しました";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { submitRoomVote, isLoading, error };
};
