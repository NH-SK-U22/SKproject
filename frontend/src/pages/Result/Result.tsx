import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { gsap } from "gsap";
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
  const { theme, setTheme } = useDebateTheme();
  const [scores, setScores] = useState<CampScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRequestingRef = useRef(false); // 請求中フラグ
  const lastRequestParamsRef = useRef<string | null>(null); // 最後の請求パラメータ

  // GSAP アニメーション
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false); // アニメーション重複防止

  // API リクエストパラメータ
  const requestParams = useMemo(() => {
    if (!currentUser?.school_id || !theme?.theme_id) return null;
    return `${currentUser.school_id}-${theme.theme_id}`;
  }, [currentUser?.school_id, theme?.theme_id]);

  useEffect(() => {
    
    const fetchScores = async () => {
      if (!requestParams || isRequestingRef.current) {
        if (!requestParams && !isRequestingRef.current) {
          setLoading(false);
        }
        return;
      }

      // 同じパラメータでの重複請求を防ぐ
      if (lastRequestParamsRef.current === requestParams) {
        return;
      }

      isRequestingRef.current = true;
      lastRequestParamsRef.current = requestParams;
      setLoading(true);
      setError(null);

      try {
        const [schoolId, themeId] = requestParams.split("-");
        const response = await fetch(
          `http://localhost:5000/api/camps/scores/${schoolId}/${themeId}`
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
        isRequestingRef.current = false;
      }
    };

    fetchScores();
  }, [requestParams]);

  // GSAP アニメーション
  useEffect(() => {
    if (!loading && !error && scores.length > 0 && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      // 初期狀態設定
      gsap.set([titleRef.current, contentRef.current, buttonRef.current], {
        opacity: 0,
        y: 20,
      });

      // アニメーション時間軸
      const tl = gsap.timeline();

      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
      })
        .to(
          contentRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .to(
          buttonRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.4"
        );
    }
  }, [loading, error, scores]);

  // 重置アニメーション狀態
  useEffect(() => {
    if (loading) {
      hasAnimatedRef.current = false;
    }
  }, [loading]);

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
          <div ref={titleRef} className={styles.result}>
            <p className={styles.resultp}>討論結果</p>
          </div>
        </div>
        <div className={styles.down}>
          <div ref={contentRef}>
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
          </div>

          {/* ボタンセクション */}
          <div ref={buttonRef} className={styles.buttonContainer}>
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
