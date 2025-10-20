import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties } from "react";
import { Box } from "@radix-ui/themes";
import { TimeGrid } from "../components/TimeGrid";

export const Route = createFileRoute("/")({
	component: Index,
});

const EVENT_NAME_INPUT_STYLE: CSSProperties = {
	width: "100%",
	fontSize: "48px",
	fontWeight: "600",
	border: "none",
	outline: "none",
	padding: "0",
	backgroundColor: "transparent",
	color: "var(--gray-12)",
	fontFamily: "inherit",
};

function Index() {
	const [eventName, setEventName] = useState("");
	const [selections, setSelections] = useState<Map<string, number[]>>(
		new Map(),
	);

	// Generate dates for yesterday, today, and tomorrow (memoized to prevent recreation)
	const dates = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalize to midnight

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return [yesterday, today, tomorrow];
	}, []);

	const handleSelectionChange = (selections: Map<string, number[]>) => {
		setSelections(selections);
	};

	return (
		<div className="h-screen w-screen flex flex-col overflow-hidden items-center pt-12 px-8">
			<div className="w-full max-w-5xl flex flex-col h-full">
				<Box
					mb="4"
					style={{
						flexShrink: 0,
					}}
				>
					<input
						type="text"
						value={eventName}
						onChange={(e) => setEventName(e.target.value)}
						placeholder="Untitled event"
						style={EVENT_NAME_INPUT_STYLE}
						className="event-name-input"
					/>
				</Box>

				<div className="flex-1 min-h-0">
					<TimeGrid
						dates={dates}
						onSelectionChange={handleSelectionChange}
					/>
				</div>
			</div>
		</div>
	);
}
