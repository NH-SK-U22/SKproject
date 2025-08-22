import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Explanation.module.css";

interface Step {
  title: string;
  image: string;
  description: string;
}

const AppGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  const navigate = useNavigate();

  const steps: Step[] = [
    {
      title: "1：陣営の選択",
      image: "/images/EX1.png",
      description: ""
    },
    {
      title: "2：意見の投稿",
      image: "/images/EX2.png",
      description: ""
    },
    {
      title: "3：相手の意見への評価",
      image: "/images/EX3.png",
      description: ""
    }
  ];

  const nextStep = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = (): void => {
    // 任意のURLに遷移（例: アプリのメイン画面）
    navigate("/dashboard");
  };

  const renderStepIndicator = (): JSX.Element => {
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