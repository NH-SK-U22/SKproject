// react
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// css
import styles from "./CampSelect.module.css";

const CampSelect = () => {
  const navigate = useNavigate();
  const [selectedCamp, setSelectedCamp] = useState("camp1");

  const handleSelect = (camp: string) => {
    setSelectedCamp(camp);
  };

  const handleNext = () => {
    navigate(`/create?camp=${selectedCamp}`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Camp</h1>
      <div className={styles.campSelect}>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp1" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp1")}
        >
          <span>陣営1</span>
        </button>
        <button
          className={`${styles.campSelectBtn} ${
            selectedCamp === "camp2" ? styles.active : ""
          }`}
          onClick={() => handleSelect("camp2")}
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
