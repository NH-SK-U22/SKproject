import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TopicDelete from '../TopicDelete/TopicDelete';
import TopicForm from '../TopicForm/TopicForm';
import { getCurrentUser } from '../../utils/auth';

interface Topic {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  team1: string;
  team2: string;
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
        const res = await fetch(`http://localhost:5000/api/all_debate?school_id=${user.school_id}`);
        if (!res.ok) throw new Error('テーマ取得失敗');
        const data = await res.json();
        const topicsFromApi: Topic[] = data.map((item: any) => ({
          id: item.theme_id,
          title: item.title,
          description: item.description,
          startDate: new Date(item.start_date),
          endDate: new Date(item.end_date),
          team1: item.team1,
          team2: item.team2,
        }));
        setTopics(topicsFromApi);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTopics();
  }, []);

  const handleAddTopic = (newTopic: Omit<Topic, 'id'>) => {
    const topicWithId = {
      ...newTopic,
      id: Date.now(),
    };
    setTopics([topicWithId, ...topics]);
  };

  const handleDeleteTopic = (topicId: number) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
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
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>{topic.title}</TableCell>
                  <TableCell>{topic.description}</TableCell>
                  <TableCell>
                    {topic.startDate.toLocaleDateString('ja-JP')} 〜 {topic.endDate.toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {topic.team1} vs {topic.team2}
                  </TableCell>
                  <TableCell align="right">
                    <TopicDelete topicId={topic.id} onDelete={handleDeleteTopic} />
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