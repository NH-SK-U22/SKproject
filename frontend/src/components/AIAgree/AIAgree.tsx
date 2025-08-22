import styles from "./AIAgree.module.css";

interface AIAgreeProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const AIAgree: React.FC<AIAgreeProps> = ({
  defaultChecked = false,
  onChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <div className={styles["toggle-switch"]}>
      <input
        className={styles["toggle-input"]}
        id="ai-agree"
        type="checkbox"
        defaultChecked={defaultChecked}
        onChange={handleChange}
      />
      <label className={styles["toggle-label"]} htmlFor="ai-agree" />
    </div>
  );
};
