// react
import React from "react";
import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

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

// components
import BackgroundCircles from "../../components/BackgroundCircles/BackgroundCircles";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signupLinkRef = useRef<HTMLAnchorElement>(null);

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
  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        x: -100,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          (async () => {
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
                  // 学生の場合：既に陣営を選択していればダッシュボードへ、未選択なら陣営選択ページへ
                  if (data.user.camp_id) {
                    navigate("/dashboard");
                  } else {
                    navigate("/campselect");
                  }
                } else {
                  navigate("/dashboard");
                }
              } else {
                setError(data.error || "ログイン失敗");
                gsap.to(containerRef.current, {
                  x: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                });
              }
            } catch (err) {
              console.error("Login error:", err);
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
      <BackgroundCircles />
      <div className={styles.loginBox} ref={containerRef}>
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
              <FaChalkboardTeacher className={styles.inputIcon} />
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
                autoComplete="current-password"
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
          <button type="submit" className={styles.submitButton}>
            Login
          </button>
        </form>
        <p className={styles.signupLink}>
          アカウントをお持ちでない方は
          <a
            href={`/signup?userType=${userType}`}
            onClick={handleSignupClick}
            ref={signupLinkRef}
          >
            {" "}
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
