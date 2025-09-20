// Global type declarations
declare global {
    class GoogleDriveAPI {
        authenticate(): Promise<boolean>;
        saveToDrive(filename: string, data: any): Promise<boolean>;
        loadFromDrive(filename: string): Promise<any>;
        deleteFile(filename: string): Promise<boolean>;
    }
}

export {};
