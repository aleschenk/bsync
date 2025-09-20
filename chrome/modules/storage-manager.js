// Storage Manager Module - Refactored with Strategy Pattern
import { GoogleDriveProvider } from './storage-providers/google-drive-provider.js';
import { BSyncServerProvider } from './storage-providers/bsync-server-provider.js';

export class StorageManager {
    constructor() {
        this.storageType = 'google-drive';
        this.providers = {
            'google-drive': new GoogleDriveProvider(),
            'bsync-server': new BSyncServerProvider({
                serverUrl: 'http://localhost:2544',
                accountId: 'default-user'
            })
        };
        this.currentProvider = this.providers[this.storageType];
    }

    // Configurar tipo de almacenamiento
    setStorageType(type) {
        if (!this.providers[type]) {
            throw new Error(`Tipo de almacenamiento no soportado: ${type}`);
        }
        this.storageType = type;
        this.currentProvider = this.providers[type];
    }

    // Configurar URL del servidor BSync
    setBSyncServerUrl(url) {
        if (this.providers['bsync-server']) {
            this.providers['bsync-server'].setServerUrl(url);
        }
    }

    // Configurar ID de cuenta
    setAccountId(accountId) {
        if (this.providers['bsync-server']) {
            this.providers['bsync-server'].setAccountId(accountId);
        }
    }

    // Obtener tipo de almacenamiento actual
    getStorageType() {
        return this.storageType;
    }

    // Obtener el proveedor actual
    getCurrentProvider() {
        return this.currentProvider;
    }

    // Autenticar usando el proveedor actual
    async authenticate() {
        return await this.currentProvider.authenticate();
    }

    // Probar conexión usando el proveedor actual
    async testConnection() {
        return await this.currentProvider.testConnection();
    }

    // Guardar datos usando el proveedor actual
    async saveData(filename, data) {
        return await this.currentProvider.saveData(filename, data);
    }

    // Cargar datos usando el proveedor actual
    async loadData(filename) {
        return await this.currentProvider.loadData(filename);
    }

    // Eliminar datos usando el proveedor actual
    async deleteData(filename) {
        return await this.currentProvider.deleteData(filename);
    }

    // Obtener todas las sesiones disponibles usando el proveedor actual
    async getAllSessions() {
        return await this.currentProvider.getAllSessions();
    }

    // Guardar sesiones (método específico para Google Drive)
    async saveSessions(sessions, currentSession) {
        if (this.storageType === 'google-drive' && this.currentProvider.saveSessions) {
            return await this.currentProvider.saveSessions(sessions, currentSession);
        }
        // Para BSync server, no necesitamos guardar metadatos de sesiones
        return true;
    }

    // Crear cuenta (método específico para BSync Server)
    async createAccount(accountId) {
        if (this.storageType === 'bsync-server' && this.currentProvider.createAccount) {
            return await this.currentProvider.createAccount(accountId);
        }
        return true;
    }

    // Obtener nombre del proveedor actual
    getProviderName() {
        return this.currentProvider.getProviderName();
    }

    // Métodos de conveniencia para obtener configuración
    getBSyncServerUrl() {
        if (this.providers['bsync-server']) {
            return this.providers['bsync-server'].getServerUrl();
        }
        return null;
    }

    getAccountId() {
        if (this.providers['bsync-server']) {
            return this.providers['bsync-server'].getAccountId();
        }
        return null;
    }
}
