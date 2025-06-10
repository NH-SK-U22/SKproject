import { useState } from 'react';
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
const initialTopics: Topic[] = [
  {
    id: 1,
    title: 'AIの教育への影響について',
    description: 'AI技術の発展が教育現場に与える影響について',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-04-30'),
    team1: '賛成派',
    team2: '反対派',
  },
  {
    id: 2,
    title: '環境問題と経済発展の両立',
    description: '持続可能な発展のための環境と経済のバランス',
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-05-31'),
    team1: '環境重視派',
    team2: '経済重視派',
  },
];

const TopicList = () => {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);

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