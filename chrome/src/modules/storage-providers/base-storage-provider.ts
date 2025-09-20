// Base Storage Provider Interface
import { StorageProvider, StorageConfig, SessionData } from '../../types';

export abstract class BaseStorageProvider implements StorageProvider {
    protected config: StorageConfig;

    constructor(config: StorageConfig = {}) {
        this.config = config;
    }

    // Métodos que deben ser implementados por las clases hijas
    abstract authenticate(): Promise<boolean>;
    abstract saveData(filename: string, data: SessionData): Promise<boolean>;
    abstract loadData(filename: string): Promise<SessionData>;
    abstract deleteData(filename: string): Promise<boolean>;
    abstract getAllSessions(): Promise<string[]>;
    abstract getProviderName(): string;

    // Método opcional para probar conexión
    async testConnection(): Promise<boolean> {
        return await this.authenticate();
    }
}
