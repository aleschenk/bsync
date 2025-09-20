// UI Manager Module
import { UIElements, Options, TabStats } from '../types';

export class UIManager {
    public elements: UIElements;

    constructor() {
        this.elements = this.initializeElements();
    }

    private initializeElements(): UIElements {
        // Status elements
        const statusIndicator = document.getElementById('statusIndicator')!;
        const statusDot = statusIndicator.querySelector('.status-dot') as HTMLElement;
        const statusText = statusIndicator.querySelector('.status-text') as HTMLElement;
        
        // Stats elements
        const tabsCount = document.getElementById('tabsCount')!;
        const groupsCount = document.getElementById('groupsCount')!;
        
        // Button elements
        const saveToDriveButton = document.getElementById('saveToDriveButton') as HTMLButtonElement;
        const loadFromDriveButton = document.getElementById('loadFromDriveButton') as HTMLButtonElement;
        const testDriveButton = document.getElementById('testDriveButton') as HTMLButtonElement;
        
        // Session elements
        const sessionSelect = document.getElementById('sessionSelect') as HTMLSelectElement;
        const newSessionButton = document.getElementById('newSessionButton') as HTMLButtonElement;
        const deleteSessionButton = document.getElementById('deleteSessionButton') as HTMLButtonElement;
        const newSessionModal = document.getElementById('newSessionModal')!;
        const sessionNameInput = document.getElementById('sessionNameInput') as HTMLInputElement;
        const createSessionButton = document.getElementById('createSessionButton') as HTMLButtonElement;
        const cancelNewSessionButton = document.getElementById('cancelNewSessionButton') as HTMLButtonElement;
        const closeModalButton = document.getElementById('closeModalButton') as HTMLButtonElement;
        
        // Auto sync elements
        const autoSyncToggle = document.getElementById('autoSyncToggle') as HTMLInputElement;
        const syncStatus = document.getElementById('syncStatus')!;
        const syncIndicator = syncStatus.querySelector('.sync-indicator') as HTMLElement;
        const syncText = syncStatus.querySelector('.sync-text') as HTMLElement;
        
        // Options elements
        const expandOptionsButton = document.getElementById('expandOptionsButton') as HTMLButtonElement;
        const optionsContent = document.getElementById('optionsContent')!;
        const newWindowToggle = document.getElementById('newWindowToggle') as HTMLInputElement;
        const closeExistingToggle = document.getElementById('closeExistingToggle') as HTMLInputElement;
        const preserveGroupsToggle = document.getElementById('preserveGroupsToggle') as HTMLInputElement;
        
        // Storage elements
        const storageTypeSelect = document.getElementById('storageTypeSelect') as HTMLSelectElement;
        const bsyncServerUrlInput = document.getElementById('bsyncServerUrlInput') as HTMLInputElement;
        const accountIdInput = document.getElementById('accountIdInput') as HTMLInputElement;

        return {
            statusIndicator,
            statusDot,
            statusText,
            tabsCount,
            groupsCount,
            saveToDriveButton,
            loadFromDriveButton,
            testDriveButton,
            sessionSelect,
            newSessionButton,
            deleteSessionButton,
            newSessionModal,
            sessionNameInput,
            createSessionButton,
            cancelNewSessionButton,
            closeModalButton,
            autoSyncToggle,
            syncStatus,
            syncIndicator,
            syncText,
            expandOptionsButton,
            optionsContent,
            newWindowToggle,
            closeExistingToggle,
            preserveGroupsToggle,
            storageTypeSelect,
            bsyncServerUrlInput,
            accountIdInput
        };
    }

    // Getters para acceder a los elementos
    getElements(): UIElements {
        return this.elements;
    }

    updateStats(stats: TabStats): void {
        this.elements.tabsCount.textContent = stats.tabsCount.toString();
        this.elements.groupsCount.textContent = stats.groupsCount.toString();
    }

    updateConnectionStatus(status: string, message: string): void {
        this.elements.statusDot.className = `status-dot ${status}`;
        this.elements.statusText.textContent = message;
    }

    updateSyncStatus(lastSyncTime: string | null): void {
        if (lastSyncTime) {
            const date = new Date(lastSyncTime);
            this.elements.syncText.textContent = `Última sincronización: ${date.toLocaleString()}`;
        } else {
            this.elements.syncText.textContent = 'Última sincronización: Nunca';
        }
    }

    updateSessionSelect(sessions: string[], currentSession: string): void {
        this.elements.sessionSelect.innerHTML = '';
        
        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session;
            option.textContent = session === 'default' ? 'Sesión Principal' : session;
            this.elements.sessionSelect.appendChild(option);
        });
        
        this.elements.sessionSelect.value = currentSession;
        
        // Enable/disable delete button
        this.elements.deleteSessionButton.disabled = currentSession === 'default';
    }

    updateOptionsUI(options: Options): void {
        this.elements.newWindowToggle.checked = options.newWindow;
        this.elements.closeExistingToggle.checked = options.closeExisting;
        this.elements.preserveGroupsToggle.checked = options.preserveGroups;
        
        // Update storage options
        if (this.elements.storageTypeSelect) {
            this.elements.storageTypeSelect.value = options.storageType;
        }
        if (this.elements.bsyncServerUrlInput) {
            this.elements.bsyncServerUrlInput.value = options.bsyncServerUrl;
        }
        if (this.elements.accountIdInput) {
            this.elements.accountIdInput.value = options.accountId;
        }
        
        // Show/hide BSync server options based on storage type
        this.toggleBSyncOptions(options.storageType === 'bsync-server');
    }

    updateAutoSyncUI(enabled: boolean): void {
        this.elements.autoSyncToggle.checked = enabled;
    }

    setButtonLoading(button: HTMLButtonElement, loading: boolean): void {
        if (loading) {
            button.disabled = true;
            button.style.opacity = '0.6';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }

    showModal(): void {
        this.elements.newSessionModal.style.display = 'flex';
        this.elements.sessionNameInput.focus();
    }

    hideModal(): void {
        this.elements.newSessionModal.style.display = 'none';
        this.elements.sessionNameInput.value = '';
    }

    toggleOptionsExpansion(): void {
        this.elements.optionsContent.classList.toggle('expanded');
        this.elements.expandOptionsButton.classList.toggle('expanded');
    }

    showMessage(message: string, type: 'success' | 'error' = 'success'): void {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // Add to container
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(messageEl);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    setSyncIndicatorStatus(status: string): void {
        this.elements.syncIndicator.className = `sync-indicator ${status}`;
    }
    
    toggleBSyncOptions(show: boolean): void {
        const bsyncOptions = document.querySelector('.bsync-options') as HTMLElement;
        if (bsyncOptions) {
            bsyncOptions.style.display = show ? 'block' : 'none';
        }
    }
}
