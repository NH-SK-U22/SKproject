import React, { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import styles from "./CampScoreChart.module.css";

interface CampScore {
  camp_id: number;
  camp_name: string;
  score: number;
}

interface CampScoreChartProps {
  scores: CampScore[];
  theme_id: number;
}

interface ColorSetResponse {
  camp_type: number;
  colors: string[];
}

interface ThemeColorResponse {
  group_number: number;
  colorsets: ColorSetResponse[];
}

const CampScoreChart: React.FC<CampScoreChartProps> = ({
  scores,
  theme_id,
}) => {
  const [camp1Color, setCamp1Color] = useState<string>("#c76bff");
  const [camp2Color, setCamp2Color] = useState<string>("#ffc472");
  // 陣営の文字色用
  const [camp1TextColor, setCamp1TextColor] = useState<string>("#8b5cf6");
  const [camp2TextColor, setCamp2TextColor] = useState<string>("#f59e0b");

  // GSAP アニメーション
  const leftProgressRef = useRef<HTMLDivElement>(null);
  const rightProgressRef = useRef<HTMLDivElement>(null);
  const leftScoreRef = useRef<HTMLDivElement>(null);
  const rightScoreRef = useRef<HTMLDivElement>(null);
  const leftPercentageRef = useRef<HTMLSpanElement>(null);
  const rightPercentageRef = useRef<HTMLSpanElement>(null);
  const leftCampRef = useRef<HTMLDivElement>(null);
  const rightCampRef = useRef<HTMLDivElement>(null);
  const hasChartAnimated = useRef(false); // チャートの重複アニメーション防止

  // 2つの陣営を想定
  const camp1 = scores[0] || { camp_id: 1, camp_name: "陣営1", score: 0 };
  const camp2 = scores[1] || { camp_id: 2, camp_name: "陣営2", score: 0 };

  // テーマのカラーセットを取得
  useEffect(() => {
    const fetchColorSets = async () => {
      try {
        console.log("Fetching colors for camps:", {
          camp1_id: camp1.camp_id,
          camp2_id: camp2.camp_id,
          theme_id: theme_id,
        });

        const response = await fetch(
          `http://localhost:5000/api/colorsets/theme/${theme_id}`
        );
        if (response.ok) {
          const data: ThemeColorResponse = await response.json();

          if (data.colorsets && data.colorsets.length > 0) {
            // 陣営1のカラーセット（実際のcamp_idを使用）
            const camp1Colorset = data.colorsets.find(
              (colorset) => colorset.camp_type === camp1.camp_id
            );
            // 陣営2のカラーセット（実際のcamp_idを使用）
            const camp2Colorset = data.colorsets.find(
              (colorset) => colorset.camp_type === camp2.camp_id
            );

            console.log("Found colorsets:", {
              camp1Colorset: camp1Colorset,
              camp2Colorset: camp2Colorset,
            });

            if (camp1Colorset && camp1Colorset.colors.length >= 5) {
              // 5番目の色（インデックス4）をバーとテキスト両方に使用
              const camp1MainColor = camp1Colorset.colors[4];
              setCamp1Color(camp1MainColor);
              setCamp1TextColor(camp1MainColor);
              console.log("Set camp1 colors:", {
                main: camp1MainColor,
                text: camp1MainColor,
              });
            }

            if (camp2Colorset && camp2Colorset.colors.length >= 5) {
              // 5番目の色（インデックス4）をバーとテキスト両方に使用
              const camp2MainColor = camp2Colorset.colors[4];
              setCamp2Color(camp2MainColor);
              setCamp2TextColor(camp2MainColor);
              console.log("Set camp2 colors:", {
                main: camp2MainColor,
                text: camp2MainColor,
              });
            }
          }
        } else {
          console.error("カラーセットのフェッチに失敗");
        }
      } catch (error) {
        console.error("カラーセットの取得エラー:", error);
      }
    };

    if (theme_id && camp1.camp_id && camp2.camp_id) {
      fetchColorSets();
    }
  }, [theme_id, camp1.camp_id, camp2.camp_id]);

  // 各陣営の割合を計算
  const {
    camp1Percentage,
    camp2Percentage,
    camp1RealPercentage,
    camp2RealPercentage,
  } = useMemo(() => {
    const totalScore = Math.abs(camp1.score) + Math.abs(camp2.score);
    if (totalScore === 0) {
      return {
        camp1Percentage: 50,
        camp2Percentage: 50,
        camp1RealPercentage: 50,
        camp2RealPercentage: 50,
      };
    }

    const camp1Ratio = Math.abs(camp1.score) / totalScore;
    const camp2Ratio = Math.abs(camp2.score) / totalScore;

    // 実際の割合
    const camp1Real = camp1Ratio * 100;
    const camp2Real = camp2Ratio * 100;

    // 表示の割合
    const minDisplayPercentage = 8;
    let camp1Percent = camp1Real;
    let camp2Percent = camp2Real;

    // いずれかの陣営の割合が最小表示割合未満の場合、調整を行います。
    if (camp1Percent < minDisplayPercentage && camp1Percent > 0) {
      camp1Percent = minDisplayPercentage;
      camp2Percent = 100 - minDisplayPercentage;
    } else if (camp2Percent < minDisplayPercentage && camp2Percent > 0) {
      camp2Percent = minDisplayPercentage;
      camp1Percent = 100 - minDisplayPercentage;
    }

    return {
      camp1Percentage: camp1Percent,
      camp2Percentage: camp2Percent,
      camp1RealPercentage: camp1Real,
      camp2RealPercentage: camp2Real,
    };
  }, [camp1.score, camp2.score]);

  // GSAP アニメーション
  useEffect(() => {
    if (
      camp1Color &&
      camp2Color &&
      camp1.score !== undefined &&
      camp2.score !== undefined &&
      !hasChartAnimated.current
    ) {
      hasChartAnimated.current = true;
      // 初始狀態設定
      gsap.set([leftProgressRef.current, rightProgressRef.current], {
        width: "0%",
        opacity: 0.8,
      });

      gsap.set([leftCampRef.current, rightCampRef.current], {
        opacity: 0,
        scale: 0.6,
        y: 20,
      });

      // アニメーション時間軸
      const tl = gsap.timeline();

      // 陣営名稱と得点のアニメーション
      tl.to([leftCampRef.current, rightCampRef.current], {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.3)",
        stagger: 0.15,
      });

      // 進捗状況アニメーション
      tl.to(
        leftProgressRef.current,
        {
          width: `${camp1Percentage}%`,
          opacity: 1,
          duration: 2.0,
          ease: "power3.out",
        },
        "-=0.4"
      ).to(
        rightProgressRef.current,
        {
          width: `${camp2Percentage}%`,
          opacity: 1,
          duration: 2.0,
          ease: "power3.out",
        },
        "-=1.8"
      );

      // 数字計算アニメーション
      const camp1ScoreObj = { value: 0 };
      const camp2ScoreObj = { value: 0 };
      const camp1PercentageObj = { value: 0 };
      const camp2PercentageObj = { value: 0 };

      // 点数アニメーション
      tl.to(
        camp1ScoreObj,
        {
          value: camp1.score,
          duration: 1.8,
          ease: "power2.inOut",
          onUpdate: () => {
            if (leftScoreRef.current) {
              leftScoreRef.current.textContent = Math.round(
                camp1ScoreObj.value
              ).toString();
            }
          },
        },
        "-=1.8"
      ).to(
        camp2ScoreObj,
        {
          value: camp2.score,
          duration: 1.8,
          ease: "power2.inOut",
          onUpdate: () => {
            if (rightScoreRef.current) {
              rightScoreRef.current.textContent = Math.round(
                camp2ScoreObj.value
              ).toString();
            }
          },
        },
        "-=1.8"
      );

      // パーセンテージアニメーション
      tl.to(
        camp1PercentageObj,
        {
          value: camp1RealPercentage,
          duration: 1.5,
          ease: "power3.out",
          onUpdate: () => {
            if (leftPercentageRef.current) {
              leftPercentageRef.current.textContent = `${Math.round(
                camp1PercentageObj.value
              )}%`;
            }
          },
        },
        "-=1.0"
      ).to(
        camp2PercentageObj,
        {
          value: camp2RealPercentage,
          duration: 1.5,
          ease: "power3.out",
          onUpdate: () => {
            if (rightPercentageRef.current) {
              rightPercentageRef.current.textContent = `${Math.round(
                camp2PercentageObj.value
              )}%`;
            }
          },
        },
        "-=1.5"
      );
    }
  }, [
    camp1Color,
    camp2Color,
    camp1.score,
    camp2.score,
    camp1Percentage,
    camp2Percentage,
    camp1RealPercentage,
    camp2RealPercentage,
  ]);

  // 重置アニメーション狀態（データが変更された場合）
  useEffect(() => {
    hasChartAnimated.current = false;
  }, [camp1.score, camp2.score]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.scoreBar}>
        <div ref={leftCampRef} className={styles.leftCamp}>
          <div className={styles.campName} style={{ color: camp1TextColor }}>
            {camp1.camp_name}
          </div>
          <div
            ref={leftScoreRef}
            className={styles.scoreValue}
            style={{
              color: camp1TextColor,
            }}
          >
            {camp1.score}
          </div>
        </div>

        <div
          className={styles.progressContainer}
          style={
            {
              "--camp1-color": camp1TextColor,
              "--camp2-color": camp2TextColor,
            } as React.CSSProperties & {
              "--camp1-color": string;
              "--camp2-color": string;
            }
          }
        >
          <div className={styles.progressBar}>
            <div
              ref={leftProgressRef}
              className={styles.leftProgress}
              style={{
                width: `${camp1Percentage}%`,
                background: camp1Color,
              }}
            >
              <span
                ref={leftPercentageRef}
                className={styles.leftPercentage}
                style={
                  {
                    left: "0%",
                    top: "-40px",
                    fontSize: camp1RealPercentage < 15 ? "1.4rem" : "2.2rem",
                    zIndex: 100,
                    position: "absolute",
                    transform: "translateX(0%) translateY(-50%)",
                    color: "#ffffff",
                    textShadow:
                      camp1RealPercentage < 15
                        ? `0 2px 4px rgba(0,0,0,0.8), 0 0 15px ${camp1TextColor}`
                        : `0 2px 4px rgba(0,0,0,0.6), 0 0 20px ${camp1TextColor}`,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    background: "transparent",
                    padding: "0",
                    borderRadius: "0",
                    "--camp1-color": camp1TextColor,
                  } as React.CSSProperties & { "--camp1-color": string }
                }
              >
                {Math.round(camp1RealPercentage)}%
              </span>
            </div>
            <div
              ref={rightProgressRef}
              className={styles.rightProgress}
              style={{
                width: `${camp2Percentage}%`,
                background: camp2Color,
              }}
            >
              <span
                ref={rightPercentageRef}
                className={styles.rightPercentage}
                style={
                  {
                    left: "100%",
                    top: "-40px",
                    fontSize: camp2RealPercentage < 15 ? "1.4rem" : "2.2rem",
                    zIndex: 100,
                    position: "absolute",
                    transform: "translateX(-100%) translateY(-50%)",
                    color: "#ffffff",
                    textShadow:
                      camp2RealPercentage < 15
                        ? `0 2px 4px rgba(0,0,0,0.8), 0 0 15px ${camp2TextColor}`
                        : `0 2px 4px rgba(0,0,0,0.6), 0 0 20px ${camp2TextColor}`,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    background: "transparent",
                    padding: "0",
                    borderRadius: "0",
                    "--camp2-color": camp2TextColor,
                  } as React.CSSProperties & { "--camp2-color": string }
                }
              >
                {Math.round(camp2RealPercentage)}%
              </span>
            </div>
          </div>
        </div>

        <div ref={rightCampRef} className={styles.rightCamp}>
          <div className={styles.campName} style={{ color: camp2TextColor }}>
            {camp2.camp_name}
          </div>
          <div
            ref={rightScoreRef}
            className={styles.scoreValue}
            style={{
              color: camp2TextColor,
            }}
          >
            {camp2.score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampScoreChart;
