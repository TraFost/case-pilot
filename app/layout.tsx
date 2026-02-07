import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ConvexClientProvider } from "@/providers/convex.provider";
import { ChatProvider } from "@/providers/chat.provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "CasePilot",
	description:
		"AI copilot that turns fraud alerts into real-time cases in seconds",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased min-w-full min-h-full`}
			>
				<ConvexClientProvider>
					<ChatProvider>{children}</ChatProvider>
				</ConvexClientProvider>
				<Toaster richColors expand position="top-right" />
			</body>
		</html>
	);
}
