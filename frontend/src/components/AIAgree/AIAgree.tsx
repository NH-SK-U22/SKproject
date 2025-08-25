import styles from "./AIAgree.module.css";

interface AIAgreeProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const AIAgree: React.FC<AIAgreeProps> = ({
  checked = false,
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
        checked={checked}
        onChange={handleChange}
      />
      <label className={styles["toggle-label"]} htmlFor="ai-agree" />
    </div>
  );
};
