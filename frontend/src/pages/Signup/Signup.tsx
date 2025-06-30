// react
import React from "react";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";

// css
import styles from "./Signup.module.css";

// icons
import { FaSchool, FaUser, FaLock, FaChalkboardTeacher } from "react-icons/fa";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("userType") || "student";
  const [formData, setFormData] = useState({
    classID: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("Signup data:", formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox}>
        <h2>Sign up</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaSchool className={`${styles.inputIcon} ${styles.largeIcon}`} />
              <input
                type="text"
                name="schoolID"
                value={formData.classID}
                onChange={handleChange}
                placeholder="学校記号"
                required
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaChalkboardTeacher
                className={`${styles.inputIcon} ${styles.largeIcon}`}
              />
              <input
                type="text"
                name="classID"
                value={formData.classID}
                onChange={handleChange}
                placeholder="クラス記号"
                required
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaUser className={styles.inputIcon} />
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                placeholder={userType === "student" ? "出席番号" : "教員番号"}
                required
                autoComplete="username"
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="パスワード"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Sign up
          </button>
        </form>
        <p className={styles.loginLink}>
          すでにアカウントをお持ちの方は
          <Link to={`/login?userType=${userType}`}> Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
