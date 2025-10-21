import { createFileRoute } from "@tanstack/react-router";
import {
	useMemo,
	useState,
	useEffect,
	useRef,
	type CSSProperties,
} from "react";
import { Box } from "@radix-ui/themes";
import { TimeGrid } from "../components/TimeGrid";

export const Route = createFileRoute("/")({
	component: Index,
});

const EVENT_NAME_INPUT_STYLE: CSSProperties = {
	width: "100%",
	fontSize: "clamp(24px, 5vw, 48px)",
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
	const [_selections, setSelections] = useState<Map<string, number[]>>(
		new Map(),
	);
	const [usePadding, setUsePadding] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);

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

	// Smart padding logic with hysteresis to prevent flickering
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const PADDING_TOTAL = 64; // 32px on each side (2rem)
		const BUFFER_ZONE = 100; // Hysteresis buffer to prevent flickering

		const updatePadding = () => {
			const containerWidth = container.offsetWidth;
			// Calculate responsive column width: clamp(150px, 20vw, 250px)
			const viewportWidth = window.innerWidth;
			const columnWidth = Math.max(150, Math.min(viewportWidth * 0.2, 250));
			const contentWidth = dates.length * columnWidth;

			// Hysteresis logic:
			// - When padding is OFF, only enable if there's extra room (buffer)
			// - When padding is ON, only disable if content clearly overflows
			if (usePadding) {
				// Currently padded - remove padding only if content + padding overflows
				if (contentWidth + PADDING_TOTAL > containerWidth) {
					setUsePadding(false);
				}
			} else {
				// Currently unpadded - add padding only if content + padding + buffer fits
				if (
					contentWidth + PADDING_TOTAL + BUFFER_ZONE <
					containerWidth
				) {
					setUsePadding(true);
				}
			}
		};

		// Initial check
		updatePadding();

		// Set up ResizeObserver to monitor container width changes
		const resizeObserver = new ResizeObserver(() => {
			updatePadding();
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, [dates.length, usePadding]);

	return (
		<div className="h-dvh w-screen flex flex-col overflow-hidden items-center pt-12">
			<div ref={containerRef} className="w-full flex flex-col h-full">
				<Box
					mb="4"
					px="8"
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

				<div
					className={`shrink min-h-0 xl:px-8 ${usePadding ? "px-8" : ""}`}
				>
					<TimeGrid
						dates={dates}
						onSelectionChange={handleSelectionChange}
					/>
				</div>
			</div>
		</div>
	);
}
