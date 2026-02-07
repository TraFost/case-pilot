import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useParams, usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

import { buildSarPdf, type SarReport } from "@/utils/pdf.util";

const UI_MARKER = /\[\[UI:(REPORT)\]\]/g;

type UiComponentType = "REPORT";

type SourceSection = {
	title: string;
	items: string[];
};

type ChatData = {
	sources: SourceSection[];
};

type ParsedMessage = {
	id: string;
	role: string;
	content: string;
	uiComponent?: UiComponentType;
	sources?: SourceSection[];
};

type SarResponse = SarReport;

type ChatMessage = UIMessage<unknown, ChatData>;
type InitialMessage = ChatMessage & { parts: { type: "text"; text: string }[] };

function parseMessage(content: string): {
	content: string;
	uiComponent?: UiComponentType;
} {
	const match = content.match(UI_MARKER);
	const uiComponent = match
		? (match[match.length - 1]
				.replace("[[UI:", "")
				.replace("]]", "") as UiComponentType)
		: undefined;
	const cleaned = content.replace(UI_MARKER, "").trim();

	return { content: cleaned, uiComponent };
}

function getMessageText(message: ChatMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");
}

function getSources(message: ChatMessage): SourceSection[] | undefined {
	const sections = message.parts
		.filter(
			(part): part is { type: "data-sources"; data: SourceSection[] } =>
				part.type === "data-sources",
		)
		.flatMap((part) => (Array.isArray(part.data) ? part.data : []));

	return sections.length ? sections : undefined;
}

export default function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(
		null,
	);
	const [reportFileName, setReportFileName] = useState<string | null>(null);
	const [reportError, setReportError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const endRef = useRef<HTMLDivElement | null>(null);
	const params = useParams();
	const pathname = usePathname();

	const isCasePage = pathname?.includes("/cases/") ?? false;
	const isAlertsPage = pathname?.includes("/alerts") ?? false;
	const currentAlertId = (params?.id as string | undefined) ?? undefined;
	const chatId = isCasePage
		? `case-${currentAlertId ?? "unknown"}`
		: "dashboard";

	const initialMessages = useMemo<InitialMessage[]>(
		() => [
			{
				id: "welcome",
				role: "assistant",
				parts: [
					{
						type: "text",
						text: isCasePage
							? "Case Focus Mode Active. I have loaded the suspect's transaction history. What are we looking for?"
							: "Command Center Online. I can help you filter alerts or explain compliance policies.",
					},
				],
			},
		],
		[isCasePage],
	);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/chat",
				body: {
					alertId: isCasePage ? currentAlertId : undefined,
					pageContext: isCasePage ? "investigation" : "dashboard",
				},
			}),
		[currentAlertId, isCasePage],
	);

	const { messages, sendMessage, status } = useChat<ChatMessage>({
		transport,
		id: chatId,
		messages: initialMessages,
	});

	const parsedMessages: ParsedMessage[] = useMemo(
		() =>
			messages.map((message) => {
				const parsed = parseMessage(getMessageText(message));
				return {
					id: message.id,
					role: message.role,
					content: parsed.content,
					uiComponent: parsed.uiComponent,
					sources: getSources(message),
				};
			}),
		[messages],
	);

	const isThinking = status === "submitted" || status === "streaming";

	const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || status === "streaming") return;
		setInput("");
		await sendMessage({ text: trimmed });
	};

	const handleUiAction = async (type: UiComponentType) => {
		if (type !== "REPORT") return;

		if (!currentAlertId || isGeneratingReport) {
			setReportError("No alert selected for report generation.");
			return;
		}

		setReportError(null);
		setIsGeneratingReport(true);
		try {
			const response = await fetch("/api/sar", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ alertId: currentAlertId }),
			});
			if (!response.ok) {
				throw new Error("Failed to generate SAR report");
			}
			const report = (await response.json()) as SarResponse;
			const pdfBlob = await buildSarPdf(report, "/case-pilot-logo.webp");
			const nextUrl = URL.createObjectURL(pdfBlob);
			if (reportDownloadUrl) {
				URL.revokeObjectURL(reportDownloadUrl);
			}
			setReportDownloadUrl(nextUrl);
			setReportFileName(`sar-report-${report.subjectId}.pdf`);
		} catch (error) {
			setReportError(
				error instanceof Error ? error.message : "Failed to generate report",
			);
		} finally {
			setIsGeneratingReport(false);
		}
	};

	useEffect(() => {
		return () => {
			if (reportDownloadUrl) {
				URL.revokeObjectURL(reportDownloadUrl);
			}
		};
	}, [reportDownloadUrl]);

	useEffect(() => {
		if (!isOpen) return;
		endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [isOpen, parsedMessages.length, status]);

	if (!isCasePage && !isAlertsPage) {
		return null;
	}

	return (
		<div className="fixed bottom-10 right-6 z-50">
			{isOpen && (
				<div className="mb-3 w-[320px] rounded-xl border border-border bg-card shadow-xl">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div>
							<p className="text-sm font-semibold text-foreground">CasePilot</p>
							<p className="text-xs text-muted-foreground">
								{isCasePage ? "Investigation Mode" : "Triage Mode"}
							</p>
						</div>
						<Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
							Close
						</Button>
					</div>
					<div
						ref={scrollRef}
						className="max-h-90 space-y-4 overflow-y-auto px-4 py-3"
					>
						{parsedMessages.map((message) => (
							<div key={message.id} className="space-y-2">
								<div
									className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground"
									}`}
								>
									{message.role === "user" ? (
										message.content
									) : (
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											components={{
												p: ({ children }) => (
													<p className="mb-2 last:mb-0">{children}</p>
												),
												ul: ({ children }) => (
													<ul className="mb-2 list-disc pl-5">{children}</ul>
												),
												ol: ({ children }) => (
													<ol className="mb-2 list-decimal pl-5">{children}</ol>
												),
												li: ({ children }) => (
													<li className="mb-1">{children}</li>
												),
											}}
										>
											{message.content}
										</ReactMarkdown>
									)}
								</div>
								{message.sources?.length ? (
									<Accordion type="single" collapsible>
										<AccordionItem value="sources">
											<AccordionTrigger>Sources</AccordionTrigger>
											<AccordionContent>
												<div className="space-y-3">
													{message.sources.map((section) => (
														<div key={section.title}>
															<p className="text-xs font-semibold text-foreground">
																{section.title}
															</p>
															<ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
																{section.items.map((item, index) => (
																	<li key={`${section.title}-${index}`}>
																		{item}
																	</li>
																))}
															</ul>
														</div>
													))}
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								) : null}
								{message.uiComponent && (
									<div className="flex items-center gap-2">
										<Badge variant="outline">Suggested</Badge>
										<Button
											size="sm"
											variant="secondary"
											onClick={() => handleUiAction(message.uiComponent!)}
										>
											{message.uiComponent}
										</Button>
									</div>
								)}
							</div>
						))}
						{isThinking && (
							<div className="self-start rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
									<span
										className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
										style={{ animationDelay: "0.15s" }}
									/>
									<span
										className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
										style={{ animationDelay: "0.3s" }}
									/>
								</div>
							</div>
						)}
						{reportDownloadUrl && (
							<div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
								<div className="flex items-center justify-between">
									<span className="font-semibold text-foreground">
										SAR report ready
									</span>
									<a
										href={reportDownloadUrl}
										download={reportFileName ?? "sar-report.pdf"}
										className="text-primary"
									>
										Download PDF
									</a>
								</div>
							</div>
						)}
						{reportError && (
							<p className="text-xs text-destructive">{reportError}</p>
						)}
						<div ref={endRef} />
					</div>
					<form
						onSubmit={handleSubmit}
						className="border-t border-border px-4 py-3"
					>
						<div className="flex items-center gap-2">
							<input
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder={
									isCasePage
										? "Ask about this case..."
										: "Ask about alerts or policy..."
								}
								className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-xs"
								aria-label="Chat input"
							/>
							<Button
								type="submit"
								size="sm"
								disabled={status === "streaming" || isGeneratingReport}
							>
								Send
							</Button>
						</div>
					</form>
				</div>
			)}

			<Button
				className={`h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg ${isOpen ? "hidden" : ""}`}
				onClick={() => setIsOpen((open) => !open)}
			>
				💬
			</Button>
		</div>
	);
}
