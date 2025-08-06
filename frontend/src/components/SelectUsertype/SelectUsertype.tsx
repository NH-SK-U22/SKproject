// react
import React from "react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// gsap
import { gsap } from "gsap";

// assets
import studentImg from "../../assets/student.png";
import teacherImg from "../../assets/teacher.png";

// css
import styles from "./SelectUsertype.module.css";

const SelectUser = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("student");
  const containerRef = useRef<HTMLDivElement>(null);
  const studentBtnRef = useRef<HTMLButtonElement>(null);
  const teacherBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  // ページ表示時のアニメーション
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          x: 100,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    }
  }, []);

  const handleSelect = (type: string) => {
    setUserType(type);

    const targetBtn =
      type === "student" ? studentBtnRef.current : teacherBtnRef.current;
    const otherBtn =
      type === "student" ? teacherBtnRef.current : studentBtnRef.current;

    if (targetBtn && otherBtn) {
      gsap.to(targetBtn, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(otherBtn, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleNext = () => {
    if (nextBtnRef.current) {
      gsap.to(nextBtnRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(nextBtnRef.current, {
            scale: 1,
            duration: 0.1,
            ease: "power2.out",
          });
        },
      });
    }

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        x: -100,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          navigate(`/login?userType=${userType}`);
        },
      });
    } else {
      navigate(`/login?userType=${userType}`);
    }
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <h1 className={styles.title}>Select User Type</h1>
      <div className={styles.usertypeSelect}>
        <button
          ref={studentBtnRef}
          className={`${styles.usertypeSelectBtn} ${
            userType === "student" ? styles.active : ""
          }`}
          onClick={() => handleSelect("student")}
        >
          <img src={studentImg} alt="student" />
          <span>Student</span>
        </button>
        <button
          ref={teacherBtnRef}
          className={`${styles.usertypeSelectBtn} ${
            userType === "teacher" ? styles.active : ""
          }`}
          onClick={() => handleSelect("teacher")}
        >
          <img src={teacherImg} alt="teacher" />
          <span>Teacher</span>
        </button>
      </div>
      <button
        ref={nextBtnRef}
        className={styles.next}
        type="button"
        onClick={handleNext}
      >
        Next
      </button>
    </div>
  );
};

export default SelectUser;
