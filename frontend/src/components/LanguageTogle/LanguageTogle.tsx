import styles from "./LanguageTogle.module.css";

interface LanguageToggleProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const LanguageTogle: React.FC<LanguageToggleProps> = ({
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
        id="language-toggle"
        type="checkbox"
        defaultChecked={defaultChecked}
        onChange={handleChange}
      />
      <label className={styles["toggle-label"]} htmlFor="language-toggle" />
    </div>
  );
};
