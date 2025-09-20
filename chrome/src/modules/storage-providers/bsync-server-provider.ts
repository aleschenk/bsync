// BSync Server Storage Provider
import { BaseStorageProvider } from './base-storage-provider';
import { StorageConfig, SessionData } from '../../types';

export class BSyncServerProvider extends BaseStorageProvider {
    private serverUrl: string;
    private accountId: string;

    constructor(config: StorageConfig = {}) {
        super(config);
        this.serverUrl = config.serverUrl || 'http://localhost:2544';
        this.accountId = config.accountId || 'default-user';
    }

    async authenticate(): Promise<boolean> {
        return await this.testConnection();
    }

    override async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.serverUrl}/accounts/${this.accountId}/sessions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error testing BSync connection:', error);
            return false;
        }
    }

    async saveData(sessionId: string, data: SessionData): Promise<boolean> {
        try {
            const response = await fetch(`${this.serverUrl}/accounts/${this.accountId}/sessions/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data.tabs)
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error saving to BSync server:', error);
            throw error;
        }
    }

    async loadData(sessionId: string): Promise<SessionData> {
        try {
            const response = await fetch(`${this.serverUrl}/accounts/${this.accountId}/sessions/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const tabs = await response.json();
            return {
                tabs: tabs,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error loading from BSync server:', error);
            throw error;
        }
    }

    async deleteData(sessionId: string): Promise<boolean> {
        try {
            // El servidor BSync no tiene endpoint de eliminación en la API actual
            // Podríamos implementar esto en el servidor o simplemente retornar true
            // Por ahora, retornamos true ya que la funcionalidad principal es guardar/cargar
            console.log(`Sesión ${sessionId} marcada para eliminación (no implementado en servidor)`);
            return true;
        } catch (error) {
            console.error('Error deleting from BSync server:', error);
            throw error;
        }
    }

    async getAllSessions(): Promise<string[]> {
        try {
            const response = await fetch(`${this.serverUrl}/accounts/${this.accountId}/sessions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const sessions = await response.json();
            return sessions.length > 0 ? sessions : ['default'];
        } catch (error) {
            console.error('Error getting sessions from BSync server:', error);
            return ['default'];
        }
    }

    async createAccount(accountId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.serverUrl}/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `id=${accountId}`
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error creating BSync account:', error);
            throw error;
        }
    }

    // Métodos específicos para configuración
    setServerUrl(url: string): void {
        this.serverUrl = url;
    }

    setAccountId(accountId: string): void {
        this.accountId = accountId;
    }

    getServerUrl(): string {
        return this.serverUrl;
    }

    getAccountId(): string {
        return this.accountId;
    }

    getProviderName(): string {
        return 'Servidor BSync';
    }
}
