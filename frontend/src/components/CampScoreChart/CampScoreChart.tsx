import React, { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import styles from "./CampScoreChart.module.css";
import { useDebateTheme } from "../../context/DebateThemeContext";

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

type CSSVarStyle = React.CSSProperties & {
  [key: string]: string | number | undefined;
  ["--ink-color"]?: string;
  ["--size"]?: string;
  ["--length"]?: string;
  ["--offset"]?: string;
  ["--camp1-color"]?: string;
  ["--camp2-color"]?: string;
};

const CampScoreChart: React.FC<CampScoreChartProps> = ({
  scores,
  theme_id,
}) => {
  const { theme } = useDebateTheme();
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
  const chartRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatScore = (value: number): string => {
    const rounded = Math.round(value);
    if (rounded < 0) return `\u2212${Math.abs(rounded)}`;
    return String(rounded);
  };

  const leftFieldDots = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, index) => ({
        id: `lf-${index}`,
        xPercent: Math.random() * 100,
        yPercent: Math.random() * 100,
        sizePx: 8 + Math.random() * 18,
        opacity: 0.35 + Math.random() * 0.35,
      })),
    []
  );

  const rightFieldDots = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, index) => ({
        id: `rf-${index}`,
        xPercent: Math.random() * 100,
        yPercent: Math.random() * 100,
        sizePx: 8 + Math.random() * 18,
        opacity: 0.35 + Math.random() * 0.35,
      })),
    []
  );

  // 2つの陣営を想定
  const camp1 = scores[0] || { camp_id: 1, camp_name: "陣営1", score: 0 };
  const camp2 = scores[1] || { camp_id: 2, camp_name: "陣営2", score: 0 };
  // 表示名は topic 設定優先
  const camp1DisplayName = theme?.team1 || camp1.camp_name;
  const camp2DisplayName = theme?.team2 || camp2.camp_name;

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
    // パーセンテージ計算
    const raw1 = Number.isFinite(camp1.score) ? camp1.score : 0;
    const raw2 = Number.isFinite(camp2.score) ? camp2.score : 0;
    // 負分も総得点に含める
    const totalScore = Math.abs(raw1) + Math.abs(raw2);
    // 総得点が0の場合、原始得点で割合を計算
    const s1 = totalScore === 0 ? raw1 : Math.abs(raw1);
    const s2 = totalScore === 0 ? raw2 : Math.abs(raw2);

    if (totalScore === 0) {
      if (raw1 === raw2) {
        return {
          camp1Percentage: 50,
          camp2Percentage: 50,
          camp1RealPercentage: 50,
          camp2RealPercentage: 50,
        };
      }
      const leftWins = raw1 > raw2; // より大きい(マイナスが小さい/0が大きい)側が100%
      return {
        camp1Percentage: leftWins ? 100 : 0,
        camp2Percentage: leftWins ? 0 : 100,
        camp1RealPercentage: leftWins ? 100 : 0,
        camp2RealPercentage: leftWins ? 0 : 100,
      };
    }

    const camp1Real = (s1 / totalScore) * 100;
    const camp2Real = (s2 / totalScore) * 100;

    return {
      // 進捗バーの幅は実際の割合と完全一致させる
      camp1Percentage: camp1Real,
      camp2Percentage: camp2Real,
      camp1RealPercentage: camp1Real,
      camp2RealPercentage: camp2Real,
    };
  }, [camp1.score, camp2.score]);

  const isLeftFull = camp1Percentage >= 99.999;
  const isRightFull = camp2Percentage >= 99.999;

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
      // 進捗バー背景の灰色を隠す
      gsap.set(progressBarRef.current, { background: "transparent" });

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

      // 進捗状況アニメーション：高分側から開始
      const s1 = Math.max(0, camp1.score); // 負分を0として扱う
      const s2 = Math.max(0, camp2.score);
      const isRightHigher = s2 > s1;

      if (isRightHigher) {
        // 右側が高い場合は右から左へ
        tl.set(rightProgressRef.current, { width: "100%" }) // 右端から開始
          .set(leftProgressRef.current, { width: "0%" }) // 左は0から
          .to(
            rightProgressRef.current,
            {
              width: `${camp2Percentage}%`,
              opacity: 1,
              duration: 2.0,
              ease: "power3.out",
            },
            "-=0.4"
          )
          .to(
            leftProgressRef.current,
            {
              width: `${camp1Percentage}%`,
              opacity: 1,
              duration: 2.0,
              ease: "power3.out",
            },
            "-=1.8"
          );
      } else {
        // 左側が高い場合は左から右へ
        tl.set(leftProgressRef.current, { width: "0%" }) // 左は0から
          .set(rightProgressRef.current, { width: "0%" }) // 右も0から
          .to(
            leftProgressRef.current,
            {
              width: `${camp1Percentage}%`,
              opacity: 1,
              duration: 2.0,
              ease: "power3.out",
            },
            "-=0.4"
          )
          .to(
            rightProgressRef.current,
            {
              width: `${camp2Percentage}%`,
              opacity: 1,
              duration: 2.0,
              ease: "power3.out",
            },
            "-=1.8"
          );
      }

      // フィールドインクドット（左右半分）をふわっと表示
      const leftDots = chartRef.current?.querySelectorAll(
        `.${styles.inkFieldLeft} .${styles.inkDot}`
      );
      const rightDots = chartRef.current?.querySelectorAll(
        `.${styles.inkFieldRight} .${styles.inkDot}`
      );

      if (leftDots && leftDots.length > 0) {
        tl.fromTo(
          leftDots,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(2)",
            stagger: { each: 0.02, from: "random" },
          }
        );
      }
      if (rightDots && rightDots.length > 0) {
        tl.fromTo(
          rightDots,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(2)",
            stagger: { each: 0.02, from: "random" },
          }
        );
      }

      // 数字計算アニメーション
      const camp1ScoreObj = { value: 0 };
      const camp2ScoreObj = { value: 0 };
      const camp1PercentageObj = { value: 0 };
      const camp2PercentageObj = { value: 0 };

      // 点数アニメーション
      gsap.set([leftScoreRef.current, rightScoreRef.current], {
        opacity: 0,
        scale: 0.3,
        y: -20,
      });

      tl.to(
        camp1ScoreObj,
        {
          value: camp1.score,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (leftScoreRef.current) {
              leftScoreRef.current.textContent = formatScore(
                camp1ScoreObj.value
              );
            }
          },
        },
        "-=1.8"
      )
        .to(
          leftScoreRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "<"
        )
        .to(
          camp2ScoreObj,
          {
            value: camp2.score,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
              if (rightScoreRef.current) {
                rightScoreRef.current.textContent = formatScore(
                  camp2ScoreObj.value
                );
              }
            },
          },
          "-=1.5"
        )
        .to(
          rightScoreRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "<"
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
    <div ref={chartRef} className={styles.chartContainer}>
      {/* 画面左半 - 静止インクドット */}
      <div
        className={`${styles.inkField} ${styles.inkFieldLeft}`}
        style={{ ["--ink-color"]: camp1Color } as CSSVarStyle}
        aria-hidden
      >
        {leftFieldDots.map((d) => (
          <span
            key={d.id}
            className={styles.inkDot}
            style={
              {
                left: `${d.xPercent}%`,
                top: `${d.yPercent}%`,
                ["--size"]: `${d.sizePx}px`,
                opacity: d.opacity,
              } as CSSVarStyle
            }
          />
        ))}
      </div>
      {/* 画面右半 - 静止インクドット */}
      <div
        className={`${styles.inkField} ${styles.inkFieldRight}`}
        style={{ ["--ink-color"]: camp2Color } as CSSVarStyle}
        aria-hidden
      >
        {rightFieldDots.map((d) => (
          <span
            key={d.id}
            className={styles.inkDot}
            style={
              {
                left: `${d.xPercent}%`,
                top: `${d.yPercent}%`,
                ["--size"]: `${d.sizePx}px`,
                opacity: d.opacity,
              } as CSSVarStyle
            }
          />
        ))}
      </div>
      <div className={styles.scoreBar}>
        <div ref={leftCampRef} className={styles.leftCamp}>
          <div
            className={styles.campName}
            style={{
              color: "#ffffff",
              textShadow: `0 2px 4px rgba(0,0,0,0.55), 0 0 8px ${camp1TextColor}, 0 0 16px ${camp1TextColor}, 0 0 28px ${camp1TextColor}`,
              filter: "none",
            }}
          >
            {camp1DisplayName}
          </div>
          <div
            ref={leftScoreRef}
            className={styles.scoreValue}
            style={{
              color: "#ffffff",
              textShadow: `0 2px 4px rgba(0,0,0,0.6),
                  0 0 8px ${camp1TextColor},
                  0 0 16px ${camp1TextColor},
                  0 0 24px ${camp1TextColor}`,
              filter: "none",
            }}
          >
            {formatScore(camp1.score)}
          </div>
        </div>

        <div
          className={styles.progressContainer}
          style={
            {
              "--camp1-color": camp1Color,
              "--camp2-color": camp2Color,
            } as React.CSSProperties & {
              "--camp1-color": string;
              "--camp2-color": string;
            }
          }
        >
          <div className={styles.progressBar} ref={progressBarRef}>
            <div
              ref={leftProgressRef}
              className={styles.leftProgress}
              style={
                {
                  width: `${camp1Percentage}%`,
                  ["--ink-color"]: camp1Color,
                  borderRadius: isLeftFull ? "9999px" : undefined,
                } as CSSVarStyle
              }
            >
              {/* field ink moved to screen-level; no bar-bound ink here */}
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
                    textShadow: `0 0 8px rgba(160,160,160,0.9), 0 0 16px rgba(160,160,160,0.7)`,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    background: "transparent",
                    padding: "0",
                    borderRadius: "0",
                    "--camp1-color": camp1TextColor,
                  } as React.CSSProperties & {
                    "--camp1-color": string;
                    WebkitTextStroke: string;
                  }
                }
              >
                {Math.round(camp1RealPercentage)}%
              </span>
            </div>
            <div
              ref={rightProgressRef}
              className={styles.rightProgress}
              style={
                {
                  width: `${camp2Percentage}%`,
                  ["--ink-color"]: camp2Color,
                  borderRadius: isRightFull ? "9999px" : undefined,
                } as CSSVarStyle
              }
            >
              {/* field ink moved to screen-level; no bar-bound ink here */}
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
                    textShadow: `0 0 8px rgba(160,160,160,0.9), 0 0 16px rgba(160,160,160,0.7)`,
                    minWidth: "auto",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    background: "transparent",
                    padding: "0",
                    borderRadius: "0",
                    "--camp2-color": camp2TextColor,
                  } as React.CSSProperties & {
                    "--camp2-color": string;
                    WebkitTextStroke: string;
                  }
                }
              >
                {Math.round(camp2RealPercentage)}%
              </span>
            </div>
          </div>
        </div>

        <div ref={rightCampRef} className={styles.rightCamp}>
          <div
            className={styles.campName}
            style={{
              color: "#ffffff",
              textShadow: `0 2px 4px rgba(0,0,0,0.55), 0 0 8px ${camp2TextColor}, 0 0 16px ${camp2TextColor}, 0 0 28px ${camp2TextColor}`,
              filter: "none",
            }}
          >
            {camp2DisplayName}
          </div>
          <div
            ref={rightScoreRef}
            className={styles.scoreValue}
            style={{
              color: "#ffffff",
              textShadow: `0 2px 4px rgba(0,0,0,0.6),
                  0 0 8px ${camp2TextColor},
                  0 0 16px ${camp2TextColor},
                  0 0 24px ${camp2TextColor}`,
              filter: "none",
            }}
          >
            {formatScore(camp2.score)}
          </div>
        </div>
      </div>
      {/* Gooey filter for ink blending */}
      <svg className={styles.hiddenSvg} width="0" height="0" aria-hidden>
        <defs>
          <filter id="goo-ink">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -5"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default CampScoreChart;
