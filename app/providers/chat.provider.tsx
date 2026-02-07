"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat-widget"), {
	ssr: false,
	loading: () => null,
});

export function ChatProvider({ children }: { children: ReactNode }) {
	return (
		<>
			{children}
			<ChatWidget />
		</>
	);
}
