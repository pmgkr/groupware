// import Link from "next/link";
// import { Link } from "react-router-dom";

import ModeToggle from "@/components/multiselect/mode-toggle";
import { ColorModeToggle } from "@/components/multiselect/color-mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export async function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background">
			<div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
				<div className="flex flex-1 items-center justify-end space-x-4">
					<nav className="flex items-center space-x-1">
						<a
							href="https://github.com/sersavan/shadcn-multi-select-component"
							target="_blank"
							rel="noreferrer">
							<div
								className={buttonVariants({
									size: "icon",
									variant: "ghost",
								})}>
								<Icons.gitHub className="h-5 w-5" />
								<span className="sr-only">GitHub</span>
							</div>
						</a>
						<ModeToggle />
						<ColorModeToggle />
					</nav>
				</div>
			</div>
		</header>
	);
}
