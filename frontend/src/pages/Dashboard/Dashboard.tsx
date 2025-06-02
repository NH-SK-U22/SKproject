import Sidebar from '../../components/Sidebar/Sidebar';
import { Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative'}}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, ml: '70px' }}>
        {/* この構造を基本にしてほしい。 */}
      </Box>
    </Box>
  );
};

export default Dashboard;