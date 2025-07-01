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

// 獲取用戶類型
export const getUserType = (): "student" | "teacher" | null => {
  const user = getCurrentUser();
  return user ? user.user_type : null;
};

// 登出功能
export const logout = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
};

// 檢查用戶是否為老師
export const isTeacher = (): boolean => {
  return getUserType() === "teacher";
};

// 檢查用戶是否為學生
export const isStudent = (): boolean => {
  return getUserType() === "student";
};

// 需要身份驗證的路由保護
export const requireAuth = (): User | null => {
  if (!isLoggedIn()) {
    return null;
  }
  return getCurrentUser();
};
