import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

export function useTasks() {
	const tasks = useQuery(api.tasks.get);

	return tasks;
}
