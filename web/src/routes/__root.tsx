import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Theme } from "@radix-ui/themes";

export const Route = createRootRoute({
	component: () => (
		<Theme>
			<Outlet />
		</Theme>
	),
});
