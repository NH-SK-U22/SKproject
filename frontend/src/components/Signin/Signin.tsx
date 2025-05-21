import React from "react";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./Signin.module.css";

const Signin = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("userType") || "student";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("Signin data:", formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.signinBox}>
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>{userType === "student" ? "学籍番号" : "教員番号"}</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>パスワード</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>パスワード ( 確認 )</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Sign in
          </button>
        </form>
        <p className={styles.loginLink}>
          すでにアカウントをお持ちの方は
          <a href={"/login?userType=" + userType}> Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signin;
