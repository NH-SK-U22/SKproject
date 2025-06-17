// react
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// css
import styles from "./CampSelect.module.css";

const CampSelect = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("student");

  const handleSelect = (type: string) => {
    setUserType(type);
  };

  const handleNext = () => {
    navigate("/dashboard");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Camp</h1>
      <div className={styles.campSelect}>
        <button
          className={`${styles.usertypeSelectBtn} ${
            userType === "student" ? styles.active : ""
          }`}
          onClick={() => handleSelect("student")}
        >
          <span>陣営1</span>
        </button>
        <button
          className={`${styles.usertypeSelectBtn} ${
            userType === "teacher" ? styles.active : ""
          }`}
          onClick={() => handleSelect("teacher")}
        >
          <span>陣営2</span>
        </button>
      </div>
      <button className={styles.next} type="button" onClick={handleNext}>
        Next
      </button>
    </div>
  );
};

export default CampSelect;
