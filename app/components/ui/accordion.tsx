"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/utils/classname.util";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = ({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) => (
	<AccordionPrimitive.Item
		className={cn("border-b border-border", className)}
		{...props}
	/>
);

const AccordionTrigger = ({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) => (
	<AccordionPrimitive.Header className="flex">
		<AccordionPrimitive.Trigger
			className={cn(
				"flex flex-1 items-center justify-between py-2 text-left text-xs font-semibold text-foreground transition-all hover:text-foreground/80",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
		</AccordionPrimitive.Trigger>
	</AccordionPrimitive.Header>
);

const AccordionContent = ({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) => (
	<AccordionPrimitive.Content
		className={cn(
			"overflow-hidden text-xs text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
			className,
		)}
		{...props}
	>
		<div className="pb-3 pt-1">{children}</div>
	</AccordionPrimitive.Content>
);

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
