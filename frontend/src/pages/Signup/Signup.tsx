// react
import React from "react";
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

// css
import styles from "./Signup.module.css";

// icons
import {
  FaSchool,
  FaUser,
  FaLock,
  FaChalkboardTeacher,
  FaUserTag,
} from "react-icons/fa";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get("userType") || "student";
  const [formData, setFormData] = useState({
    schoolID: "",
    classID: "",
    name: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loginLinkRef = useRef<HTMLAnchorElement>(null);

  // ページ表示時のアニメーション
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          rotationY: -90,
          scale: 0.8,
        },
        {
          opacity: 1,
          rotationY: 0,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        }
      );
    }
  }, []);

  // ページ移動時のアニメーション
  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = e.currentTarget.getAttribute("href");

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        rotationY: 90,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (target) {
            navigate(target);
          }
        },
      });
    }
  };

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

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        x: -100,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          (async () => {
            try {
              const response = await fetch("http://localhost:5000/api/signup", {
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
                navigate(`/login?userType=${userType}`);
              } else {
                setError(data.error || "失敗");
                gsap.to(containerRef.current, {
                  x: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            } catch (err) {
              console.error("Signup error:", err);
              setError("サーバーに接続できません");
              gsap.to(containerRef.current, {
                x: 0,
                opacity: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            }
          })();
        },
      });
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

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setFocusedField(e.target.name);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setFocusedField(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox} ref={containerRef}>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="off"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "schoolID" || formData.schoolID
                    ? styles.active
                    : ""
                }`}
              >
                学校記号
              </label>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="off"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "classID" || formData.classID
                    ? styles.active
                    : ""
                }`}
              >
                クラス記号
              </label>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="name"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "name" || formData.name ? styles.active : ""
                }`}
              >
                名前
              </label>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="username"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "userId" || formData.userId
                    ? styles.active
                    : ""
                }`}
              >
                {userType === "student" ? "出席番号" : "教員番号"}
              </label>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "password" || formData.password
                    ? styles.active
                    : ""
                }`}
              >
                パスワード
              </label>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
              />
              <label
                className={`${styles.floatingLabel} ${
                  focusedField === "confirmPassword" || formData.confirmPassword
                    ? styles.active
                    : ""
                }`}
              >
                パスワード(再確認)
              </label>
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Sign up
          </button>
        </form>
        <p className={styles.loginLink}>
          すでにアカウントをお持ちの方は
          <a
            href={`/login?userType=${userType}`}
            onClick={handleLoginClick}
            ref={loginLinkRef}
          >
            {" "}
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
