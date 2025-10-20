/**
 * Convert a Date object to a date-only key string in YYYY-MM-DD format
 * This ensures consistent keys regardless of time/timezone differences
 */
export function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Convert a block index (0-95 for 15-minute intervals in a 24-hour day) to HH:MM format
 * @param index - Block index (0 = 00:00, 1 = 00:15, 4 = 01:00, etc.)
 * @returns Time string in HH:MM format (e.g., "04:00", "13:45")
 */
export function blockIndexToTime(index: number): string {
	const hour = Math.floor(index / 4);
	const minute = (index % 4) * 15;
	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Convert a time string in HH:MM format to a block index
 * @param timeString - Time in HH:MM format (e.g., "04:00", "13:45")
 * @returns Block index (0-95)
 */
export function timeToBlockIndex(timeString: string): number {
	const [hourStr, minuteStr] = timeString.split(":");
	const hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);
	return hour * 4 + Math.floor(minute / 15);
}

/**
 * Format block indices as readable time ranges
 * @param blocks - Array of block indices
 * @returns Array of time strings in HH:MM format
 */
export function formatBlocksAsTimeRanges(blocks: number[]): string[] {
	return blocks.map(blockIndexToTime);
}

/**
 * Format time in 12-hour format with AM/PM
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param showMinutes - Whether to show minutes (e.g., "4:30pm" vs "4pm")
 * @returns Formatted time string (e.g., "4:30pm", "12am")
 */
export function formatTime12Hour(
	hour: number,
	minute: number,
	showMinutes: boolean,
): string {
	const period = hour >= 12 ? "pm" : "am";
	const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

	if (showMinutes) {
		return `${displayHour}:${minute.toString().padStart(2, "0")}${period}`;
	}
	return `${displayHour}${period}`;
}
