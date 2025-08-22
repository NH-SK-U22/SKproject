import { useState } from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale/ja";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { getCurrentUser } from "../../utils/auth";

interface TopicFormProps {
  onAddTopic: (newTopic: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    team1: string;
    team2: string;
  }) => void;
}

const TopicForm = ({ onAddTopic }: TopicFormProps) => {
  const [topic, setTopic] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    team1: "",
    team2: "",
  });

  const user = getCurrentUser(); // ユーザー情報取得

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 期間バリデーション
    if (topic.endDate.getTime() < topic.startDate.getTime()) {
      alert("期間設定が不適切です");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...topic,
          // 日付はISO文字列で送るのが一般的
          startDate: topic.startDate.toISOString(),
          endDate: topic.endDate.toISOString(),
          school_id: user?.school_id, // school_idを追加
          // colorset_idは後端でランダム生成
        }),
      });

      if (!response.ok) {
        throw new Error("テーマ追加に失敗しました");
      }

      onAddTopic(topic);
      alert("テーマが追加されました");
      setTopic({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        team1: "",
        team2: "",
      });
    } catch {
      alert("テーマ追加に失敗しました");
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        新しい討論テーマを追加
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="テーマタイトル"
          value={topic.title}
          onChange={(e) => setTopic({ ...topic, title: e.target.value })}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="テーマの説明"
          value={topic.description}
          onChange={(e) => setTopic({ ...topic, description: e.target.value })}
          margin="normal"
          multiline
          rows={4}
          required
        />

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ flex: 1 }}>
              <DateTimePicker
                label="開始日時"
                value={topic.startDate}
                onChange={(newValue) =>
                  setTopic({ ...topic, startDate: newValue || new Date() })
                }
                slotProps={{ textField: { fullWidth: true } }}
                views={["year", "month", "day", "hours", "minutes", "seconds"]}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <DateTimePicker
                label="終了日時"
                value={topic.endDate}
                onChange={(newValue) =>
                  setTopic({ ...topic, endDate: newValue || new Date() })
                }
                slotProps={{ textField: { fullWidth: true } }}
                views={["year", "month", "day", "hours", "minutes", "seconds"]}
              />
            </Box>
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="陣営1"
            value={topic.team1}
            onChange={(e) => setTopic({ ...topic, team1: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="陣営2"
            value={topic.team2}
            onChange={(e) => setTopic({ ...topic, team2: e.target.value })}
            required
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2, backgroundColor: "#00e6b8" }}
        >
          テーマを追加
        </Button>
      </Box>
    </Paper>
  );
};

export default TopicForm;
