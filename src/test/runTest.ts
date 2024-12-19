import * as path from 'path';
import * as cp from 'child_process';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // Путь к расширению
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        
        // Путь к тестам
        const extensionTestsPath = path.resolve(__dirname, './suite');

        // Запускаем тесты
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main(); 