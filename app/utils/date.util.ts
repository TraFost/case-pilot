import dayjs from "dayjs";

const DISPLAY_FORMAT = "MMM D, YYYY HH:mm";
const AUDIT_FORMAT = "MMM D, YYYY HH:mm:ss";
const TIME_ONLY_FORMAT = "HH:mm";

export function formatTimelineTime(value: string) {
	const trimmed = value.trim();
	const hasParenSuffix = /^\d+\s*\(.+\)$/.test(trimmed);
	const isNumericOnly = /^\d+$/.test(trimmed);
	const numericMatch =
		isNumericOnly || hasParenSuffix ? trimmed.match(/^\d+/) : null;
	const numeric = numericMatch ? Number(numericMatch[0]) : Number.NaN;

	let parsed = dayjs(trimmed);

	if (!Number.isNaN(numeric)) {
		let msValue = numeric;
		if (trimmed.length >= 16) {
			msValue = Math.floor(numeric / 1_000_000);
		} else if (trimmed.length <= 11) {
			msValue = numeric * 1000;
		}
		parsed = dayjs(msValue);
	}

	if (!parsed.isValid()) {
		return value;
	}

	return parsed.format(DISPLAY_FORMAT);
}

export function formatAuditTimestamp(value: number) {
	const parsed = dayjs(value);

	if (!parsed.isValid()) {
		return String(value);
	}

	return parsed.format(AUDIT_FORMAT);
}

export function formatTimeLabel(value: number) {
	const parsed = dayjs(value);

	if (!parsed.isValid()) {
		return String(value);
	}

	return parsed.format(TIME_ONLY_FORMAT);
}

export function formatDateTime(value: number) {
	const parsed = dayjs(value);

	if (!parsed.isValid()) {
		return String(value);
	}

	return parsed.format(DISPLAY_FORMAT);
}

export function toHourDecimal(value: number) {
	const parsed = dayjs(value);

	if (!parsed.isValid()) {
		return 0;
	}

	return parsed.hour() + parsed.minute() / 60;
}
