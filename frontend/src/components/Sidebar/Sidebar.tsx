import { useState, useRef } from 'react';
import { FaRegSmile, FaRegBell, FaUserCircle } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdCreate } from "react-icons/md";
import { ImCoinYen } from "react-icons/im";
import { PiRanking } from "react-icons/pi";
import Notification from '../Notification/Notification'; // Import Notification component
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!notificationRef.current?.contains(relatedTarget)) {
      setIsHovered(false);
      setShowNotifications(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className={styles.sidebarContainer}> {/* Use a container div */}
      <div 
        ref={sidebarRef}
        className={`${styles.sidebar} ${isHovered ? styles.expanded : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.logo}>
          <FaRegSmile />
          <span className={styles.logoText}>Logo</span>
        </div>
        <div className={styles.menu}>
          <div className={styles.menuItem}>
            <LuLayoutDashboard />
            <span className={styles.menuText}>討論広場</span>
          </div>
          <div className={styles.menuItem} onClick={toggleNotifications}> {/* Add onClick handler */}
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
      {isHovered && showNotifications && (
        <div ref={notificationRef} onMouseLeave={handleMouseLeave}>
          <Notification onMouseLeave={handleMouseLeave} />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
