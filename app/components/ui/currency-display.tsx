import { Bitcoin, DollarSign, Coins } from "lucide-react";
import {
	formatCurrency,
	WALLET_CURRENCIES,
	type Currency,
} from "@/utils/currency.util";

interface CurrencyDisplayProps {
	amount: number;
	currency: Currency;
	className?: string;
	iconClassName?: string;
}

export function CurrencyDisplay({
	amount,
	currency,
	className = "",
	iconClassName = "w-4 h-4",
}: CurrencyDisplayProps) {
	const getCurrencyConfig = (curr: Currency) => {
		switch (curr) {
			case "BTC":
				return {
					icon: <Bitcoin className={iconClassName} />,
					color: "text-orange-500",
					bg: "bg-orange-500/10",
					label: "BTC",
				};
			case "ETH":
				return {
					icon: (
						<svg
							viewBox="0 0 32 32"
							className={iconClassName}
							fill="currentColor"
						>
							<path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.994-15.781L16.498 4 9 16.22l7.498 4.353 7.496-4.354zM24 17.616l-7.502 4.351L9 17.617l7.498 10.378L24 17.616z" />
						</svg>
					),
					color: "text-blue-600",
					bg: "bg-blue-600/10",
					label: "ETH",
				};
			case "USD":
				return {
					icon: <DollarSign className={iconClassName} />,
					color: "text-green-600",
					bg: "bg-green-600/10",
					label: "USD",
				};
			default:
				return {
					icon: <Coins className={iconClassName} />,
					color: "text-slate-500",
					bg: "bg-slate-500/10",
					label: curr,
				};
		}
	};

	const config = getCurrencyConfig(currency);

	return (
		<div className={`flex items-center gap-2 font-mono ${className}`}>
			<div
				className={`p-1 rounded-md flex items-center justify-center ${config.bg} ${config.color}`}
			>
				{config.icon}
			</div>

			<span className="font-semibold text-foreground tracking-tight">
				{formatCurrency(amount, currency)}

				{WALLET_CURRENCIES.includes(currency) && (
					<span className="ml-1 text-xs text-muted-foreground font-sans">
						{config.label}
					</span>
				)}
			</span>
		</div>
	);
}
