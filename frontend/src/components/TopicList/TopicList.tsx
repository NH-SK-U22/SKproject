import { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
} from "@mui/material";
import TopicDelete from "../TopicDelete/TopicDelete";
import TopicForm from "../TopicForm/TopicForm";
import { getCurrentUser } from "../../utils/auth";

interface Topic {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  team1: string;
  team2: string;
  winner?: string;
  team1_score?: number;
  team2_score?: number;
}

// 初期データ
const initialTopics: Topic[] = [];

const TopicList = () => {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);

  useEffect(() => {
    const fetchTopics = async () => {
      const user = getCurrentUser();
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/all_debate?school_id=${user.school_id}`
        );
        if (!res.ok) throw new Error("テーマ取得失敗");
        const data = await res.json();
        interface ApiTopic {
          theme_id: number;
          title: string;
          description: string;
          start_date: string;
          end_date: string;
          team1: string;
          team2: string;
          winner?: string;
          team1_score?: number;
          team2_score?: number;
        }
        const topicsFromApi: Topic[] = data.map((item: ApiTopic) => ({
          id: item.theme_id,
          title: item.title,
          description: item.description,
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date),
          team1: item.team1,
          team2: item.team2,
          winner: item.winner,
          team1_score: item.team1_score,
          team2_score: item.team2_score,
        }));
        setTopics(topicsFromApi);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTopics();
  }, []);

  const handleAddTopic = (newTopic: Omit<Topic, "id">) => {
    const topicWithId = {
      ...newTopic,
      id: Date.now(),
    };
    setTopics([topicWithId, ...topics]);
  };

  const handleDeleteTopic = (topicId: number) => {
    setTopics(topics.filter((topic) => topic.id !== topicId));
  };

  const calculateWinner = async (topicId: number) => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const response = await fetch(
        `http://localhost:5000/api/calculate_winner/${topicId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("計算勝者失敗");

      const data = await response.json();

      // ローカルの状態を更新する
      setTopics(
        topics.map((topic) =>
          topic.id === topicId
            ? {
                ...topic,
                winner: data.winner,
                team1_score: data.team1_score,
                team2_score: data.team2_score,
              }
            : topic
        )
      );

      return data;
    } catch (error) {
      console.error("勝者を計算する時にエラーが発生しました:", error);
      throw error;
    }
  };

  return (
    <>
      <TopicForm onAddTopic={handleAddTopic} />
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          設定済みテーマ一覧
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>タイトル</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>期限</TableCell>
                <TableCell>陣営</TableCell>
                <TableCell>勝者</TableCell>
                <TableCell>得点</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>{topic.title}</TableCell>
                  <TableCell>{topic.description}</TableCell>
                  <TableCell>
                    {topic.startDate.toLocaleDateString("ja-JP")} 〜{" "}
                    {topic.endDate.toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    {topic.team1} vs {topic.team2}
                  </TableCell>
                  <TableCell>{topic.winner || "-"}</TableCell>
                  <TableCell>
                    {topic.team1}: {topic.team1_score?.toFixed(2) || "0.00"} vs{" "}
                    {topic.team2}: {topic.team2_score?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => calculateWinner(topic.id)}
                      sx={{ mr: 1 }}
                    >
                      勝者を計算する
                    </Button>
                    <TopicDelete
                      topicId={topic.id}
                      onDelete={handleDeleteTopic}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default TopicList;
