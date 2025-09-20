// UI Manager Module
export class UIManager {
    constructor() {
        this.initializeElements();
    }

    initializeElements() {
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.statusText = this.statusIndicator.querySelector('.status-text');
        
        // Stats elements
        this.tabsCount = document.getElementById('tabsCount');
        this.groupsCount = document.getElementById('groupsCount');
        
        // Button elements
        this.saveToDriveButton = document.getElementById('saveToDriveButton');
        this.loadFromDriveButton = document.getElementById('loadFromDriveButton');
        this.testDriveButton = document.getElementById('testDriveButton');
        
        // Session elements
        this.sessionSelect = document.getElementById('sessionSelect');
        this.newSessionButton = document.getElementById('newSessionButton');
        this.deleteSessionButton = document.getElementById('deleteSessionButton');
        this.newSessionModal = document.getElementById('newSessionModal');
        this.sessionNameInput = document.getElementById('sessionNameInput');
        this.createSessionButton = document.getElementById('createSessionButton');
        this.cancelNewSessionButton = document.getElementById('cancelNewSessionButton');
        this.closeModalButton = document.getElementById('closeModalButton');
        
        // Auto sync elements
        this.autoSyncToggle = document.getElementById('autoSyncToggle');
        this.syncStatus = document.getElementById('syncStatus');
        this.syncIndicator = this.syncStatus.querySelector('.sync-indicator');
        this.syncText = this.syncStatus.querySelector('.sync-text');
        
        // Options elements
        this.expandOptionsButton = document.getElementById('expandOptionsButton');
        this.optionsContent = document.getElementById('optionsContent');
        this.newWindowToggle = document.getElementById('newWindowToggle');
        this.closeExistingToggle = document.getElementById('closeExistingToggle');
        this.preserveGroupsToggle = document.getElementById('preserveGroupsToggle');
    }

    updateStats(stats) {
        this.tabsCount.textContent = stats.tabsCount;
        this.groupsCount.textContent = stats.groupsCount;
    }

    updateConnectionStatus(status, message) {
        this.statusText.textContent = message;
        this.statusDot.className = `status-dot ${status}`;
    }

    updateSyncStatus(lastSyncTime) {
        if (lastSyncTime) {
            const date = new Date(lastSyncTime);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) {
                this.syncText.textContent = 'Última sincronización: Ahora mismo';
            } else if (diffMins < 60) {
                this.syncText.textContent = `Última sincronización: Hace ${diffMins} min`;
            } else {
                const diffHours = Math.floor(diffMins / 60);
                this.syncText.textContent = `Última sincronización: Hace ${diffHours}h`;
            }
            
            this.syncIndicator.className = 'sync-indicator synced';
        } else {
            this.syncText.textContent = 'Última sincronización: Nunca';
            this.syncIndicator.className = 'sync-indicator';
        }
    }

    updateSessionSelect(sessions, currentSession) {
        this.sessionSelect.innerHTML = '';
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session;
            option.textContent = session === 'default' ? 'Sesión Principal' : session;
            if (session === currentSession) {
                option.selected = true;
            }
            this.sessionSelect.appendChild(option);
        });
        
        // Enable/disable delete button
        this.deleteSessionButton.disabled = currentSession === 'default';
    }

    updateOptionsUI(options) {
        this.newWindowToggle.checked = options.newWindow;
        this.closeExistingToggle.checked = options.closeExisting;
        this.preserveGroupsToggle.checked = options.preserveGroups;
    }

    updateAutoSyncUI(enabled) {
        this.autoSyncToggle.checked = enabled;
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showModal() {
        this.newSessionModal.classList.add('show');
        this.sessionNameInput.focus();
    }

    hideModal() {
        this.newSessionModal.classList.remove('show');
        this.sessionNameInput.value = '';
    }

    toggleOptionsExpansion() {
        const optionsHeader = this.expandOptionsButton.closest('.options-header');
        const isExpanded = this.optionsContent.classList.contains('expanded');
        
        if (isExpanded) {
            this.optionsContent.classList.remove('expanded');
            optionsHeader.classList.remove('expanded');
        } else {
            this.optionsContent.classList.add('expanded');
            optionsHeader.classList.add('expanded');
        }
    }

    showMessage(message, type = 'success') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    setSyncIndicatorStatus(status) {
        this.syncIndicator.className = `sync-indicator ${status}`;
    }
}
