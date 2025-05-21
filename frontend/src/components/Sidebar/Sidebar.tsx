import { FaRegSmile, FaRegBell, FaUserCircle } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdCreate } from "react-icons/md";
import { ImCoinYen } from "react-icons/im";
import { PiRanking } from "react-icons/pi";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <FaRegSmile />
        <span className={styles.logoText}>Logo</span>
      </div>
      <div className={styles.menu}>
        <div className={styles.menuItem}>
          <LuLayoutDashboard />
          <span className={styles.menuText}>討論広場</span>
        </div>
        <div className={styles.menuItem}>
          <FaRegBell />
          <span className={styles.menuText}>通知</span>
        </div>
        <div className={styles.menuItem}>
          <MdCreate />
          <span className={styles.menuText}>作成</span>
        </div>
        <div className={styles.menuItem}>
          <ImCoinYen />
          <span className={styles.menuText}>報酬</span>
        </div>
        <div className={styles.menuItem}>
          <PiRanking />
          <span className={styles.menuText}>ランク</span>
        </div>
      </div>
      <div className={`${styles.menuItem} ${styles.profileItem}`}>
        <FaUserCircle />
        <span className={styles.menuText}>プロフィール</span>
      </div>
    </div>
  );
};

export default Sidebar;
