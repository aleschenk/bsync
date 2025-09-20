// Session Manager Module
export class SessionManager {
    constructor(driveAPI) {
        this.driveAPI = driveAPI;
        this.currentSession = 'default';
        this.sessions = ['default'];
    }

    async loadSessions() {
        try {
            const sessionsData = await this.driveAPI.loadFromDrive('bsync-sessions.json');
            this.sessions = sessionsData.sessions || ['default'];
            this.currentSession = sessionsData.currentSession || 'default';
            return true;
        } catch (error) {
            console.log('No sessions file found, using default');
            this.sessions = ['default'];
            this.currentSession = 'default';
            return false;
        }
    }

    async saveSessions() {
        try {
            const sessionsData = {
                sessions: this.sessions,
                currentSession: this.currentSession
            };
            await this.driveAPI.saveToDrive('bsync-sessions.json', sessionsData);
            return true;
        } catch (error) {
            console.error('Error saving sessions:', error);
            return false;
        }
    }

    async createSession(sessionName) {
        if (this.sessions.includes(sessionName)) {
            throw new Error('Session already exists');
        }
        
        this.sessions.push(sessionName);
        this.currentSession = sessionName;
        await this.saveSessions();
        return true;
    }

    async deleteSession(sessionName) {
        if (sessionName === 'default') {
            throw new Error('Cannot delete default session');
        }
        
        this.sessions = this.sessions.filter(s => s !== sessionName);
        this.currentSession = 'default';
        await this.saveSessions();
        
        // Try to delete the session file
        try {
            await this.driveAPI.deleteFile(`bsync-tabs-${sessionName}.json`);
        } catch (error) {
            console.log('Session file not found or already deleted');
        }
        
        return true;
    }

    setCurrentSession(sessionName) {
        this.currentSession = sessionName;
        return this.saveSessions();
    }

    getCurrentSession() {
        return this.currentSession;
    }

    getSessions() {
        return this.sessions;
    }

    getSessionFilename() {
        return this.currentSession === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${this.currentSession}.json`;
    }
}
