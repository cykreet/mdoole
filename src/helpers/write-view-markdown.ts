import { findUp } from "find-up";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { join, relative } from "node:path";
import type { Page } from "puppeteer";
import { cleanFileName } from "./clean-file-name";
import { COURSE_IMAGE_REGEX, OUT_DIRECTORY } from "../constants";

export async function writeViewMarkdown(page: Page, directory: string = OUT_DIRECTORY, book = false) {
	const courseBody = await page.waitForSelector("div[role='main']");
	let html = await courseBody?.evaluate((el) => el.innerHTML);
	if (html == undefined) throw new Error("Could not find course body");
	// match image src in course view and replace with image output directory
	const imageSrcMatch = html.match(COURSE_IMAGE_REGEX);

	const sectionTitle = await page.$eval("div[id='page-navbar'] nav ol li:nth-child(2) a", (el) => el.textContent);
	const viewTitle = await page.$eval("h1", (el) => el.textContent);
	const chapterTitle = await page.$eval("div.book_toc li strong", (el) => el.textContent).catch(() => null);
	// book-based views contain multiple chapters, so if we're in a book view, we need to use the chapter title as the file name
	const fileName = book ? chapterTitle : viewTitle;

	const fileDirectory = book ? `${directory}/${sectionTitle}/${viewTitle}` : `${directory}/${sectionTitle}`;
	const filePath = join(process.cwd(), fileDirectory);
	if (imageSrcMatch) {
		for (const src of imageSrcMatch) {
			const fileName = src.split("/").pop();
			if (fileName == undefined) continue;
			const cleanName = cleanFileName(fileName);
			// go up in directory to find images directory for new source
			const imagesDirectory = await findUp("images", { cwd: filePath, type: "directory" });
			if (imagesDirectory === undefined) continue;
			const imagesPath = relative(filePath, imagesDirectory);
			html = html?.replaceAll(src, `${imagesPath}/${cleanName}`);
		}
	}

	// todo: markdown urls on their own are being demolished for some reason
	const markdown = NodeHtmlMarkdown.translate(html);
	await Bun.write(`${filePath}/${fileName?.replaceAll("/", "-") ?? "Unknown"}.md`, markdown);
}
