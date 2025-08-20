import promptSync from "prompt-sync";
import chalk from "chalk";

const prompt = promptSync();

export async function retryOperation(operation: any, retries = 3, delayMs = 1000) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (attempt < retries) {
				console.error(chalk.red(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`));
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			} else {
				console.error(chalk.red(`Operation failed after ${retries} attempts.`));
				throw error;
			}
		}
	}
}

export async function pause() {
	prompt(chalk.blue("Press any key to continue..."));
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
