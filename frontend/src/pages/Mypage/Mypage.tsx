//
import React, { useEffect, useState } from "react";
import styles from "./mypage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import Progressbar from "../../components/Mypage/Progressbar";
import Popup from "../../components/Mypage/Popup";
import HoldReward from "../../components/Mypage/HoldReward";
import { computeRank } from "../../utils/rank";

type HoldReward = {
  hold_id: number;
  student_id: number;
  reward_id: number;
  is_holding: boolean;
  used_at: string | null;
  reward_content?: string;
  need_point?: number;
  need_rank?: number;
};

type RawHold = {
  hold_id: number;
  student_id: number;
  reward_id: number;
  is_holding: boolean;
  used_at: string | null;
  reward_content?: string;
  need_point?: number;
  need_rank?: number;
};

type RewardDetail = {
  reward_id: number;
  reward_content: string;
  need_point: number;
  need_rank: number;
};

type Message = {
  message_id: number;
  student_id: number;
  message_content: string;
  camp_id: number;
  sticky_id: number;
  feedback_A: number;
  feedback_B: number;
  feedback_C: number;
  created_at: string;
  student_name: string;
};

type Camp = {
  camp_id: number;
  theme_id: number;
  camp_name: string;
  is_winner: boolean;
};

type HistoryItem = {
  camp_name: string;
  message_content: string;
  created_at: string;
};

type User = {
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
};

const Mypage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [tabs, setTabs] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const URL = "http://localhost:5000";
  const [holds, setHolds] = useState<RawHold[]>([]);

  // 最新のユーザー情報を取得
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const userObj = userJson ? JSON.parse(userJson) : null;
    
    if (!userObj?.id) {
      setLoading(false);
      return;
    }

    // APIから最新のユーザー情報を取得
    fetch(`${URL}/api/students/${userObj.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("ユーザー情報の取得に失敗しました");
        return res.json() as Promise<User>;
      })
      .then((userData) => {
        setUser(userData);
        // ローカルストレージも更新
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        // API取得に失敗した場合はローカルストレージの情報を使用
        setUser(userObj);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    // ───① holds の取得──────────
    fetch(`${URL}/api/holdRewards?student_id=${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<RawHold[]>;
      })
      .then((raw) => {
        const active = raw.filter((r) => r.is_holding);
        return Promise.all(
          active.map((h) =>
            fetch(`${URL}/api/rewards/${h.reward_id}`)
              .then((r) => {
                if (!r.ok)
                  throw new Error(`Reward ${h.reward_id} fetch failed`);
                return r.json() as Promise<RewardDetail>;
              })
              .then((rew) => ({ ...h, ...rew }))
          )
        );
      })
      .then((fullHolds) => setHolds(fullHolds))
      .catch((err) => {
        console.error(err);
      });

    /// --- 履歴（付箋＋メッセージ）を取る ---
    (async () => {
      try {
        // 1) 付箋一覧
        const stickyRes = await fetch(`${URL}/api/sticky?student_id=${user.id}`);
        if (!stickyRes.ok) throw new Error("sticky取得失敗");
        const stickies = (await stickyRes.json()) as Array<{
          sticky_id: number;
          sticky_content: string;
          created_at: string;
        }>;

        // 2) 各付箋のメッセージ
        const messageNested = await Promise.all(
          stickies.map((s) =>
            fetch(`${URL}/api/message/sticky/${s.sticky_id}`).then((r) => {
              if (!r.ok) throw new Error(`message ${s.sticky_id} 取得失敗`);
              return r.json() as Promise<Message[]>;
            })
          )
        );
        const allMessages = messageNested.flat();

        // 3) 必要な陣営IDを一意化
        const messageCampIds = allMessages.map((m) => m.camp_id);
        // 付箋投稿にも current user's camp_id を含めておく
        if (user.camp_id != null) messageCampIds.push(user.camp_id);
        const uniqueCampIds = Array.from(new Set(messageCampIds));

        // 4) camp_id → camp_name マップ
        const campNameMap: Record<number, string> = {};
        await Promise.all(
          uniqueCampIds.map(async (cid) => {
            try {
              const campRes = await fetch(`${URL}/api/camps/${cid}`);
              if (!campRes.ok) throw new Error(`camp ${cid} 取得失敗`);
              const camp = (await campRes.json()) as Camp;
              campNameMap[cid] = camp.camp_name;
            } catch {
              campNameMap[cid] = `陣営 ${cid}`;
            }
          })
        );

        // 5) 付箋履歴アイテム
        const stickyItems: HistoryItem[] = stickies.map((s) => ({
          camp_name: campNameMap[user.camp_id!] || `陣営 ${user.camp_id}`,
          message_content: s.sticky_content,
          created_at: s.created_at,
        }));

        // 6) メッセージ履歴アイテム
        const messageItems: HistoryItem[] = allMessages.map((m) => ({
          camp_name: campNameMap[m.camp_id],
          message_content: m.message_content,
          created_at: m.created_at,
        }));

        // 7) マージして日付降順ソート
        const combined = [...stickyItems, ...messageItems].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setHistory(combined);
      } catch (e) {
        console.error(e);
        setHistoryError("履歴の取得に失敗しました");
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className={styles.vh}>
        <Sidebar />
        <div className={styles.container}>
          <div>読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.vh}>
        <Sidebar />
        <div className={styles.container}>
          <div>ユーザー情報が見つかりません</div>
        </div>
      </div>
    );
  }

  const userColor: string = user.user_color || '#ccc';
  const sumP = user.sum_point ?? 0;
  const { rankName, rankImage, nextThreshold } = computeRank(sumP);
  const { rankName: rankName2 } = computeRank(nextThreshold);

  return (
    <div className={styles.vh}>
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.top}>
          <div 
            className={styles.icon_circle}
            style={{ backgroundColor: userColor }}
          >
            
          </div>
          <div className={styles.status_container}>
            <div className={styles.status_left}>
              <p>あなたは</p>
              <div className={styles.rankimg}>
                <p className={styles.rank}>{rankName}ランク</p>
                {sumP}
                <img src={rankImage} alt="" width={50} />
              </div>
              <p>です</p>
            </div>
            <div className={styles.status_right}>
              <p>次の{rankName2}ランクへは</p>
              <Progressbar
                remaining={nextThreshold - sumP}
                target={nextThreshold}
              />
            </div>
            <Popup />
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab_button}${
              tabs === 0 ? ` ${styles.active}` : ""
            }`}
            onClick={() => setTabs(0)}
          >
            カード表示
          </button>
          <button
            className={`${styles.tab_button}${
              tabs === 1 ? ` ${styles.active}` : ""
            }`}
            onClick={() => setTabs(1)}
          >
            発言履歴
          </button>
        </div>

        {tabs === 0 && (
          <div id="cards" className={`${styles.tab_content} ${styles.active}`}>
            <div className={styles.bottom}>
              <div className={styles.rewardContainer}>
                {holds.map((rewa) => (
                  <HoldReward
                    key={rewa.hold_id}
                    hold_id={rewa.hold_id}
                    rewardInfo={rewa.reward_content ?? ""}
                    isHolding={rewa.is_holding}
                    onUsed={(id) => {
                      // 使用済みとする
                      setHolds((prev) => prev.filter((x) => x.hold_id !== id));
                    }}
                  />
                ))}
                {holds.length === 0 && <div>保持報酬がありません</div>}
              </div>
            </div>
          </div>
        )}

        {tabs === 1 && (
          <div
            id="history"
            className={`${styles.tab_content} ${styles.active}`}
          >
            {historyError && <div style={{ color: "red" }}>{historyError}</div>}
            <ul className={styles.history_list}>
              {history.length > 0 ? (
                history.map((h, i) => (
                  <li key={i} className={styles.history_item}>
                    <strong>{h.camp_name}:</strong> {h.message_content}
                  </li>
                ))
              ) : (
                <li className={styles.history_item}>発言がありません</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mypage;
