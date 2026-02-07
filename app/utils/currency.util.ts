export type Currency = "BTC" | "ETH" | "USD" | "EUR";

export const WALLET_CURRENCIES: Currency[] = ["BTC", "ETH"];

export const formatCurrency = (amount: number, currency: Currency) => {
	if (WALLET_CURRENCIES.includes(currency)) {
		return new Intl.NumberFormat("en-US", {
			style: "decimal",
			minimumFractionDigits: 2,
			maximumFractionDigits: 8,
		}).format(amount);
	}

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 2,
	}).format(amount);
};

export function formatCurrencyWithCode(amount: number, currency: Currency) {
	const formatted = formatCurrency(amount, currency);
	return WALLET_CURRENCIES.includes(currency)
		? `${formatted} ${currency}`
		: formatted;
}

const WALLET_PREFIXES: Array<{ prefix: string; currency: Currency }> = [
	{ prefix: "0x", currency: "ETH" },
	{ prefix: "bc1", currency: "BTC" },
	{ prefix: "1", currency: "BTC" },
	{ prefix: "3", currency: "BTC" },
];

export function normalizeCurrency(value: string | null | undefined) {
	if (!value) return "USD";
	const upper = value.toUpperCase();
	if (
		upper === "BTC" ||
		upper === "ETH" ||
		upper === "USD" ||
		upper === "EUR"
	) {
		return upper as Currency;
	}
	return "USD";
}

export function getCurrencyFromWalletAddress(walletAddress: string | null) {
	if (!walletAddress) return "USD";
	const trimmed = walletAddress.trim().toLowerCase();
	const match = WALLET_PREFIXES.find((entry) =>
		trimmed.startsWith(entry.prefix),
	);
	return match?.currency ?? "USD";
}
