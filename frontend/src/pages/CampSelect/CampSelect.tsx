// react
import React from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// utils
import { getCurrentUser } from "../../utils/auth";

// context
import { useDebateTheme } from "../../context/DebateThemeContext";

// components
import Loading from "../../components/Loading/Loading";

// css
import styles from "./CampSelect.module.css";

const CampSelect = () => {
  const navigate = useNavigate();
  const [selectedCamp, setSelectedCamp] = useState("camp1");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const { theme, fetchTheme } = useDebateTheme();

  // ページ表示時のアニメーションとテーマ取得
  useEffect(() => {
    // テーマ情報を取得
    fetchTheme();

    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          x: 100,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    }
  }, [fetchTheme]);

  const handleSelect = (camp: string) => {
    setSelectedCamp(camp);
  };

  const handleNext = async () => {
    setIsLoading(true);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("ログイン情報が見つかりません");
      navigate("/login");
      return;
    }

    // Nextボタンのアニメーション
    if (nextBtnRef.current) {
      gsap.to(nextBtnRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(nextBtnRef.current, {
            scale: 1,
            duration: 0.1,
            ease: "power2.out",
          });
        },
      });
    }

    // ページ移動のアニメーション
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        x: -100,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          (async () => {
            try {
              // 陣営選択をcamp_idに変換 (camp1 = 1, camp2 = 2)
              const campId = selectedCamp === "camp1" ? 1 : 2;

              // ユーザーのcamp_idをデータベースに保存
              const response = await fetch(
                `http://localhost:5000/api/students/${currentUser.id}/camp`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    camp_id: campId,
                  }),
                }
              );

              if (response.ok) {
                // localStorageのユーザー情報を更新
                const updatedUser = { ...currentUser, camp_id: campId };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                // Createページに移動（その後自動的にdashboardに移動）
                navigate("/create");
              } else {
                const errorData = await response.json();
                alert(
                  "陣営選択に失敗しました: " +
                    (errorData.error || "不明なエラー")
                );
                // エラー時にページ位置を復元
                gsap.to(containerRef.current, {
                  x: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            } catch (error) {
              console.error("陣営選択エラー:", error);
              alert("通信エラーが発生しました");
              gsap.to(containerRef.current, {
                x: 0,
                opacity: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            } finally {
              setIsLoading(false);
            }
          })();
        },
      });
    } else {
      // アニメーションなしの場合の処理
      try {
        const campId = selectedCamp === "camp1" ? 1 : 2;
        const response = await fetch(
          `http://localhost:5000/api/students/${currentUser.id}/camp`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              camp_id: campId,
            }),
          }
        );

        if (response.ok) {
          const updatedUser = { ...currentUser, camp_id: campId };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          navigate("/create");
        } else {
          const errorData = await response.json();
          alert(
            "陣営選択に失敗しました: " + (errorData.error || "不明なエラー")
          );
        }
      } catch (error) {
        console.error("陣営選択エラー:", error);
        alert("通信エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // テーマが読み込まれていない場合のローディング表示
  if (!theme) {
    return <Loading />;
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <h1 className={styles.title}>Select Camp</h1>
      {theme && <h2 className={styles.themeTitle}>{theme.title}</h2>}
      <div className={styles.campSelect}>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp1" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp1")}
        >
          <span>{theme.team1}</span>
        </button>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp2" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp2")}
        >
          <span>{theme.team2}</span>
        </button>
      </div>
      <button
        ref={nextBtnRef}
        className={styles.next}
        type="button"
        onClick={handleNext}
        disabled={isLoading}
      >
        {isLoading ? "Next..." : "Next"}
      </button>
    </div>
  );
};

export default CampSelect;
