// src/utils/rankUtils.ts
export interface RankInfo {
  rankName:      string;      // ランク名
  rankImage:     string;      // ランク画像のパス
  nextThreshold: number;      // 次のランク到達に必要な合計ポイント
}

// sumPoint を受け取って RankInfo を返す関数
export function computeRank(sumPoint: number): RankInfo {
  if (sumPoint >= 2000) {
    return {
      rankName:      "ダイヤモンド",
      rankImage:     "../../public/images/diamond.png",
      nextThreshold: Infinity    // もう上のランクがなければ Infinity
    };
  }
  if (sumPoint >= 1000) {
    return {
      rankName:      "ゴールド",
      rankImage:     "../../public/images/1st.png",
      nextThreshold: 2000
    };
  }
  if (sumPoint >= 500) {
    return {
      rankName:      "シルバー",
      rankImage:     "../../public/images/2st.png",
      nextThreshold: 1000
    };
  }
  return {
    rankName:      "ブロンズ",
    rankImage:     "../../public/images/3st.png",
    nextThreshold: 500
  };
}
