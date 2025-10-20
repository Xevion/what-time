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
): { block: CSSProperties; text: CSSProperties } {
	let backgroundColor: CSSProperties["backgroundColor"] =
		BLOCK_COLORS.backgroundDefault;
	let textColor: CSSProperties["color"] = BLOCK_COLORS.textDefault;
	let borderTop: CSSProperties["borderTop"] = undefined;

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
			borderTop = isHovered
				? `1px solid ${BLOCK_COLORS.borderSelected}`
				: `1px solid ${BLOCK_COLORS.borderSelected}`;
		} else {
			borderTop = isHovered
				? `1px solid ${BLOCK_COLORS.borderSelected}`
				: `1px solid ${BLOCK_COLORS.borderDefault}`;
		}
	}

	return {
		block: { backgroundColor, borderTop },
		text: { color: textColor, textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" },
	};
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

	const dragStartIndex = useRef<number | null>(null);
	const hasDragged = useRef(false);
	const timeBlocks = generateTimeBlocks();

	// Handle mouse down - toggle or start drag
	const handleMouseDown = (index: number) => {
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

	// Add global mouse up listener
	useEffect(() => {
		window.addEventListener("mouseup", handleMouseUp);
		return () => window.removeEventListener("mouseup", handleMouseUp);
	}, [handleMouseUp]);

	return (
		<div
			style={{
				userSelect: isDragging ? "none" : "auto",
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
						className="h-5 cursor-pointer flex items-center justify-start pl-2 relative select-none"
						style={{
							transition: COLOR_TRANSITION,
							...styles.block,
						}}
						onMouseDown={() => handleMouseDown(block.index)}
						onMouseEnter={() => handleMouseEnter(block.index)}
						onMouseLeave={handleMouseLeaveBlock}
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
