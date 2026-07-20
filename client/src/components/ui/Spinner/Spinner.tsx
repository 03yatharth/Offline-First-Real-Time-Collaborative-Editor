import styles from "./Spinner.module.css";

interface SpinnerProps {
  label?: string;
}

export default function Spinner({
  label,
}: SpinnerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />

      {label && <p>{label}</p>}
    </div>
  );
}