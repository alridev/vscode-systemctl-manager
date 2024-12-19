import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);

export interface IService {
    name: string;
    status: 'active' | 'inactive' | 'failed';
    isEnabled: boolean;
    description?: string;
}

export class SystemctlService {
    private static instance: SystemctlService;
    private favoriteServices: Set<string>;
    private context: vscode.ExtensionContext;
    private favoriteServicesOrder: string[] = [];
    private searchFilter: string = '';

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.favoriteServices = new Set<string>();
        this.loadFavorites();
        this.loadFavoriteOrder();
    }

    static getInstance(context?: vscode.ExtensionContext): SystemctlService {
        if (!SystemctlService.instance && context) {
            SystemctlService.instance = new SystemctlService(context);
        }
        return SystemctlService.instance;
    }

    async getServices(): Promise<IService[]> {
        try {
            Logger.debug('Fetching services list');
            const [units, enabled] = await Promise.all([
                this.listUnits(),
                this.listEnabled()
            ]);

            const services = await this.parseServiceList(units);
            const enabledSet = new Set(enabled);

            Logger.debug('Services fetched successfully', { count: services.length });
            return services.map((service: IService) => ({
                ...service,
                isEnabled: enabledSet.has(service.name)
            }));
        } catch (error) {
            Logger.error('Failed to get services list', error);
            vscode.window.showErrorMessage('Failed to get services list');
            return [];
        }
    }

    private async listUnits(): Promise<string> {
        const { stdout } = await execAsync('systemctl list-units --type=service --all --no-pager');
        return stdout;
    }

    private async listEnabled(): Promise<string[]> {
        try {
            const { stdout } = await execAsync('systemctl list-unit-files --type=service --state=enabled --no-pager');
            return stdout.split('\n')
                .filter(line => line.includes('.service'))
                .map(line => line.split('.service')[0]);
        } catch {
            return [];
        }
    }

    private async parseServiceList(output: string): Promise<IService[]> {
        const services: IService[] = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            if (line.includes('.service')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    const name = parts[0].replace('.service', '');
                    const status = await this.getServiceStatus(name);
                    
                    services.push({
                        name,
                        status,
                        isEnabled: false,
                        description: parts.slice(4).join(' ')
                    });
                }
            }
        }
        
        return services;
    }

    private async getServiceStatus(serviceName: string): Promise<'active' | 'inactive' | 'failed'> {
        try {
            const { stdout } = await execAsync(`systemctl is-active ${serviceName}`);
            const status = stdout.trim();
            
            switch (status) {
                case 'active':
                    return 'active';
                case 'failed':
                    return 'failed';
                default:
                    return 'inactive';
            }
        } catch {
            return 'inactive';
        }
    }

    async startService(serviceName: string): Promise<void> {
        try {
            Logger.info(`Starting service: ${serviceName}`);
            await execAsync(`sudo systemctl start ${serviceName}`);
            vscode.window.showInformationMessage(`Service ${serviceName} started`);
            Logger.info(`Service started successfully: ${serviceName}`);
        } catch (error) {
            Logger.error(`Failed to start service: ${serviceName}`, error);
            vscode.window.showErrorMessage(`Failed to start ${serviceName}`);
        }
    }

    async stopService(serviceName: string): Promise<void> {
        try {
            await execAsync(`sudo systemctl stop ${serviceName}`);
            vscode.window.showInformationMessage(`Service ${serviceName} stopped`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop ${serviceName}`);
        }
    }

    async restartService(serviceName: string): Promise<void> {
        try {
            await execAsync(`sudo systemctl restart ${serviceName}`);
            vscode.window.showInformationMessage(`Service ${serviceName} restarted`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to restart ${serviceName}`);
        }
    }

    async toggleEnabled(serviceName: string): Promise<void> {
        try {
            const { stdout } = await execAsync(`systemctl is-enabled ${serviceName}`);
            const isEnabled = stdout.trim() === 'enabled';
            
            await execAsync(`sudo systemctl ${isEnabled ? 'disable' : 'enable'} ${serviceName}`);
            vscode.window.showInformationMessage(
                `Service ${serviceName} ${isEnabled ? 'disabled' : 'enabled'}`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to toggle ${serviceName} enabled state`);
        }
    }

    async viewLogs(serviceName: string): Promise<void> {
        const terminal = vscode.window.createTerminal(`Logs: ${serviceName}`);
        terminal.sendText(`journalctl -u ${serviceName} -f`);
        terminal.show();
    }

    async openConfig(serviceName: string): Promise<void> {
        try {
            const { stdout } = await execAsync(`systemctl show ${serviceName} -p FragmentPath`);
            const configPath = stdout.split('=')[1]?.trim();
            
            if (configPath) {
                const document = await vscode.workspace.openTextDocument(configPath);
                await vscode.window.showTextDocument(document);
            } else {
                throw new Error('Config file not found');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open config for ${serviceName}`);
        }
    }

    async reloadDaemon(): Promise<void> {
        try {
            await execAsync('sudo systemctl daemon-reload');
            vscode.window.showInformationMessage('Systemd daemon reloaded');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to reload systemd daemon');
        }
    }

    toggleFavorite(serviceName: string): void {
        if (this.favoriteServices.has(serviceName)) {
            this.favoriteServices.delete(serviceName);
            this.favoriteServicesOrder = this.favoriteServicesOrder.filter(s => s !== serviceName);
        } else {
            this.favoriteServices.add(serviceName);
            this.favoriteServicesOrder.push(serviceName);
        }
        this.saveFavorites();
        this.saveFavoriteOrder();
    }

    isFavorite(serviceName: string): boolean {
        return this.favoriteServices.has(serviceName);
    }

    getFavorites(): string[] {
        return this.favoriteServicesOrder.filter(name => this.favoriteServices.has(name));
    }

    private loadFavorites(): void {
        const favorites = this.context.globalState.get<string[]>('favoriteServices', []);
        this.favoriteServices = new Set(favorites);
    }

    private saveFavorites(): void {
        const favorites = Array.from(this.favoriteServices);
        this.context.globalState.update('favoriteServices', favorites);
    }

    getDefaultServiceConfig(serviceName: string): string {
        return `[Unit]
 Description=${serviceName} service
 After=network.target
 
 [Service]
 Type=simple
 User=nobody
 Group=nogroup
 WorkingDirectory=/
 ExecStart=/usr/local/bin/${serviceName}
 Restart=always
 RestartSec=3
 
 [Install]
 WantedBy=multi-user.target
 `;
    }

    setSearchFilter(filter: string): void {
        this.searchFilter = filter.toLowerCase();
    }

    getSearchFilter(): string {
        return this.searchFilter;
    }

    moveServiceUp(serviceName: string): void {
        const index = this.favoriteServicesOrder.indexOf(serviceName);
        if (index > 0) {
            const temp = this.favoriteServicesOrder[index - 1];
            this.favoriteServicesOrder[index - 1] = serviceName;
            this.favoriteServicesOrder[index] = temp;
            this.saveFavoriteOrder();
        }
    }

    moveServiceDown(serviceName: string): void {
        const index = this.favoriteServicesOrder.indexOf(serviceName);
        if (index >= 0 && index < this.favoriteServicesOrder.length - 1) {
            const temp = this.favoriteServicesOrder[index + 1];
            this.favoriteServicesOrder[index + 1] = serviceName;
            this.favoriteServicesOrder[index] = temp;
            this.saveFavoriteOrder();
        }
    }

    private saveFavoriteOrder(): void {
        this.context.globalState.update('favoriteServicesOrder', this.favoriteServicesOrder);
    }

    private loadFavoriteOrder(): void {
        this.favoriteServicesOrder = this.context.globalState.get<string[]>('favoriteServicesOrder', []);
    }
} 