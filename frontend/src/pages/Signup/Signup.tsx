// react
import React from "react";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

// css
import styles from "./Signup.module.css";

// icons
import { FaSchool, FaUser, FaLock, FaChalkboardTeacher } from "react-icons/fa";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get("userType") || "student";
  const [formData, setFormData] = useState({
    schoolID: "",
    classID: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 6) {
      setError("パスワードの長さ6文字以上");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolID: formData.schoolID,
          classID: formData.classID,
          userId: formData.userId,
          password: formData.password,
          userType: userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/login?userType=${userType}`);
      } else {
        setError(data.error || "失敗");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("サーバーに接続できません");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // エラーメッセージの削除
    if (error) setError("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox}>
        <h2>Sign up</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaSchool className={`${styles.inputIcon} ${styles.largeIcon}`} />
              <input
                type="text"
                name="schoolID"
                value={formData.schoolID}
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
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaLock className={styles.inputIcon} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="パスワード(再確認)"
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
