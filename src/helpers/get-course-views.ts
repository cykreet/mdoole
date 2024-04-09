import type { Page } from "puppeteer";
import { HOST_URL } from "../constants";

export interface View {
	id: number;
	endpoint: ViewEndpoint;
}

export enum ViewEndpoint {
	BOOK = "mod/book/view.php",
	PAGE = "mod/page/view.php",
}

export async function getCourseViews(page: Page, courseId: number): Promise<Array<View | undefined>> {
	await page.goto(`${HOST_URL}/course/view.php?id=${courseId}`);
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const viewPageLinks = await page.$$eval(".courseindex-sectioncontent a[href*='mod/page/view.php?id=']", (elements) =>
		elements.map((element) => element.getAttribute("href")),
	);

	// views that contain chapters use a different endpoint
	const viewBookLinks = await page.$$eval(".courseindex-sectioncontent a[href*='mod/book/view.php?id=']", (elements) =>
		elements.map((element) => element.getAttribute("href")),
	);

	return [
		...viewPageLinks.map((link) => parseView(link, ViewEndpoint.PAGE)),
		...viewBookLinks.map((link) => parseView(link, ViewEndpoint.BOOK)),
	];
}

function parseView(link: string | null, type: ViewEndpoint): View | undefined {
	if (link == undefined) return;
	const id = link.split("id=").pop();
	if (id == undefined) return;
	return { id: Number(id), endpoint: type };
}
