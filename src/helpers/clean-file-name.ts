export function cleanFileName(fileName: string) {
	return fileName.replace(/%[0-9A-F]{2}/gi, "_");
}
