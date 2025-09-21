// Main Popup Controller - TypeScript Version
import { SessionManager } from './modules/session-manager';
import { OptionsManager } from './modules/options-manager';
import { TabManager } from './modules/tab-manager';
import { UIManager } from './modules/ui-manager';
import { StorageManager } from './modules/storage-manager';
import { StorageType, Options } from './types';
import { GoogleDriveAPI } from './google-drive-api';

// Make GoogleDriveAPI globally available
(window as any).GoogleDriveAPI = GoogleDriveAPI;

class PopupController {
    private storageManager: StorageManager;
    private ui: UIManager;
    private optionsManager: OptionsManager;
    private sessionManager: SessionManager;
    private tabManager: TabManager;
    
    constructor() {
        this.storageManager = new StorageManager();
        this.ui = new UIManager();
        this.optionsManager = new OptionsManager();
        this.sessionManager = new SessionManager(this.storageManager);
        this.tabManager = new TabManager(this.optionsManager);
        
        this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.loadData();
        await this.setupEventListeners();
        await this.updateUI();
    }

    private async loadData(): Promise<void> {
        await this.optionsManager.loadOptions();
        
        // Configurar el storage manager con las opciones
        const options = this.optionsManager.getOptions();
        this.storageManager.setStorageType(options.storageType);
        this.storageManager.setBSyncServerUrl(options.bsyncServerUrl);
        this.storageManager.setAccountId(options.accountId);
        
        await this.sessionManager.loadSessions();
    }

    private async updateUI(): Promise<void> {
        // Update stats
        const stats = await this.tabManager.getStats();
        this.ui.updateStats(stats);

        // Update session select
        this.ui.updateSessionSelect(
            this.sessionManager.getSessions(),
            this.sessionManager.getCurrentSession()
        );

        // Update options UI
        this.ui.updateOptionsUI(this.optionsManager.getOptions());

        // Update auto sync status
        await this.loadAutoSyncStatus();

        // Check connection
        await this.checkConnection();
    }

    private async loadAutoSyncStatus(): Promise<void> {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getAutoSyncStatus' });
            this.ui.updateAutoSyncUI(response.enabled);
            this.ui.updateSyncStatus(response.lastSyncTime);
        } catch (error) {
            console.error('Error loading auto sync status:', error);
        }
    }

    private async checkConnection(): Promise<void> {
        try {
            this.ui.updateConnectionStatus('', 'Verificando conexión...');
            
            const authenticated = await this.storageManager.authenticate();
            if (authenticated) {
                const storageName = this.storageManager.getProviderName();
                this.ui.updateConnectionStatus('connected', `Conectado a ${storageName}`);
            } else {
                this.ui.updateConnectionStatus('error', 'No conectado');
            }
        } catch (error) {
            this.ui.updateConnectionStatus('error', 'Error de conexión');
            console.error('Connection check failed:', error);
        }
    }

    private setupEventListeners(): void {
        // Session management
        this.ui.elements.sessionSelect.addEventListener('change', (e) => this.handleSessionChange(e));
        this.ui.elements.newSessionButton.addEventListener('click', () => this.ui.showModal());
        this.ui.elements.deleteSessionButton.addEventListener('click', () => this.handleDeleteSession());
        this.ui.elements.createSessionButton.addEventListener('click', () => this.handleCreateSession());
        this.ui.elements.cancelNewSessionButton.addEventListener('click', () => this.ui.hideModal());
        this.ui.elements.closeModalButton.addEventListener('click', () => this.ui.hideModal());

        // Modal outside click
        this.ui.elements.newSessionModal.addEventListener('click', (e) => {
            if (e.target === this.ui.elements.newSessionModal) {
                this.ui.hideModal();
            }
        });

        // Options
        this.ui.elements.expandOptionsButton.addEventListener('click', () => this.ui.toggleOptionsExpansion());
        this.ui.elements.newWindowToggle.addEventListener('change', (e) => this.handleOptionChange('newWindow', (e.target as HTMLInputElement).checked));
        this.ui.elements.closeExistingToggle.addEventListener('change', (e) => this.handleOptionChange('closeExisting', (e.target as HTMLInputElement).checked));
        this.ui.elements.preserveGroupsToggle.addEventListener('change', (e) => this.handleOptionChange('preserveGroups', (e.target as HTMLInputElement).checked));
        
        // Storage options
        if (this.ui.elements.storageTypeSelect) {
            this.ui.elements.storageTypeSelect.addEventListener('change', (e) => this.handleStorageTypeChange(e));
        }
        if (this.ui.elements.bsyncServerUrlInput) {
            this.ui.elements.bsyncServerUrlInput.addEventListener('change', (e) => this.handleOptionChange('bsyncServerUrl', (e.target as HTMLInputElement).value));
        }
        if (this.ui.elements.accountIdInput) {
            this.ui.elements.accountIdInput.addEventListener('change', (e) => this.handleOptionChange('accountId', (e.target as HTMLInputElement).value));
        }

        // Auto sync
        this.ui.elements.autoSyncToggle.addEventListener('change', (e) => this.handleAutoSyncToggle(e));

        // Main actions
        this.ui.elements.saveToDriveButton.addEventListener('click', () => this.handleSaveTabs());
        this.ui.elements.loadFromDriveButton.addEventListener('click', () => this.handleLoadTabs());
        this.ui.elements.testDriveButton.addEventListener('click', () => this.handleTestConnection());

        // Auto sync messages from background
        chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
            if (message.action === 'autoSync') {
                this.handleAutoSync(message.data);
            }
        });
    }

    private async handleSessionChange(e: Event): Promise<void> {
        const target = e.target as HTMLSelectElement;
        const sessionName = target.value;
        await this.sessionManager.setCurrentSession(sessionName);
        this.ui.updateSessionSelect(
            this.sessionManager.getSessions(),
            this.sessionManager.getCurrentSession()
        );
        this.ui.showMessage(`Cambiado a sesión: ${sessionName === 'default' ? 'Principal' : sessionName}`);
    }

    private async handleCreateSession(): Promise<void> {
        const sessionName = this.ui.elements.sessionNameInput.value.trim();
        if (!sessionName) {
            this.ui.showMessage('Por favor ingresa un nombre para la sesión', 'error');
            return;
        }

        try {
            await this.sessionManager.createSession(sessionName);
            this.ui.updateSessionSelect(
                this.sessionManager.getSessions(),
                this.sessionManager.getCurrentSession()
            );
            this.ui.hideModal();
            this.ui.showMessage(`Sesión "${sessionName}" creada`);
        } catch (error) {
            this.ui.showMessage('Error al crear la sesión', 'error');
        }
    }

    private async handleDeleteSession(): Promise<void> {
        const currentSession = this.sessionManager.getCurrentSession();
        if (currentSession === 'default') return;

        if (confirm(`¿Estás seguro de que quieres eliminar la sesión "${currentSession}"?`)) {
            try {
                await this.sessionManager.deleteSession(currentSession);
                this.ui.updateSessionSelect(
                    this.sessionManager.getSessions(),
                    this.sessionManager.getCurrentSession()
                );
                this.ui.showMessage(`Sesión "${currentSession}" eliminada`);
            } catch (error) {
                this.ui.showMessage('Error al eliminar la sesión', 'error');
            }
        }
    }

    private async handleOptionChange<K extends keyof Options>(key: K, value: Options[K]): Promise<void> {
        await this.optionsManager.updateOption(key, value);
        const optionNames: Record<string, string> = {
            newWindow: 'Nueva ventana',
            closeExisting: 'Cerrar pestañas existentes',
            preserveGroups: 'Preservar grupos',
            bsyncServerUrl: 'URL del servidor BSync',
            accountId: 'ID de cuenta'
        };
        if (optionNames[key]) {
            this.ui.showMessage(`${optionNames[key]} ${typeof value === 'boolean' ? (value ? 'activado' : 'desactivado') : 'actualizado'}`);
        }
    }

    private async handleStorageTypeChange(e: Event): Promise<void> {
        const target = e.target as HTMLSelectElement;
        const storageType = target.value as StorageType;
        await this.optionsManager.updateOption('storageType', storageType);
        
        // Mostrar/ocultar opciones de BSync según el tipo seleccionado
        this.ui.toggleBSyncOptions(storageType === 'bsync-server');
        
        // Actualizar el storage manager
        this.storageManager.setStorageType(storageType);
        
        // Recargar sesiones con el nuevo tipo de almacenamiento
        await this.sessionManager.loadSessions();
        this.ui.updateSessionSelect(
            this.sessionManager.getSessions(),
            this.sessionManager.getCurrentSession()
        );
        
        // Verificar conexión
        await this.checkConnection();
        
        const storageName = this.storageManager.getProviderName();
        this.ui.showMessage(`Almacenamiento cambiado a: ${storageName}`);
    }

    private async handleAutoSyncToggle(e: Event): Promise<void> {
        const target = e.target as HTMLInputElement;
        const enabled = target.checked;
        
        try {
            await chrome.runtime.sendMessage({ 
                action: 'setAutoSync', 
                enabled: enabled 
            });
            
            if (enabled) {
                this.ui.showMessage('✅ Sincronización automática activada');
                this.ui.setSyncIndicatorStatus('syncing');
            } else {
                this.ui.showMessage('⏸️ Sincronización automática desactivada');
                this.ui.setSyncIndicatorStatus('');
            }
        } catch (error) {
            console.error('Error setting auto sync:', error);
            this.ui.showMessage('Error al cambiar sincronización automática', 'error');
            target.checked = !enabled; // Revert the toggle
        }
    }

    private async handleTestConnection(): Promise<void> {
        this.ui.setButtonLoading(this.ui.elements.testDriveButton, true);
        
        try {
            const authenticated = await this.storageManager.testConnection();
            if (authenticated) {
                const storageName = this.storageManager.getProviderName();
                this.ui.showMessage(`✅ Conexión exitosa con ${storageName}`);
                this.ui.updateConnectionStatus('connected', `Conectado a ${storageName}`);
            } else {
                const storageName = this.storageManager.getProviderName();
                this.ui.showMessage(`❌ Error de conexión con ${storageName}`, 'error');
                this.ui.updateConnectionStatus('error', 'Error de conexión');
            }
        } catch (error) {
            this.ui.showMessage("❌ Error: " + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
            this.ui.updateConnectionStatus('error', 'Error de conexión');
        } finally {
            this.ui.setButtonLoading(this.ui.elements.testDriveButton, false);
        }
    }

    private async handleSaveTabs(): Promise<void> {
        this.ui.setButtonLoading(this.ui.elements.saveToDriveButton, true);
        
        try {
            const tabs = await this.tabManager.getTabsData();
            const filename = this.sessionManager.getSessionFilename();
            await this.storageManager.saveData(filename, { tabs, timestamp: new Date().toISOString() });
            
            const currentSession = this.sessionManager.getCurrentSession();
            const storageName = this.storageManager.getProviderName();
            this.ui.showMessage(`✅ ${tabs.length} pestañas guardadas en ${storageName} - sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
            
            // Update stats and sync status
            const stats = await this.tabManager.getStats();
            this.ui.updateStats(stats);
            this.ui.updateSyncStatus(new Date().toISOString());
        } catch (error) {
            this.ui.showMessage("❌ Error al guardar: " + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
        } finally {
            this.ui.setButtonLoading(this.ui.elements.saveToDriveButton, false);
        }
    }

    private async handleLoadTabs(): Promise<void> {
        this.ui.setButtonLoading(this.ui.elements.loadFromDriveButton, true);
        
        try {
            const filename = this.sessionManager.getSessionFilename();
            const sessionData = await this.storageManager.loadData(filename);
            
            const currentSession = this.sessionManager.getCurrentSession();
            const storageName = this.storageManager.getProviderName();
            this.ui.showMessage(`✅ Pestañas cargadas desde ${storageName} - sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
            
            // Restore tabs
            const result = await this.tabManager.restoreTabs(sessionData.tabs);
            if (result.success) {
                this.ui.showMessage(`✅ ${result.message}`);
            } else {
                this.ui.showMessage(`❌ ${result.message}`, 'error');
            }
            
            // Update stats
            const stats = await this.tabManager.getStats();
            this.ui.updateStats(stats);
        } catch (error) {
            this.ui.showMessage("❌ Error al cargar: " + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
        } finally {
            this.ui.setButtonLoading(this.ui.elements.loadFromDriveButton, false);
        }
    }

    private async handleAutoSync(data: any): Promise<void> {
        try {
            this.ui.setSyncIndicatorStatus('syncing');
            
            await this.storageManager.saveData(data.filename, data.tabs);
            
            this.ui.setSyncIndicatorStatus('synced');
            this.ui.updateSyncStatus(new Date().toISOString());
            
            console.log('Auto sync completed successfully');
        } catch (error) {
            console.error('Auto sync failed:', error);
            this.ui.setSyncIndicatorStatus('error');
        }
    }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
