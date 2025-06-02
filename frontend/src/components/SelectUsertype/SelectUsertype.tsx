// react
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// assets
import studentImg from "../../assets/student.png";
import teacherImg from "../../assets/teacher.png";

// css
import styles from "./SelectUsertype.module.css";

const SelectUser = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("student");

  const handleSelect = (type: string) => {
    setUserType(type);
  };

  const handleNext = () => {
    navigate(`/login?userType=${userType}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select User Type</h1>
      <div className={styles.usertypeSelect}>
        <button
          className={`${styles.usertypeSelectBtn} ${
            userType === "student" ? styles.active : ""
          }`}
          onClick={() => handleSelect("student")}
        >
          <img src={studentImg} alt="student" />
          <span>Student</span>
        </button>
        <button
          className={`${styles.usertypeSelectBtn} ${
            userType === "teacher" ? styles.active : ""
          }`}
          onClick={() => handleSelect("teacher")}
        >
          <img src={teacherImg} alt="teacher" />
          <span>Teacher</span>
        </button>
      </div>
      <button className={styles.next} type="button" onClick={handleNext}>
        Next
      </button>
    </div>
  );
};

export default SelectUser;
