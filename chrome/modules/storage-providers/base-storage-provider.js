// Base Storage Provider Interface
export class BaseStorageProvider {
    constructor(config = {}) {
        this.config = config;
    }

    // Métodos que deben ser implementados por las clases hijas
    async authenticate() {
        throw new Error('authenticate() method must be implemented');
    }

    async saveData(filename, data) {
        throw new Error('saveData() method must be implemented');
    }

    async loadData(filename) {
        throw new Error('loadData() method must be implemented');
    }

    async deleteData(filename) {
        throw new Error('deleteData() method must be implemented');
    }

    async getAllSessions() {
        throw new Error('getAllSessions() method must be implemented');
    }

    // Método opcional para probar conexión
    async testConnection() {
        return await this.authenticate();
    }

    // Método para obtener el nombre del proveedor
    getProviderName() {
        throw new Error('getProviderName() method must be implemented');
    }
}
