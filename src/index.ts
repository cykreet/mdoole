import puppeteer from "puppeteer";
import { COURSE_ID, HOST_URL, MICROSOFT_LOGIN_EMAIL, MICROSOFT_LOGIN_PASSWORD, OUT_DIRECTORY } from "./constants";
import { cleanFileName } from "./helpers/clean-file-name";
import { writeViewMarkdown } from "./helpers/write-view-markdown";

const browser = await puppeteer.launch({
	userDataDir: "./user-data",
});
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on("request", (request) => request.continue());
page.on("response", async (response) => {
	const imageMatch = response.url().match(/.*\.(png|jpg|jpeg|gif|webp)/);
	if (response.url().includes("mod_page/content") && imageMatch && imageMatch.length > 0) {
		const fileName = response.url().split("/").pop();
		if (fileName == undefined) return;
		const cleanName = cleanFileName(fileName);
		const buffer = await response.buffer();
		await Bun.write(`${OUT_DIRECTORY}/${COURSE_ID}/images/${cleanName}`, buffer);
	}
});

await page.goto(`${HOST_URL}/login/index.php`);
const email = MICROSOFT_LOGIN_EMAIL;
const password = MICROSOFT_LOGIN_PASSWORD;
const notLoggedIn = await page.waitForRequest((request) => request.url().includes("login.microsoftonline.com"), { timeout: 4000 }).catch(() => false);
const existingLogin = await page.waitForSelector(`div[data-test-id='${email}`, { timeout: 4000 }).catch(() => false);
if (notLoggedIn) {
	if (existingLogin && typeof existingLogin === "object") {
		await existingLogin?.click();
		const passwordInput = await page.waitForSelector("input[type=password]");
		await passwordInput?.type(password);
		const signInButton = await page.waitForSelector("input[value='Sign in']");
		await signInButton?.click();

		const staySignedInButton = await page.waitForSelector("input[value='Yes']");
		await staySignedInButton?.click();
	} else {
		const emailInput = await page.waitForSelector("input[type=email]");
		await emailInput?.type(email);
		const nextButton = await page.waitForSelector("input[value='Next']");
		await nextButton?.click();

		const passwordInput = await page.waitForSelector("input[type=password]");
		await passwordInput?.type(password);
		const signInButton = await page.waitForSelector("input[value='Sign in']");
		await signInButton?.click();

		const staySignedInButton = await page.waitForSelector("input[value='Yes']");
		await staySignedInButton?.click();
	}
}

await page.goto(`${HOST_URL}/course/view.php?id=${COURSE_ID}`);
await new Promise((resolve) => setTimeout(resolve, 3000));
const viewIds = await page.$$eval("a[href*='mod/page/view.php?id=']", (els) => els.map((el) => el.getAttribute("href")));
if (viewIds.length === 0) throw new Error("No view ids found");
for (const viewId of viewIds) {
	if (viewId == null) continue;
	const id = viewId.split("id=").pop();
	if (id == undefined) continue;
	await writeViewMarkdown(page, `${OUT_DIRECTORY}/${COURSE_ID}`, id);
	console.log(`Wrote markdown for view id: ${id}`);
	await new Promise((resolve) => setTimeout(resolve, 3000));
}

await browser.close();
