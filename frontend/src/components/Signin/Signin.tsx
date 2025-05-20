import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import styles from "./Signin.module.css";
import studentImg from "../../assets/student.png";
import teacherImg from "../../assets/teacher.png";

const Signin = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    console.log("Signin data:", { userType, ...formData });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgFrosted}></div>
      <div className={styles.bgShape + " " + styles.bgShape1}>
        <div className={styles.bgShapeMoon}></div>
        <div className={styles.bgShapeMask}></div>
      </div>
      <div className={styles.bgShape + " " + styles.bgShape2}>
        <div className={styles.bgShapeMoon}></div>
        <div className={styles.bgShapeMask}></div>
      </div>
      <div className={styles.bgShape + " " + styles.bgShape3}>
        <div className={styles.bgShapeMoon}></div>
        <div className={styles.bgShapeMask}></div>
      </div>
      <div className={styles.bgShape + " " + styles.bgShape4}>
        <div className={styles.bgShapeMoon}></div>
        <div className={styles.bgShapeMask}></div>
      </div>
      <div className={styles.bgShape + " " + styles.bgShape5}>
        <div className={styles.bgShapeMoon}></div>
        <div className={styles.bgShapeMask}></div>
      </div>
      <div className={styles.signinBox}>
        <h2>新規登録</h2>
        <div className={styles.userTypeSelector}>
          <button
            className={`${styles.typeButton} ${
              userType === "student" ? styles.active : ""
            }`}
            onClick={() => setUserType("student")}
          >
            <div className={styles.avatarWrapper}>
              <img
                src={studentImg}
                alt="student"
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.typeLabel}>STUDENT</div>
          </button>
          <button
            className={`${styles.typeButton} ${
              userType === "teacher" ? styles.active : ""
            }`}
            onClick={() => setUserType("teacher")}
          >
            <div className={styles.avatarWrapper}>
              <img
                src={teacherImg}
                alt="teacher"
                className={styles.avatarImg}
              />
            </div>
            <div className={styles.typeLabel}>TEACHER</div>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>{userType === "student" ? "学籍番号" : "教員番号"}</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
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
            />
          </div>
          <div className={styles.inputGroup}>
            <label>パスワード（確認）</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            登録
          </button>
        </form>
        <p className={styles.loginLink}>
          すでにアカウントをお持ちの方は
          <a href="/login">ログイン</a>
        </p>
      </div>
    </div>
  );
};

export default Signin;
