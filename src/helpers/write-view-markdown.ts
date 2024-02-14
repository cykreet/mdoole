import type { Page } from "puppeteer";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { HOST_URL } from "../constants";
import { cleanFileName } from "./clean-file-name";
import { findUp } from "find-up";
import { join, relative } from "path";

export async function writeViewMarkdown(page: Page, directory: string, viewId: string) {
	await page.goto(`${HOST_URL}/mod/page/view.php?id=${viewId}`);
	const courseBody = await page.waitForSelector("div[role='main']");
	let html = await courseBody?.evaluate((el) => el.innerHTML);
	if (html == undefined) throw new Error("Could not find course body");
	// match image src containing mod_page/content and replace with image output directory
	const imageSrcMatch = html.match(/(https:\/\/.*\/mod_page\/content\/.*\.(png|jpg|jpeg|gif|webp))/g);

	const sectionTitle = await page.$eval("div[id='page-navbar'] nav ol li:nth-child(2) a", (el) => el.textContent);
	const title = await page.waitForSelector("h1");
	// todo: remove any special characters from title
	const titleText = await title?.evaluate((el) => el.textContent);
	const filePath = join(process.cwd(), `${directory}/${sectionTitle}`);
	if (imageSrcMatch) {
		for (const src of imageSrcMatch) {
			const fileName = src.split("/").pop();
			if (fileName == undefined) continue;
			const cleanName = cleanFileName(fileName);
			// go up in directory to find images directory for new source
			const imagesDirectory = await findUp("images", { cwd: filePath, type: "directory" });
			if (imagesDirectory === undefined) continue;
			const imagesPath = relative(filePath, imagesDirectory);
			html = html.replace(src, `${imagesPath}/${cleanName}`);
		}
	}

	const markdown = NodeHtmlMarkdown.translate(html);
	await Bun.write(`${filePath}/${titleText}.md`, markdown);
}
