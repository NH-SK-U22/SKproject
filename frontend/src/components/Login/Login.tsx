import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import styles from "./Login.module.css";
import studentImg from "../../assets/student.png";
import teacherImg from "../../assets/teacher.png";

const Login = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login data:", { userType, ...formData });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
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
      <div className={styles.loginBox}>
        <h2>ログイン</h2>
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
          <button type="submit" className={styles.submitButton}>
            ログイン
          </button>
        </form>
        <p className={styles.signupLink}>
          アカウントをお持ちでない方は
          <a href="/signin">新規登録</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
