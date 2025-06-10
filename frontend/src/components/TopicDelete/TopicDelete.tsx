import { IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface TopicDeleteProps {
  topicId: number;
  onDelete: (topicId: number) => void;
}

const TopicDelete = ({ topicId, onDelete }: TopicDeleteProps) => {
  const handleDelete = () => {
    onDelete(topicId);
  };

  return (
    <Tooltip title="削除">
      <IconButton size="small" color="error" onClick={handleDelete}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );
};

export default TopicDelete;