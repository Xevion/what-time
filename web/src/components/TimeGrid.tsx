import { useState, useCallback, useRef, useEffect } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { OverlayScrollbars } from "overlayscrollbars";
import { TimeGridColumn } from "./TimeGridColumn";
import { toDateKey } from "../utils/dateUtils";

interface TimeGridProps {
	dates: Date[];
	onSelectionChange?: (selections: Map<string, number[]>) => void;
}

export function TimeGrid({ dates, onSelectionChange }: TimeGridProps) {
	// Store selections as a Map keyed by date string (YYYY-MM-DD)
	const [selections, setSelections] = useState<Map<string, Set<number>>>(
		new Map(dates.map((date) => [toDateKey(date), new Set()])),
	);
	// Track if the user has scrolled down
	const [isScrolled, setIsScrolled] = useState(false);
	// Store the OverlayScrollbars instance
	const osInstanceRef = useRef<OverlayScrollbars | null>(null);
	// Store the scroll handler for cleanup
	const scrollHandlerRef = useRef<(() => void) | null>(null);

	// Handle selection change for a specific date
	const handleColumnSelectionChange = (
		dateKey: string,
		blocks: Set<number>,
	) => {
		const newSelections = new Map(selections);
		newSelections.set(dateKey, blocks);
		setSelections(newSelections);

		// Convert to Map<string, number[]> for the callback
		if (onSelectionChange) {
			const selectionsArray = new Map<string, number[]>();
			newSelections.forEach((value, key) => {
				selectionsArray.set(key, Array.from(value));
			});
			onSelectionChange(selectionsArray);
		}
	};

	// Format date for header display
	const formatDateHeader = (date: Date, short: boolean = false): string => {
		if (short) {
			return date.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
			});
		}
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
		});
	};

	// Store the OverlayScrollbars instance and attach scroll listener
	const handleScrollbarInitialized = useCallback(
		(instance: OverlayScrollbars) => {
			osInstanceRef.current = instance;

			// Attach scroll listener
			const { viewport } = instance.elements();

			const handleScroll = () => {
				const scrollTop = viewport.scrollTop;
				setIsScrolled(scrollTop > 0);
			};

			scrollHandlerRef.current = handleScroll;
			viewport.addEventListener("scroll", handleScroll);
		},
		[],
	);

	// Cleanup scroll listener on unmount
	useEffect(() => {
		return () => {
			const instance = osInstanceRef.current;
			const handler = scrollHandlerRef.current;
			if (instance && handler) {
				const { viewport } = instance.elements();
				viewport.removeEventListener("scroll", handler);
			}
		};
	}, []);

	return (
		<div className="flex flex-col h-full w-fit max-w-full">
			<div className="flex-1 min-h-0 w-full">
				<OverlayScrollbarsComponent
					style={{ maxHeight: "100%", width: "100%" }}
					options={{
						scrollbars: {
							autoHide: "scroll",
							theme: "os-theme-light",
						},
						overflow: {
							x: "scroll",
							y: "scroll",
						},
					}}
					events={{
						initialized: handleScrollbarInitialized,
					}}
					defer
				>
					<div className="w-fit">
						{/* Sticky header with clipped shadow */}
						<div className="sticky top-0 bg-white z-10">
							<div
								className="flex pb-3 transition-shadow duration-300"
								style={{
									boxShadow: isScrolled
										? "0 4px 4px -2px rgba(0, 0, 0, 0.08)"
										: "none",
									clipPath: "inset(0 0 -20px 0)",
								}}
							>
								{dates.map((date, index) => {
									const isLastColumn =
										index === dates.length - 1;
									const fullDate = formatDateHeader(
										date,
										false,
									);
									const shortDate = formatDateHeader(
										date,
										true,
									);

									return (
										<div
											key={toDateKey(date)}
											className="px-2 sm:px-3"
											style={{
												minWidth:
													"clamp(150px, 20vw, 250px)",
												width: "clamp(150px, 20vw, 250px)",
												borderRight: isLastColumn
													? "none"
													: "1px solid var(--gray-5)",
											}}
										>
											<span
												className="block"
												title={fullDate}
												style={{
													fontSize:
														"clamp(13px, 2.5vw, 14px)",
													color: "var(--gray-11)",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
													display: "block",
													lineHeight: 1.5,
												}}
											>
												<span className="hidden lg:inline">
													{fullDate}
												</span>
												<span className="inline lg:hidden">
													{shortDate}
												</span>
											</span>
										</div>
									);
								})}
							</div>
						</div>

						{/* Grid columns */}
						<div className="flex pb-6 pr-2">
							{dates.map((date, index) => {
								const dateKey = toDateKey(date);
								const selectedBlocks =
									selections.get(dateKey) || new Set();
								const isLastColumn = index === dates.length - 1;

								return (
									<div
										key={dateKey}
										style={{
											minWidth:
												"clamp(150px, 20vw, 250px)",
											width: "clamp(150px, 20vw, 250px)",
											borderRight: isLastColumn
												? "none"
												: "1px solid var(--gray-5)",
										}}
									>
										<TimeGridColumn
											selectedBlocks={selectedBlocks}
											onSelectionChange={(blocks) =>
												handleColumnSelectionChange(
													dateKey,
													blocks,
												)
											}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</OverlayScrollbarsComponent>
			</div>
		</div>
	);
}
