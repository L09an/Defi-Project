import styles from "../styles/Home.module.css";
import InstructionsComponent from "../components/InstructionsComponent";
import TokenBalancesDisplay from "../components/TokenBalancesDisplay";
export default function Home() {
  return (
    <div>
      <main className={styles.main}>
        <TokenBalancesDisplay></TokenBalancesDisplay>
      </main>
    </div>
  );
}
