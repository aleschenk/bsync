// Storage Manager Module - Refactored with Strategy Pattern
import { GoogleDriveProvider } from './storage-providers/google-drive-provider';
import { BSyncServerProvider } from './storage-providers/bsync-server-provider';
import { StorageType, StorageProvider, SessionData } from '../types';

export class StorageManager {
    private storageType: StorageType = 'google-drive';
    private providers: Record<StorageType, StorageProvider>;
    private currentProvider: StorageProvider;

    constructor() {
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
    setStorageType(type: StorageType): void {
        if (!this.providers[type]) {
            throw new Error(`Tipo de almacenamiento no soportado: ${type}`);
        }
        this.storageType = type;
        this.currentProvider = this.providers[type];
    }

    // Configurar URL del servidor BSync
    setBSyncServerUrl(url: string): void {
        const bsyncProvider = this.providers['bsync-server'] as BSyncServerProvider;
        if (bsyncProvider) {
            bsyncProvider.setServerUrl(url);
        }
    }

    // Configurar ID de cuenta
    setAccountId(accountId: string): void {
        const bsyncProvider = this.providers['bsync-server'] as BSyncServerProvider;
        if (bsyncProvider) {
            bsyncProvider.setAccountId(accountId);
        }
    }

    // Obtener tipo de almacenamiento actual
    getStorageType(): StorageType {
        return this.storageType;
    }

    // Obtener el proveedor actual
    getCurrentProvider(): StorageProvider {
        return this.currentProvider;
    }

    // Autenticar usando el proveedor actual
    async authenticate(): Promise<boolean> {
        return await this.currentProvider.authenticate();
    }

    // Probar conexión usando el proveedor actual
    async testConnection(): Promise<boolean> {
        if (this.currentProvider.testConnection) {
            return await this.currentProvider.testConnection();
        }
        return await this.currentProvider.authenticate();
    }

    // Guardar datos usando el proveedor actual
    async saveData(filename: string, data: SessionData): Promise<boolean> {
        return await this.currentProvider.saveData(filename, data);
    }

    // Cargar datos usando el proveedor actual
    async loadData(filename: string): Promise<SessionData> {
        return await this.currentProvider.loadData(filename);
    }

    // Eliminar datos usando el proveedor actual
    async deleteData(filename: string): Promise<boolean> {
        return await this.currentProvider.deleteData(filename);
    }

    // Obtener todas las sesiones disponibles usando el proveedor actual
    async getAllSessions(): Promise<string[]> {
        return await this.currentProvider.getAllSessions();
    }

    // Guardar sesiones (método específico para Google Drive)
    async saveSessions(sessions: string[], currentSession: string): Promise<boolean> {
        const googleProvider = this.providers['google-drive'] as GoogleDriveProvider;
        if (this.storageType === 'google-drive' && googleProvider.saveSessions) {
            return await googleProvider.saveSessions(sessions, currentSession);
        }
        // Para BSync server, no necesitamos guardar metadatos de sesiones
        return true;
    }

    // Crear cuenta (método específico para BSync Server)
    async createAccount(accountId: string): Promise<boolean> {
        const bsyncProvider = this.providers['bsync-server'] as BSyncServerProvider;
        if (this.storageType === 'bsync-server' && bsyncProvider.createAccount) {
            return await bsyncProvider.createAccount(accountId);
        }
        return true;
    }

    // Obtener nombre del proveedor actual
    getProviderName(): string {
        return this.currentProvider.getProviderName();
    }

    // Métodos de conveniencia para obtener configuración
    getBSyncServerUrl(): string | null {
        const bsyncProvider = this.providers['bsync-server'] as BSyncServerProvider;
        if (bsyncProvider) {
            return bsyncProvider.getServerUrl();
        }
        return null;
    }

    getAccountId(): string | null {
        const bsyncProvider = this.providers['bsync-server'] as BSyncServerProvider;
        if (bsyncProvider) {
            return bsyncProvider.getAccountId();
        }
        return null;
    }
}
