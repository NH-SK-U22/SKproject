import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import Sidebar from "../../components/Sidebar/Sidebar";
import TeacherSidebar from "../../components/Sidebar/TeacherSidebar";
import Loading from "../../components/Loading/Loading";

// utils
import { getCurrentUser } from "../../utils/auth";
import { useDebateTheme } from "../../context/DebateThemeContext";

// components
import CampScoreChart from "../../components/CampScoreChart/CampScoreChart";

// css
import styles from "./Result.module.css";

interface CampScore {
  camp_id: number;
  camp_name: string;
  score: number;
}

const Result: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { theme } = useDebateTheme();
  const [scores, setScores] = useState<CampScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      if (!currentUser || !theme) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/camps/scores/${currentUser.school_id}/${theme.theme_id}`
        );

        if (response.ok) {
          const data = await response.json();
          setScores(data.scores);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "得点の取得に失敗しました");
        }
      } catch (err) {
        console.error("得点取得エラー:", err);
        setError("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [currentUser?.school_id, theme?.theme_id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        {currentUser?.user_type === "teacher" ? (
          <TeacherSidebar />
        ) : (
          <Sidebar />
        )}
        <div className={styles.loadingContent}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <>
      {currentUser?.user_type === "teacher" ? <TeacherSidebar /> : <Sidebar />}
      <div className={styles.container}>
        <div className={styles.up}>
          <div className={styles.result}>
            <p className={styles.resultp}>討論結果</p>
          </div>
        </div>
        <div className={styles.down}>
          {error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>エラー: {error}</p>
            </div>
          ) : scores.length > 0 && theme ? (
            <CampScoreChart scores={scores} theme_id={theme.theme_id} />
          ) : (
            <div className={styles.noDataContainer}>
              <p className={styles.noDataText}>得点データがありません</p>
            </div>
          )}

          {/* ボタンセクション */}
          <div className={styles.buttonContainer}>
            <button
              onClick={() => navigate("/home")}
              className={styles.homeButton}
            >
              <IoHome className={styles.homeIcon} />
              ホームへ戻る
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Result;
