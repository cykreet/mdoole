import { loadEnv } from "./helpers/load-env";

export const HOST_URL = loadEnv("HOST_URL");
export const MICROSOFT_LOGIN_EMAIL = loadEnv("MICROSOFT_LOGIN_EMAIL");
export const MICROSOFT_LOGIN_PASSWORD = loadEnv("MICROSOFT_LOGIN_PASSWORD");
export const COURSE_IDS = loadEnv("COURSE_IDS")
	.split(",")
	.map((id) => Number.parseInt(id, 10));
export const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
export const OUT_DIRECTORY = "out";

export const COURSE_IMAGE_REGEX = new RegExp(/(https:\/\/.*\/mod_(?:book|page)\/.*\.(?:png|jpg|jpeg|gif|webp))/g);
