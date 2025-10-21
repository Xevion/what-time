import { Text } from "@radix-ui/themes";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import { formatTime12Hour } from "../utils/dateUtils";

interface TimeBlock {
	hour: number;
	minute: number;
	index: number;
}

interface TimeGridColumnProps {
	selectedBlocks: Set<number>;
	onSelectionChange: (blocks: Set<number>) => void;
}

// Colors for block states
const BLOCK_COLORS = {
	selectionPreview: "#dbeafe",
	deselectionPreview: "#fecaca",
	selectedDefault: "#93c5fd",
	selectedHover: "#AFD5FF",
	backgroundDefault: "var(--gray-2)",
	backgroundHover: "var(--gray-3)",
	textOnSelection: "white",
	textDefault: "var(--gray-12)",
	borderDefault: "var(--gray-5)",
	borderSelected: "var(--gray-6)",
} as const;

const COLOR_TRANSITION = "background-color 0.15s ease, color 0.15s ease";

// Touch interaction constants for smart drag detection
const TOUCH_HOLD_THRESHOLD_MS = 300; // Time to hold before entering selection mode
const TOUCH_MOVE_THRESHOLD_PX = 15; // Max movement distance to count as "holding in place"

// Generate time blocks for a day (15-minute intervals)
function generateTimeBlocks(startHour = 0, endHour = 24): TimeBlock[] {
	const blocks: TimeBlock[] = [];
	let index = 0;

	for (let hour = startHour; hour < endHour; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			blocks.push({
				hour,
				minute,
				index: index++,
			});
		}
	}

	return blocks;
}

function getBlockStyles(
	isSelected: boolean,
	isHovered: boolean,
	isDragging: boolean,
	willChangeState: boolean,
	dragMode: "select" | "deselect",
	isHourMark: boolean,
): { block: CSSProperties; text: CSSProperties; border?: CSSProperties } {
	let backgroundColor: CSSProperties["backgroundColor"] =
		BLOCK_COLORS.backgroundDefault;
	let textColor: CSSProperties["color"] = BLOCK_COLORS.textDefault;
	let borderColor: string | undefined = undefined;

	// Determine background color based on state priority
	if (willChangeState) {
		// Show preview color only for blocks that will change
		if (dragMode === "select") {
			backgroundColor = BLOCK_COLORS.selectionPreview;
		} else {
			backgroundColor = BLOCK_COLORS.deselectionPreview;
		}
	} else if (isSelected) {
		// Light blue for committed selection
		backgroundColor =
			isHovered && !isDragging
				? BLOCK_COLORS.selectedHover
				: BLOCK_COLORS.selectedDefault;
		textColor = "white";
	} else if (isHovered && !isDragging) {
		// Subtle hover effect when not dragging
		backgroundColor = BLOCK_COLORS.backgroundHover;
	}

	// Determine border based on hour mark and state
	if (isHourMark) {
		if (isSelected) {
			borderColor = BLOCK_COLORS.borderSelected;
		} else {
			borderColor = isHovered
				? BLOCK_COLORS.borderSelected
				: BLOCK_COLORS.borderDefault;
		}
	}

	return {
		block: { backgroundColor },
		text: { color: textColor, textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" },
		...(borderColor ? { border: { borderTopColor: borderColor } } : {}),
	};
}

// Helper function to get block index from touch point
function getBlockIndexFromTouch(touch: Touch): number | null {
	const element = document.elementFromPoint(touch.clientX, touch.clientY);
	if (!element) return null;

	// Check if the element itself has the data attribute
	const blockIndex = element.getAttribute("data-block-index");
	if (blockIndex !== null) return Number.parseInt(blockIndex, 10);

	// Check parent element (in case touch is on the Text element inside)
	const parent = element.parentElement;
	if (parent) {
		const parentBlockIndex = parent.getAttribute("data-block-index");
		if (parentBlockIndex !== null) return Number.parseInt(parentBlockIndex, 10);
	}

	return null;
}

export function TimeGridColumn({
	selectedBlocks,
	onSelectionChange,
}: TimeGridColumnProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [dragMode, setDragMode] = useState<"select" | "deselect">("select");
	const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
	const [dragPreviewBlocks, setDragPreviewBlocks] = useState<Set<number>>(
		new Set(),
	);
	const [isTouchSelecting, setIsTouchSelecting] = useState(false);

	const dragStartIndex = useRef<number | null>(null);
	const hasDragged = useRef(false);
	const touchStartPos = useRef<{
		x: number;
		y: number;
		blockIndex: number;
	} | null>(null);
	const touchHoldTimer = useRef<NodeJS.Timeout | null>(null);
	const touchIdentifier = useRef<number | null>(null);
	// Use refs for touch selection state to avoid stale closures in event handlers
	const isCurrentlySelecting = useRef(false);
	const currentDragMode = useRef<"select" | "deselect">("select");
	const currentDragPreview = useRef<Set<number>>(new Set());
	// Track last touch time to ignore ghost mouse events on mobile
	const lastTouchTime = useRef<number>(0);
	const timeBlocks = generateTimeBlocks();

	// Handle mouse down - toggle or start drag
	const handleMouseDown = (index: number) => {
		// Ignore ghost mouse events after touch (within 500ms)
		if (Date.now() - lastTouchTime.current < 500) {
			return;
		}

		dragStartIndex.current = index;
		hasDragged.current = false;

		// Determine mode based on first block's state
		const mode = selectedBlocks.has(index) ? "deselect" : "select";
		setDragMode(mode);
		setIsDragging(true);

		// Add to drag preview (will show lighter color during drag)
		setDragPreviewBlocks(new Set([index]));
	};

	// Handle mouse enter - continue drag if dragging
	const handleMouseEnter = (index: number) => {
		// Ignore ghost mouse events after touch (within 500ms)
		if (Date.now() - lastTouchTime.current < 500) {
			return;
		}

		// Update hover state
		setHoveredBlock(index);

		// If not dragging or haven't started, return
		if (!isDragging || dragStartIndex.current === null) return;

		// Mark that we've actually dragged to another block
		if (index !== dragStartIndex.current) {
			hasDragged.current = true;
		}

		// Calculate range from start to current position
		const start = Math.min(dragStartIndex.current, index);
		const end = Math.max(dragStartIndex.current, index);

		// Create drag preview set with all blocks in range
		const newDragPreview = new Set<number>();
		for (let i = start; i <= end; i++) {
			newDragPreview.add(i);
		}
		setDragPreviewBlocks(newDragPreview);
	};

	// Handle mouse leave from a block
	const handleMouseLeaveBlock = () => {
		// Ignore ghost mouse events after touch (within 500ms)
		if (Date.now() - lastTouchTime.current < 500) {
			return;
		}

		setHoveredBlock(null);
	};

	// Handle mouse up - finish dragging
	const handleMouseUp = useCallback(() => {
		if (!isDragging) return;

		// Commit the drag preview to the actual selection
		const newSelected = new Set(selectedBlocks);
		dragPreviewBlocks.forEach((blockIndex) => {
			if (dragMode === "select") {
				newSelected.add(blockIndex);
			} else {
				newSelected.delete(blockIndex);
			}
		});
		onSelectionChange(newSelected);

		// Reset drag state
		setIsDragging(false);
		setDragPreviewBlocks(new Set());
		dragStartIndex.current = null;
		hasDragged.current = false;
	}, [
		isDragging,
		selectedBlocks,
		dragPreviewBlocks,
		dragMode,
		onSelectionChange,
	]);

	// Handle touch start - detect multi-touch and start hold timer
	const handleTouchStart = (e: React.TouchEvent, index: number) => {
		// Multi-touch (2+ fingers) always allows scrolling
		if (e.touches.length >= 2) {
			return;
		}

		const touch = e.touches[0];
		if (!touch) return;

		// Record touch time to block ghost mouse events
		lastTouchTime.current = Date.now();

		// Record initial touch state
		touchStartPos.current = {
			x: touch.clientX,
			y: touch.clientY,
			blockIndex: index,
		};
		touchIdentifier.current = touch.identifier;
		isCurrentlySelecting.current = false;

		// Start timer to activate selection mode after hold threshold
		touchHoldTimer.current = setTimeout(() => {
			// User held for 300ms, activate selection mode
			isCurrentlySelecting.current = true;
			setIsTouchSelecting(true);
			dragStartIndex.current = index;

			// Determine mode based on first block's state
			const mode = selectedBlocks.has(index) ? "deselect" : "select";
			currentDragMode.current = mode;
			setDragMode(mode);
			setIsDragging(true);

			// Add to drag preview
			const preview = new Set([index]);
			currentDragPreview.current = preview;
			setDragPreviewBlocks(preview);
		}, TOUCH_HOLD_THRESHOLD_MS);
	};

	// Handle touch move - detect if scrolling or selecting
	const handleTouchMove = useCallback((e: TouchEvent) => {
		// If multi-touch, cancel any pending selection
		if (e.touches.length >= 2) {
			if (touchHoldTimer.current) {
				clearTimeout(touchHoldTimer.current);
				touchHoldTimer.current = null;
			}
			return;
		}

		// Find the touch we're tracking
		const touch = Array.from(e.touches).find(
			(t) => t.identifier === touchIdentifier.current,
		);
		if (!touch || !touchStartPos.current) return;

		const deltaX = touch.clientX - touchStartPos.current.x;
		const deltaY = touch.clientY - touchStartPos.current.y;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// Not in selection mode yet - check if we should cancel the timer
		if (!isCurrentlySelecting.current) {
			// If moved beyond threshold, user is scrolling - cancel timer
			if (distance > TOUCH_MOVE_THRESHOLD_PX && touchHoldTimer.current) {
				clearTimeout(touchHoldTimer.current);
				touchHoldTimer.current = null;
				touchStartPos.current = null;
				touchIdentifier.current = null;
			}
			return;
		}

		// In selection mode - prevent scrolling and update selection
		e.preventDefault();

		// Get the block under current touch
		const currentBlockIndex = getBlockIndexFromTouch(touch);
		if (currentBlockIndex === null || dragStartIndex.current === null)
			return;

		// Mark that we've dragged to another block
		if (currentBlockIndex !== dragStartIndex.current) {
			hasDragged.current = true;
		}

		// Calculate range from start to current position
		const start = Math.min(dragStartIndex.current, currentBlockIndex);
		const end = Math.max(dragStartIndex.current, currentBlockIndex);

		// Create drag preview set with all blocks in range
		const newDragPreview = new Set<number>();
		for (let i = start; i <= end; i++) {
			newDragPreview.add(i);
		}
		currentDragPreview.current = newDragPreview;
		setDragPreviewBlocks(newDragPreview);
	}, []);

	// Handle touch end - commit selection if in selection mode
	const handleTouchEnd = useCallback(
		(e: TouchEvent) => {
			// Verify this is the touch we're tracking
			const ourTouch = Array.from(e.changedTouches).find(
				(t) => t.identifier === touchIdentifier.current,
			);
			if (!ourTouch) return; // Not our touch, ignore

			// Record touch time to block ghost mouse events
			lastTouchTime.current = Date.now();

			// Clear any pending timer
			if (touchHoldTimer.current) {
				clearTimeout(touchHoldTimer.current);
				touchHoldTimer.current = null;
			}

			// If in selection mode, commit the changes using refs
			if (isCurrentlySelecting.current) {
				e.preventDefault(); // Prevent ghost clicks

				// Commit the drag preview to the actual selection
				const newSelected = new Set(selectedBlocks);
				const preview = currentDragPreview.current;
				const mode = currentDragMode.current;

				preview.forEach((blockIndex) => {
					if (mode === "select") {
						newSelected.add(blockIndex);
					} else {
						newSelected.delete(blockIndex);
					}
				});
				onSelectionChange(newSelected);

				// Reset drag state
				setIsDragging(false);
				setDragPreviewBlocks(new Set());
				dragStartIndex.current = null;
				hasDragged.current = false;
			} else if (touchStartPos.current) {
				// Not in selection mode - check if it's a quick tap
				const deltaX = ourTouch.clientX - touchStartPos.current.x;
				const deltaY = ourTouch.clientY - touchStartPos.current.y;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

				// If movement is small, treat as tap and toggle the block
				if (distance < TOUCH_MOVE_THRESHOLD_PX) {
					e.preventDefault(); // Prevent ghost clicks

					const tappedIndex = touchStartPos.current.blockIndex;
					const newSelected = new Set(selectedBlocks);

					// Toggle the tapped block
					if (newSelected.has(tappedIndex)) {
						newSelected.delete(tappedIndex);
					} else {
						newSelected.add(tappedIndex);
					}

					onSelectionChange(newSelected);
				}
			}

			// Reset touch state
			isCurrentlySelecting.current = false;
			setIsTouchSelecting(false);
			touchStartPos.current = null;
			touchIdentifier.current = null;
			currentDragPreview.current = new Set();

			// Clear hover state to prevent ghost hover
			setHoveredBlock(null);
		},
		[selectedBlocks, onSelectionChange],
	);

	// Handle touch cancel - reset all state
	const handleTouchCancel = useCallback(() => {
		if (touchHoldTimer.current) {
			clearTimeout(touchHoldTimer.current);
			touchHoldTimer.current = null;
		}
		isCurrentlySelecting.current = false;
		setIsTouchSelecting(false);
		setIsDragging(false);
		setDragPreviewBlocks(new Set());
		touchStartPos.current = null;
		touchIdentifier.current = null;
		dragStartIndex.current = null;
		hasDragged.current = false;
		currentDragPreview.current = new Set();
	}, []);

	// Add global mouse up listener
	useEffect(() => {
		window.addEventListener("mouseup", handleMouseUp);
		return () => window.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseUp]);

	// Add global touch event listeners
	useEffect(() => {
		window.addEventListener("touchmove", handleTouchMove, { passive: false });
		window.addEventListener("touchend", handleTouchEnd);
		window.addEventListener("touchcancel", handleTouchCancel);

		return () => {
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("touchcancel", handleTouchCancel);
		};
	}, [handleTouchMove, handleTouchEnd, handleTouchCancel]);

	// Cleanup touch timer on unmount
	useEffect(() => {
		return () => {
			if (touchHoldTimer.current) {
				clearTimeout(touchHoldTimer.current);
			}
		};
	}, []);

	return (
		<div
			style={{
				userSelect: isDragging ? "none" : "auto",
				lineHeight: 0,
			}}
		>
			{timeBlocks.map((block) => {
				const isSelected = selectedBlocks.has(block.index);
				const isDragPreview = dragPreviewBlocks.has(block.index);
				const isHovered = hoveredBlock === block.index;
				const isHourMark = block.minute === 0;

				// Determine if label should be shown
				const shouldShowLabel = isHourMark || isHovered;

				// Format label based on context
				const label = isHovered
					? formatTime12Hour(block.hour, block.minute, true)
					: formatTime12Hour(block.hour, block.minute, false);

				// Determine if this block will actually change state
				const willChangeState =
					isDragPreview &&
					isDragging &&
					((dragMode === "select" && !isSelected) ||
						(dragMode === "deselect" && isSelected));

				// Get block styles based on state
				const styles = getBlockStyles(
					isSelected,
					isHovered,
					isDragging,
					willChangeState,
					dragMode,
					isHourMark,
				);

				return (
					<div
						key={block.index}
						className="h-5 cursor-pointer relative select-none pl-2 box-border"
						data-block-index={block.index}
						style={{
							transition: COLOR_TRANSITION,
							marginTop: block.index === 0 ? 0 : "-1px",
							marginBottom:
								block.index === timeBlocks.length - 1
									? 0
									: "-0.5px",
							...(styles.border?.borderTopColor && {
								borderTop: `1px solid ${styles.border.borderTopColor}`,
							}),
							...styles.block,
						}}
						onMouseDown={() => handleMouseDown(block.index)}
						onMouseEnter={() => handleMouseEnter(block.index)}
						onMouseLeave={handleMouseLeaveBlock}
						onTouchStart={(e) => handleTouchStart(e, block.index)}
					>
						{shouldShowLabel && (
							<Text
								size="1"
								style={{
									...styles.text,
									fontVariantNumeric: "tabular-nums",
									transition: COLOR_TRANSITION,
									pointerEvents: "none",
									userSelect: "none",
								}}
							>
								{label}
							</Text>
						)}
					</div>
				);
			})}
		</div>
	);
}
