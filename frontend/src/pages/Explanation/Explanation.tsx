import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Explanation.module.css";
import { getCurrentUser } from "../../utils/auth";

interface Step {
  title: string;
  image: string;
  description: string;
}

interface LocationState {
  from?: "mypage" | string;
}

const AppGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  const navigate = useNavigate();
  const location = useLocation() as unknown as { state?: LocationState };

  const steps: Step[] = [
    {
      title: "1：陣営の選択",
      image: "/images/EX1.png",
      description: "自分が討論したい陣営を選ぼう！"
    },
    {
      title: "2：意見の投稿",
      image: "/images/EX2.png",
      description: "選んだ陣営がなぜいいと思ったかを投稿！"
    },
    {
      title: "3：相手の意見への評価",
      image: "/images/EX3.png",
      description: "相手の意見に評価をし、反論してみよう！"
    }
  ];

  const nextStep = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = async (): Promise<void> => {
    const user = getCurrentUser();
    if (user && user.user_type === "student") {
      try {
        await fetch(`http://localhost:5000/api/students/${user.id}/ex_flag`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ex_flag: 1 }),
        });
        // ローカルのユーザー情報も更新
        const updated = { ...user, ex_flag: 1 };
        localStorage.setItem("user", JSON.stringify(updated));
        // 遷移先決定
        if (location.state?.from === "mypage") {
          navigate("/mypage");
          return;
        }
        if (updated.camp_id) {
          navigate("/dashboard");
        } else {
          navigate("/campselect");
        }
        return;
      } catch (e) {
        console.error("ex_flag 更新失敗", e);
      }
    }
    if (location.state?.from === "mypage") {
      navigate("/mypage");
      return;
    }
    navigate("/dashboard");
  };

  const renderStepIndicator = () => {
    return (
      <div className={styles.stepIndicator}>{steps.map((_, index) => (<div key={index} className={`${styles.stepDot} ${index === currentStep ? styles.active : styles.inactive}`} />))}</div>
    );
  };

  return (
    <div className={styles.appGuideContainer}>
      <div className={styles.guideCard}>
        <div className={styles.guideContent}>
          <h1 className={styles.guideTitle}>アプリの使い方</h1>
          {renderStepIndicator()}
          <div className={styles.contentSection}>
            <div className={styles.imageSection}><img src={steps[currentStep].image} alt={steps[currentStep].title} className={styles.guideImage} /></div>
            <div className={styles.textSection}><h2 className={styles.stepTitle}>{steps[currentStep].title}</h2><p className={styles.stepDescription}>{steps[currentStep].description}</p></div>
          </div>
          <div className={styles.buttonSection}>{currentStep < steps.length - 1 ? (<button onClick={nextStep} className={`${styles.guideButton} ${styles.nextButton}`}>次へ</button>) : (<button onClick={handleFinish} className={`${styles.guideButton} ${styles.finishButton}`}>終了</button>)}</div>
        </div>
      </div>
    </div>
  );
};

export default AppGuide;