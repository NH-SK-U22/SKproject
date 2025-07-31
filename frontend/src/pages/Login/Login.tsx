// react
import React from "react";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

// css
import styles from "./Login.module.css";

// icons
import {
  FaUser,
  FaLock,
  FaSchool,
  FaChalkboardTeacher,
  FaUserTag,
} from "react-icons/fa";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get("userType") || "student";
  const [formData, setFormData] = useState({
    schoolID: "",
    classID: "",
    name: "",
    userId: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolID: formData.schoolID,
          classID: formData.classID,
          name: formData.name,
          userId: formData.userId,
          password: formData.password,
          userType: userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ユーザー情報をlocalStorageに保存する
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");

        if (userType == "student") {
          // ログイン成功後、陣営選択ページに移動
          navigate("/campselect");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.error || "ログイン失敗");
      }
    } catch (err) {
      console.error("Login error:", err);
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
      <div className={styles.loginBox}>
        <h2>Login</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <FaSchool className={styles.inputIcon} />
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
              <FaChalkboardTeacher className={styles.inputIcon} />
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
              <FaUserTag className={styles.inputIcon} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="名前"
                required
                autoComplete="name"
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
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Login
          </button>
        </form>
        <p className={styles.signupLink}>
          アカウントをお持ちでない方は
          <Link to={`/signup?userType=${userType}`}> Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
