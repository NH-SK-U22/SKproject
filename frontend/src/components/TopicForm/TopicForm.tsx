import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale/ja';

interface Topic {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  team1: string;
  team2: string;
}

interface TopicFormProps {
  onAddTopic: (topic: Omit<Topic, 'id'>) => void;
}

const TopicForm = ({ onAddTopic }: TopicFormProps) => {
  const [topic, setTopic] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    team1: '',
    team2: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTopic(topic);
    setTopic({
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      team1: '',
      team2: '',
    });
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
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="開始日"
                value={topic.startDate}
                onChange={(newValue) => setTopic({ ...topic, startDate: newValue || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <DatePicker
                label="終了日"
                value={topic.endDate}
                onChange={(newValue) => setTopic({ ...topic, endDate: newValue || new Date() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
          sx={{ mt: 2 }}
        >
          テーマを追加
        </Button>
      </Box>
    </Paper>
  );
};

export default TopicForm;