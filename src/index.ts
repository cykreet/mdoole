import puppeteer from "puppeteer";
import { COURSE_IDS, COURSE_IMAGE_REGEX, HOST_URL, OUT_DIRECTORY } from "./constants";
import { authenticateMicrosoft } from "./helpers/authenticate-microsoft";
import { cleanFileName } from "./helpers/clean-file-name";
import { ViewEndpoint, getCourseViews } from "./helpers/get-course-views";
import { writeViewMarkdown } from "./helpers/write-view-markdown";

const browser = await puppeteer.launch({
	userDataDir: "./user-data",
});
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", (request) => request.continue());
page.on("response", async (response) => {
	const courseImageMatch = COURSE_IMAGE_REGEX.test(response.url());
	if (courseImageMatch) {
		const fileName = response.url().split("/").pop();
		if (fileName == undefined) return;
		const cleanName = cleanFileName(fileName);
		const buffer = await response.buffer();
		await Bun.write(`${OUT_DIRECTORY}/images/${cleanName}`, buffer);
	}
});

await authenticateMicrosoft(page);
for (const courseId of COURSE_IDS) {
	const courseViews = await getCourseViews(page, courseId);
	await new Promise((resolve) => setTimeout(resolve, 3000));
	if (courseViews[0] == null) {
		console.error(`(${courseId}) Could not find valid course views`);
		continue;
	}

	for (const courseView of courseViews) {
		if (courseView == null) continue;
		const courseUrl = `${HOST_URL}/${courseView.endpoint}?id=${courseView.id}`;
		console.log(`Navigating to course view: ${courseUrl}`);
		await page.goto(courseUrl);
		await new Promise((resolve) => setTimeout(resolve, 3000));

		if (courseView.endpoint === ViewEndpoint.BOOK) {
			const chapterSection = await page.waitForSelector("div.book_toc");
			if (chapterSection == null) {
				console.error("Could not find chapter section");
				continue;
			}

			// write initial view markdown
			await writeViewMarkdown(page, `${OUT_DIRECTORY}/${courseId}`, true);
			console.log(`(${courseId}) Wrote markdown for view: ${courseView.id}`);

			const chapterLinks = await chapterSection.$$eval("a", (elements) =>
				elements.map((element) => element.getAttribute("href")),
			);

			for (const chapterLink of chapterLinks) {
				if (chapterLink == null) continue;
				await page.goto(`${HOST_URL}/${courseView.endpoint}/${chapterLink}`);
				await new Promise((resolve) => setTimeout(resolve, 3000));
				await writeViewMarkdown(page, `${OUT_DIRECTORY}/${courseId}`, true);
				const chapterId = chapterLink.split("chapterid=").pop();
				console.log(`(${courseId}) Wrote markdown for view, chapter id: ${courseView.id}, ${chapterId}`);
			}

			continue;
		}

		await writeViewMarkdown(page, `${OUT_DIRECTORY}/${courseId}`);
		console.log(`(${courseId}) Wrote markdown for view id: ${courseView.id}`);
	}
}

await browser.close();
