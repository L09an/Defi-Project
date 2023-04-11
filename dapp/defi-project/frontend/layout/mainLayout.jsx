import Navbar from "../components/navigation/navbar";
import styles from "../styles/Home.module.css";
import InstructionsComponent from "../components/InstructionsComponent";
import TokenBalancesDisplay from "../components/TokenBalancesDisplay";

export default function MainLayout({ children, address, connector }) {
	return (
		<div>
			<Navbar />
			<div>
				<main className={styles.main}>
					<TokenBalancesDisplay address={address} connector={connector}/>
				</main>
			</div>
		</div>
	);
}
