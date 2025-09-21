// Google Drive API Implementation
export class GoogleDriveAPI {
    private accessToken: string | null = null;

    async authenticate(): Promise<boolean> {
        try {
            // Use Chrome Identity API for OAuth
            return new Promise((resolve) => {
                chrome.identity.getAuthToken({ interactive: true }, (token) => {
                    if (chrome.runtime.lastError) {
                        console.error('Auth error:', chrome.runtime.lastError);
                        resolve(false);
                    } else {
                        this.accessToken = token || null;
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    async saveToDrive(filename: string, data: any): Promise<boolean> {
        try {
            if (!this.accessToken) {
                const authenticated = await this.authenticate();
                if (!authenticated) return false;
            }

            const fileContent = JSON.stringify(data, null, 2);
            const blob = new Blob([fileContent], { type: 'application/json' });

            // First, try to find existing file
            const existingFileId = await this.findFile(filename);
            
            if (existingFileId) {
                // Update existing file
                return await this.updateFile(existingFileId, blob);
            } else {
                // Create new file
                return await this.createFile(filename, blob);
            }
        } catch (error) {
            console.error('Save to Drive failed:', error);
            return false;
        }
    }

    async loadFromDrive(filename: string): Promise<any> {
        try {
            if (!this.accessToken) {
                const authenticated = await this.authenticate();
                if (!authenticated) throw new Error('Authentication failed');
            }

            const fileId = await this.findFile(filename);
            if (!fileId) {
                throw new Error('File not found');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Load from Drive failed:', error);
            throw error;
        }
    }

    async deleteFile(filename: string): Promise<boolean> {
        try {
            if (!this.accessToken) {
                const authenticated = await this.authenticate();
                if (!authenticated) return false;
            }

            const fileId = await this.findFile(filename);
            if (!fileId) {
                return true; // File doesn't exist, consider it deleted
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Delete file failed:', error);
            return false;
        }
    }

    private async findFile(filename: string): Promise<string | null> {
        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${filename}'&fields=files(id,name)`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.files.length > 0 ? data.files[0].id : null;
        } catch (error) {
            console.error('Find file failed:', error);
            return null;
        }
    }

    private async createFile(filename: string, blob: Blob): Promise<boolean> {
        try {
            const metadata = {
                name: filename,
                parents: ['appDataFolder'] // Store in app-specific folder
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            });

            return response.ok;
        } catch (error) {
            console.error('Create file failed:', error);
            return false;
        }
    }

    private async updateFile(fileId: string, blob: Blob): Promise<boolean> {
        try {
            const form = new FormData();
            form.append('file', blob);

            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: blob
            });

            return response.ok;
        } catch (error) {
            console.error('Update file failed:', error);
            return false;
        }
    }
}

// Export for module usage
export default GoogleDriveAPI;
