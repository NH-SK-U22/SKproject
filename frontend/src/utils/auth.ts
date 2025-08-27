// ユーザータイプ定義
export interface User {
  id: number;
  school_id: string;
  class_id: string;
  number: string;
  name: string;
  user_type: "student" | "teacher";
  sum_point: number;
  have_point: number;
  camp_id: number | null;
  theme_color: string | null;
  user_color: string | null;
  blacklist_point: number;
  created_at: string;
  ex_flag?: number;
}

// ユーザーがログインしているかチェックする
export const isLoggedIn = (): boolean => {
  return localStorage.getItem("isLoggedIn") === "true";
};

// 現在ログインしているユーザーの情報を取得
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// ユーザータイプの取得
export const getUserType = (): "student" | "teacher" | null => {
  const user = getCurrentUser();
  return user ? user.user_type : null;
};

// ログアウト機能
export const logout = (): void => {
  try {
    localStorage.clear();
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
    // フォールバック
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
  }
};

// ユーザーが教師であるかどうかを確認する
export const isTeacher = (): boolean => {
  return getUserType() === "teacher";
};

// ユーザーが学生であるかどうかを確認する
export const isStudent = (): boolean => {
  return getUserType() === "student";
};

// 身分認証が必要なルーティング保護
export const requireAuth = (): User | null => {
  if (!isLoggedIn()) {
    return null;
  }
  return getCurrentUser();
};

// ユーザーの陣営選択を削除する
export const clearUserCamp = async (): Promise<void> => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn("ユーザー情報がありません、陣営選択をクリアできません");
    return;
  }

  try {
    // localStorageから陣営選択を削除する
    const updatedUser = { ...currentUser, camp_id: null };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // データベースから陣営選択を削除する
    const response = await fetch(
      `http://localhost:5000/api/students/${currentUser.id}/camp`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          camp_id: null,
        }),
      }
    );

    if (!response.ok) {
      console.error("データベースから陣営選択を削除できません");
    }
  } catch (error) {
    console.error("陣営選択を削除できません:", error);
  }
};