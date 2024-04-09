import type { Page } from "puppeteer";
import { HOST_URL, MICROSOFT_LOGIN_EMAIL, MICROSOFT_LOGIN_PASSWORD, OUT_DIRECTORY } from "../constants";

export async function authenticateMicrosoft(page: Page) {
	await page.goto(`${HOST_URL}/login/index.php`);
	const email = MICROSOFT_LOGIN_EMAIL;
	const password = MICROSOFT_LOGIN_PASSWORD;
	const microsoftLoginDetected = await page
		.waitForRequest((request) => request.url().includes("login.microsoftonline.com"), { timeout: 10000 })
		.catch(() => false);
	if (microsoftLoginDetected === false) {
		const alreadyLoggedIn = await page.waitForSelector("div.usermenu", { timeout: 4000 }).catch(() => false);
		if (alreadyLoggedIn) {
			console.log("Already logged in...");
			return;
		}
	}

	const existingLogin = await page.waitForSelector(`div[data-test-id='${email}`, { timeout: 4000 }).catch(() => false);
	if (existingLogin && typeof existingLogin === "object") {
		console.log("Selecting existing login...");
		await existingLogin?.click();
		const passwordInput = await page.waitForSelector("input[type=password]");
		await passwordInput?.type(password);
		const signInButton = await page.waitForSelector("input[value='Sign in']");
		await signInButton?.click();

		const staySignedInButton = await page.waitForSelector("input[value='Yes']");
		await staySignedInButton?.click();
	} else {
		console.log("Entering new login...");
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
