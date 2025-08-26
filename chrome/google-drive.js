// Google Drive API helper functions
class GoogleDriveAPI {
    constructor() {
        this.clientId = '286185816026-19nn4lfgm3prmpjm9lm49004abdd8bum.apps.googleusercontent.com';
        this.scopes = ['https://www.googleapis.com/auth/drive.file'];
        this.accessToken = null;
    }

    // Authenticate with Google
    async authenticate() {
        try {
            const authResult = await chrome.identity.getAuthToken({ 
                interactive: true 
            });
            this.accessToken = authResult.token;
            console.log('Authentication successful');
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    // Save data to Google Drive
    async saveToDrive(filename, data) {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Authentication required');
            }
        }

        try {
            // First, check if file already exists
            const existingFile = await this.findFile(filename);
            
            if (existingFile) {
                // Update existing file
                return await this.updateFile(existingFile.id, data);
            } else {
                // Create new file
                return await this.createFile(filename, data);
            }
        } catch (error) {
            console.error('Error saving to Drive:', error);
            throw error;
        }
    }

    // Load data from Google Drive
    async loadFromDrive(filename) {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Authentication required');
            }
        }

        try {
            const file = await this.findFile(filename);
            if (!file) {
                throw new Error('File not found');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error loading from Drive:', error);
            throw error;
        }
    }

    // Delete file from Google Drive
    async deleteFile(filename) {
        if (!this.accessToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Authentication required');
            }
        }

        try {
            const file = await this.findFile(filename);
            if (!file) {
                throw new Error('File not found');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            return true;
        } catch (error) {
            console.error('Error deleting from Drive:', error);
            throw error;
        }
    }

    // Find file by name
    async findFile(filename) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${filename}'&spaces=drive`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search for file');
        }

        const result = await response.json();
        return result.files.length > 0 ? result.files[0] : null;
    }

    // Create new file
    async createFile(filename, data) {
        const metadata = {
            name: filename,
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error('Failed to create file');
        }

        return await response.json();
    }

    // Update existing file
    async updateFile(fileId, data) {
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update file');
        }

        return await response.json();
    }
}

// Export for use in other files
window.GoogleDriveAPI = GoogleDriveAPI;
