export function loadEnv(key: string): string {
	const value = Bun.env[key];
	if (value == undefined) throw new Error(`Environment variable "${key}" is not defined`);
	return value;
}
