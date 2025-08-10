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
import { IoSettingsSharp } from "react-icons/io5";

// components
import Notification from "../Notification/Notification";
import { useDebateTheme } from "../../context/DebateThemeContext";

// utils
import { getCurrentUser } from "../../utils/auth";

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  const { theme } = useDebateTheme();

  const handleDebateClick = () => {
    if (!theme) {
      navigate("/home");
      return;
    }
    const now = new Date();
    const start = new Date(theme.start_date);
    const end = new Date(theme.end_date);
    if (now >= start && now <= end) {
      // 現在のユーザーが陣営を選択しているかどうかを確認する
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.camp_id === null) {
        // 陣営を選択していない場合、まずcampselectページに移動
        navigate("/campselect");
      } else {
        // 陣営を選択した場合、dashboardページに移動
        navigate("/dashboard");
      }
    } else {
      navigate("/home");
    }
  };

  const handleCreate = () => {
    navigate("/create");
  };

  const handleSetting = () => {
    navigate("/setting");
  };

  const handleReward = () => {
    navigate("/Reward");
  };

  const handleMypage = () => {
    navigate("/mypage");
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
          <span className={styles.logoText}>Logo</span>
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
          <div className={styles.menuItem} onClick={handleCreate}>
            <MdCreate />
            <span className={styles.menuText}>作成</span>
          </div>
          <div className={styles.menuItem} onClick={handleReward}>
            <ImCoinYen />
            <span className={styles.menuText}>報酬</span>
          </div>

          <div className={styles.menuItem} onClick={handleSetting}>
            <IoSettingsSharp />
            <span className={styles.menuText}>設定</span>
          </div>
        </div>
        <div
          className={`${styles.menuItem} ${styles.profileItem}`}
          onClick={handleMypage}
        >
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

export default Sidebar;
