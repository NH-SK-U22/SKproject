import styles from "./NotificationAgree.module.css"

interface NotificationAgreeProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const NotificationAgree: React.FC<NotificationAgreeProps> = ({
  defaultChecked = false,
  onChange
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <div className={styles["toggle-switch"]}>
      <input 
        className={styles["toggle-input"]} 
        id="notification-toggle" 
        type="checkbox"
        defaultChecked={defaultChecked}
        onChange={handleChange}
      />
      <label 
        className={styles["toggle-label"]} 
        htmlFor="notification-toggle"
      />
    </div>
  );
};