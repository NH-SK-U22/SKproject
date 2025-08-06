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

  // 各陣営の割合を計算（安定化）
  const { camp1Percentage, camp2Percentage } = useMemo(() => {
    const totalScore = Math.abs(camp1.score) + Math.abs(camp2.score);
    return {
      camp1Percentage:
        totalScore > 0 ? (Math.abs(camp1.score) / totalScore) * 100 : 50,
      camp2Percentage:
        totalScore > 0 ? (Math.abs(camp2.score) / totalScore) * 100 : 50,
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
      });

      gsap.set([leftCampRef.current, rightCampRef.current], {
        opacity: 0,
        scale: 0.8,
      });

      // アニメーション時間軸
      const tl = gsap.timeline();

      // 陣営名稱と得点のアニメーション
      tl.to([leftCampRef.current, rightCampRef.current], {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.1,
      });

      // 進捗状況アニメーション
      tl.to(
        leftProgressRef.current,
        {
          width: `${camp1Percentage}%`,
          duration: 1.5,
          ease: "power2.out",
        },
        "-=0.3"
      ).to(
        rightProgressRef.current,
        {
          width: `${camp2Percentage}%`,
          duration: 1.5,
          ease: "power2.out",
        },
        "-=1.3"
      );

      // 数字計算アニメーション
      const camp1ScoreObj = { value: 0 };
      const camp2ScoreObj = { value: 0 };
      const camp1PercentageObj = { value: 0 };
      const camp2PercentageObj = { value: 0 };

      tl.to(
        camp1ScoreObj,
        {
          value: camp1.score,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            if (leftScoreRef.current) {
              leftScoreRef.current.textContent = Math.round(
                camp1ScoreObj.value
              ).toString();
            }
          },
        },
        "-=1.2"
      )
        .to(
          camp2ScoreObj,
          {
            value: camp2.score,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              if (rightScoreRef.current) {
                rightScoreRef.current.textContent = Math.round(
                  camp2ScoreObj.value
                ).toString();
              }
            },
          },
          "-=1.2"
        )
        .to(
          camp1PercentageObj,
          {
            value: camp1Percentage,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              if (leftPercentageRef.current) {
                leftPercentageRef.current.textContent = `${Math.round(
                  camp1PercentageObj.value
                )}%`;
              }
            },
          },
          "-=1.2"
        )
        .to(
          camp2PercentageObj,
          {
            value: camp2Percentage,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              if (rightPercentageRef.current) {
                rightPercentageRef.current.textContent = `${Math.round(
                  camp2PercentageObj.value
                )}%`;
              }
            },
          },
          "-=1.2"
        );
    }
  }, [
    camp1Color,
    camp2Color,
    camp1.score,
    camp2.score,
    camp1Percentage,
    camp2Percentage,
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

        <div className={styles.progressContainer}>
          <span ref={leftPercentageRef} className={styles.leftPercentage}>
            {Math.round(camp1Percentage)}%
          </span>
          <span ref={rightPercentageRef} className={styles.rightPercentage}>
            {Math.round(camp2Percentage)}%
          </span>
          <div className={styles.progressBar}>
            <div
              ref={leftProgressRef}
              className={styles.leftProgress}
              style={{
                width: `${camp1Percentage}%`,
                background: camp1Color,
              }}
            ></div>
            <div
              ref={rightProgressRef}
              className={styles.rightProgress}
              style={{
                width: `${camp2Percentage}%`,
                background: camp2Color,
              }}
            ></div>
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
