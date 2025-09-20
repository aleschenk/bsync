// BSync Server Storage Provider
import { BaseStorageProvider } from './base-storage-provider.js';

export class BSyncServerProvider extends BaseStorageProvider {
    constructor(config = {}) {
        super(config);
        this.serverUrl = config.serverUrl || 'http://localhost:2544';
        this.accountId = config.accountId || 'default-user';
    }

    async authenticate() {
        return await this.testConnection();
    }

    async testConnection() {
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

    async saveData(sessionId, data) {
        try {
            const response = await fetch(`${this.serverUrl}/accounts/${this.accountId}/sessions/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
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

    async loadData(sessionId) {
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

            return await response.json();
        } catch (error) {
            console.error('Error loading from BSync server:', error);
            throw error;
        }
    }

    async deleteData(sessionId) {
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

    async getAllSessions() {
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

    async createAccount(accountId) {
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
    setServerUrl(url) {
        this.serverUrl = url;
    }

    setAccountId(accountId) {
        this.accountId = accountId;
    }

    getServerUrl() {
        return this.serverUrl;
    }

    getAccountId() {
        return this.accountId;
    }

    getProviderName() {
        return 'Servidor BSync';
    }
}
