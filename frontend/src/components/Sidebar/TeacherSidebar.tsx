// react
import React from "react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// css
import styles from "./Sidebar.module.css";

// icons
import { FaRegSmile, FaRegBell, FaUserCircle } from "react-icons/fa";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdCreate } from "react-icons/md";
import { ImCoinYen } from "react-icons/im";
import { PiStudentFill } from "react-icons/pi";
import { IoLogOutOutline } from "react-icons/io5";
import Notification from "../Notification/Notification";
import { useDebateTheme } from "../../context/DebateThemeContext";
import { logout } from "../../utils/auth";

const TeacherSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { theme } = useDebateTheme();

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const navigate = useNavigate();

  const handleTopicSet = () => {
    navigate("/topicset");
  };

  const handleTeacherReward = () => {
    navigate("/Reward");
  };

  const handleStudentList = () => {
    navigate("/StudentList");
  };

  const handleDebateClick = () => {
    if (!theme) {
      navigate("/home");
      return;
    }
    const now = new Date();
    const start = new Date(theme.start_date);
    const end = new Date(theme.end_date);
    if (now >= start && now <= end) {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/usertypeSelect");
  };

  return (
    <div className={styles.sidebarContainer}>
      <div
        ref={sidebarRef}
        className={`${styles.sidebar} ${isHovered ? styles.expanded : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.logo}>
          <FaRegSmile />
          <span className={styles.logoText}>ロジスタ</span>
        </div>
        <div className={styles.menu}>
          <div className={styles.menuItem} onClick={handleDebateClick}>
            <LuLayoutDashboard />
            <span className={styles.menuText}>討論広場</span>
          </div>
          <div className={styles.menuItem} onClick={toggleNotifications}>
            <FaRegBell />
            <span className={styles.menuText}>通知</span>
          </div>
          <div className={styles.menuItem} onClick={handleTopicSet}>
            <MdCreate />
            <span className={styles.menuText}>トピックセット</span>
          </div>
          <div className={styles.menuItem} onClick={handleTeacherReward}>
            <ImCoinYen />
            <span className={styles.menuText}>報酬</span>
          </div>
          <div className={styles.menuItem} onClick={handleStudentList}>
            <PiStudentFill />
            <span className={styles.menuText}>生徒一覧</span>
          </div>
          <div className={styles.menuItem} onClick={handleLogout}>
            <IoLogOutOutline />
            <span className={styles.menuText}>ログアウト</span>
          </div>
        </div>
        <div className={`${styles.menuItem} ${styles.profileItem}`}>
          <FaUserCircle />
          <span className={styles.menuText}>プロフィール</span>
        </div>
      </div>
      {showNotifications && (
        <Notification
          isSidebarExpanded={isHovered}
          onClose={handleCloseNotifications}
        />
      )}
    </div>
  );
};

export default TeacherSidebar;