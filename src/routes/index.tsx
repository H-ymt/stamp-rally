import { createFileRoute } from "@tanstack/react-router";
import LocationBingo from "../components/LocationBingo";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return <LocationBingo />;
}
