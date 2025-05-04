import { Logger } from '@skyra/logger';
import { existsSync, watch, type WatchEventType } from 'node:fs';
import { mkdir, rename, stat } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';

class FSError extends Error {
	public code: string;

	public constructor(message: string, code: string) {
		super(message);
		this.code = code;
	}
}

const logger = new Logger({ level: Logger.Level.Info });

let configFilePath: string | null = null;

switch (platform()) {
	case 'win32':
		configFilePath = join(process.env.LOCALAPPDATA ?? process.env.APPDATA ?? 'C:\\', 'ffxiv-auto-screenshot-sorter', 'config.toml');
		break;
	case 'linux':
	case 'darwin':
		configFilePath = join(homedir(), '.config', 'ffxiv-auto-screenshot-sorter', 'config.toml');
		break;
	default:
		logger.fatal(`Unsupported platform: ${platform}`);
		process.exit(1);
}

(async () => {
	const { config } = await import(configFilePath);

	const screenshotDir = config.screenshots;
	const sortedDir = config.sorted;

	try {
		const [screenshotStats, sortedStats] = await Promise.all([stat(resolve(screenshotDir)), stat(resolve(sortedDir))]);

		if (!screenshotStats.isDirectory()) {
			logger.fatal('Screenshot path exists but is not a directory');
			process.exit(1);
		}

		if (!sortedStats.isDirectory()) {
			logger.fatal('Sorted path exists but is not a directory');
			process.exit(1);
		}
	} catch (error) {
		if (error instanceof Error) {
			logger.fatal(`Directory validation failed: ${error.message}`);
			process.exit(1);
		}

		throw error;
	}

	const MAX_RETRIES = config.retries ?? 5;
	const RETRY_DELAY = (config.retry_delay ?? 2) * 1_000; // in milliseconds

	async function moveFileWithRetry(filePath: string, targetDir: string, filename: string, retries = 0): Promise<void> {
		try {
			const fileStats = await stat(filePath);
			if (fileStats.isFile()) {
				const creationDate = new Date(fileStats.birthtime);
				const yearMonth = `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}`;
				const targetDir = resolve(sortedDir, yearMonth);

				// eslint-disable-next-line n/no-sync
				const targetDirExists = existsSync(targetDir);

				if (!targetDirExists) {
					await mkdir(targetDir, { recursive: true });
				}

				await rename(filePath, resolve(targetDir, filename));
				logger.info(`Moved ${filename} to ${targetDir}`);
			}
		} catch (error) {
			if (error instanceof Error) {
				if ((error as FSError).code === 'EBUSY' && retries < MAX_RETRIES) {
					logger.warn(`EBUSY error encountered. Retrying ${filename}... (${retries + 1}/${MAX_RETRIES})`);
					await setTimeout(RETRY_DELAY);
					return moveFileWithRetry(filePath, targetDir, filename, retries + 1);
				}

				logger.error(`Failed to process ${filename}: ${error.message}`);
			}

			throw error;
		}
	}

	const watcher = watch(screenshotDir, async (event: WatchEventType, filename: string | null) => {
		if (filename && event === 'rename') {
			const filePath = resolve(screenshotDir, filename);
			logger.info('Detected new file: at file path: ', filePath);

			try {
				const fileStats = await stat(filePath);
				if (fileStats.isFile()) {
					logger.info('Detected new file: ', filename, 'at file path: ', filePath);
					await moveFileWithRetry(filePath, sortedDir, filename);
				}
			} catch (error) {
				if (error instanceof Error) {
					if ((error as FSError).code === 'ENOENT') {
						logger.warn(`File ${filename} no longer exists. Ignoring...`);
					} else {
						logger.error(`Error processing file ${filename}: ${error.message}`);
					}
				}
			}
		}
	});

	process.on('SIGINT', () => {
		watcher.close();
		process.exit(0);
	});

	logger.info(`Watching ${screenshotDir} for new screenshots...`);
})();
