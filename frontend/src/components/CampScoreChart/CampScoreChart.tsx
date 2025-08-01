import React, { useState, useEffect } from "react";
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

  // 総得点を計算
  const totalScore = Math.abs(camp1.score) + Math.abs(camp2.score);

  // 各陣営の割合を計算
  const camp1Percentage =
    totalScore > 0 ? (Math.abs(camp1.score) / totalScore) * 100 : 50;
  const camp2Percentage =
    totalScore > 0 ? (Math.abs(camp2.score) / totalScore) * 100 : 50;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.scoreBar}>
        <div className={styles.leftCamp}>
          <div className={styles.campName} style={{ color: camp1TextColor }}>
            {camp1.camp_name}
          </div>
          <div
            className={styles.scoreValue}
            style={{
              color: camp1TextColor,
            }}
          >
            {camp1.score}
          </div>
        </div>

        <div className={styles.progressContainer}>
          <span className={styles.leftPercentage}>
            {Math.round(camp1Percentage)}%
          </span>
          <span className={styles.rightPercentage}>
            {Math.round(camp2Percentage)}%
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.leftProgress}
              style={{
                width: `${camp1Percentage}%`,
                background: camp1Color,
              }}
            ></div>
            <div
              className={styles.rightProgress}
              style={{
                width: `${camp2Percentage}%`,
                background: camp2Color,
              }}
            ></div>
          </div>
        </div>

        <div className={styles.rightCamp}>
          <div className={styles.campName} style={{ color: camp2TextColor }}>
            {camp2.camp_name}
          </div>
          <div
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
