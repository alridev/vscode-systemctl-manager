import * as assert from 'assert';
import { SystemctlService } from '../service';
import * as vscode from 'vscode';
import { expect } from 'chai';

// Мок для vscode.ExtensionContext
const mockContext: Partial<vscode.ExtensionContext> = {
    globalState: {
        get: (_key: string) => [],
        update: (_key: string, _value: any) => Promise.resolve(),
    } as any
};

describe('SystemctlService', () => {
    let service: SystemctlService;

    beforeEach(() => {
        service = SystemctlService.getInstance(mockContext as vscode.ExtensionContext);
    });

    describe('getServices', () => {
        it('should return list of services', async () => {
            const services = await service.getServices();
            expect(services).to.be.an('array');
            if (services.length > 0) {
                expect(services[0]).to.have.property('name');
                expect(services[0]).to.have.property('status');
                expect(services[0]).to.have.property('isEnabled');
            }
        });
    });

    describe('favorites', () => {
        it('should add and remove services from favorites', () => {
            const testService = 'test-service';
            
            service.toggleFavorite(testService);
            expect(service.isFavorite(testService)).to.be.true;
            
            service.toggleFavorite(testService);
            expect(service.isFavorite(testService)).to.be.false;
        });

        it('should return list of favorites', () => {
            const testServices = ['service1', 'service2'];
            
            testServices.forEach(s => service.toggleFavorite(s));
            const favorites = service.getFavorites();
            
            expect(favorites).to.have.members(testServices);
        });
    });
}); 