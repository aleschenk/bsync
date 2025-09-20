// Main Popup Controller - Refactored Version
import { SessionManager } from './modules/session-manager.js';
import { OptionsManager } from './modules/options-manager.js';
import { TabManager } from './modules/tab-manager.js';
import { UIManager } from './modules/ui-manager.js';

class PopupController {
    constructor() {
        this.driveAPI = new GoogleDriveAPI();
        this.ui = new UIManager();
        this.optionsManager = new OptionsManager();
        this.sessionManager = new SessionManager(this.driveAPI);
        this.tabManager = new TabManager(this.optionsManager);
        
        this.initialize();
    }

    async initialize() {
        await this.loadData();
        await this.setupEventListeners();
        await this.updateUI();
    }

    async loadData() {
        await this.sessionManager.loadSessions();
        await this.optionsManager.loadOptions();
    }

    async updateUI() {
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

    async loadAutoSyncStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getAutoSyncStatus' });
            this.ui.updateAutoSyncUI(response.enabled);
            this.ui.updateSyncStatus(response.lastSyncTime);
        } catch (error) {
            console.error('Error loading auto sync status:', error);
        }
    }

    async checkConnection() {
        try {
            this.ui.updateConnectionStatus('', 'Verificando conexión...');
            
            const authenticated = await this.driveAPI.authenticate();
            if (authenticated) {
                this.ui.updateConnectionStatus('connected', 'Conectado a Google Drive');
            } else {
                this.ui.updateConnectionStatus('error', 'No conectado');
            }
        } catch (error) {
            this.ui.updateConnectionStatus('error', 'Error de conexión');
            console.error('Connection check failed:', error);
        }
    }

    setupEventListeners() {
        // Session management
        this.ui.sessionSelect.addEventListener('change', (e) => this.handleSessionChange(e));
        this.ui.newSessionButton.addEventListener('click', () => this.ui.showModal());
        this.ui.deleteSessionButton.addEventListener('click', () => this.handleDeleteSession());
        this.ui.createSessionButton.addEventListener('click', () => this.handleCreateSession());
        this.ui.cancelNewSessionButton.addEventListener('click', () => this.ui.hideModal());
        this.ui.closeModalButton.addEventListener('click', () => this.ui.hideModal());

        // Modal outside click
        this.ui.newSessionModal.addEventListener('click', (e) => {
            if (e.target === this.ui.newSessionModal) {
                this.ui.hideModal();
            }
        });

        // Options
        this.ui.expandOptionsButton.addEventListener('click', () => this.ui.toggleOptionsExpansion());
        this.ui.newWindowToggle.addEventListener('change', (e) => this.handleOptionChange('newWindow', e.target.checked));
        this.ui.closeExistingToggle.addEventListener('change', (e) => this.handleOptionChange('closeExisting', e.target.checked));
        this.ui.preserveGroupsToggle.addEventListener('change', (e) => this.handleOptionChange('preserveGroups', e.target.checked));

        // Auto sync
        this.ui.autoSyncToggle.addEventListener('change', (e) => this.handleAutoSyncToggle(e));

        // Main actions
        this.ui.saveToDriveButton.addEventListener('click', () => this.handleSaveTabs());
        this.ui.loadFromDriveButton.addEventListener('click', () => this.handleLoadTabs());
        this.ui.testDriveButton.addEventListener('click', () => this.handleTestConnection());

        // Auto sync messages from background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'autoSync') {
                this.handleAutoSync(message.data);
            }
        });
    }

    async handleSessionChange(e) {
        const sessionName = e.target.value;
        await this.sessionManager.setCurrentSession(sessionName);
        this.ui.updateSessionSelect(
            this.sessionManager.getSessions(),
            this.sessionManager.getCurrentSession()
        );
        this.ui.showMessage(`Cambiado a sesión: ${sessionName === 'default' ? 'Principal' : sessionName}`);
    }

    async handleCreateSession() {
        const sessionName = this.ui.sessionNameInput.value.trim();
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

    async handleDeleteSession() {
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

    async handleOptionChange(key, value) {
        await this.optionsManager.updateOption(key, value);
        const optionNames = {
            newWindow: 'Nueva ventana',
            closeExisting: 'Cerrar pestañas existentes',
            preserveGroups: 'Preservar grupos'
        };
        this.ui.showMessage(`${optionNames[key]} ${value ? 'activado' : 'desactivado'}`);
    }

    async handleAutoSyncToggle(e) {
        const enabled = e.target.checked;
        
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
            e.target.checked = !enabled; // Revert the toggle
        }
    }

    async handleTestConnection() {
        this.ui.setButtonLoading(this.ui.testDriveButton, true);
        
        try {
            const authenticated = await this.driveAPI.authenticate();
            if (authenticated) {
                this.ui.showMessage("✅ Conexión exitosa con Google Drive");
                this.ui.updateConnectionStatus('connected', 'Conectado a Google Drive');
            } else {
                this.ui.showMessage("❌ Error de conexión con Google Drive", 'error');
                this.ui.updateConnectionStatus('error', 'Error de conexión');
            }
        } catch (error) {
            this.ui.showMessage("❌ Error: " + error.message, 'error');
            this.ui.updateConnectionStatus('error', 'Error de conexión');
        } finally {
            this.ui.setButtonLoading(this.ui.testDriveButton, false);
        }
    }

    async handleSaveTabs() {
        this.ui.setButtonLoading(this.ui.saveToDriveButton, true);
        
        try {
            const tabs = await this.tabManager.getTabsData();
            const filename = this.sessionManager.getSessionFilename();
            await this.driveAPI.saveToDrive(filename, tabs);
            
            const currentSession = this.sessionManager.getCurrentSession();
            this.ui.showMessage(`✅ ${tabs.length} pestañas guardadas en sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
            
            // Update stats and sync status
            const stats = await this.tabManager.getStats();
            this.ui.updateStats(stats);
            this.ui.updateSyncStatus(new Date().toISOString());
        } catch (error) {
            this.ui.showMessage("❌ Error al guardar: " + error.message, 'error');
        } finally {
            this.ui.setButtonLoading(this.ui.saveToDriveButton, false);
        }
    }

    async handleLoadTabs() {
        this.ui.setButtonLoading(this.ui.loadFromDriveButton, true);
        
        try {
            const filename = this.sessionManager.getSessionFilename();
            const tabs = await this.driveAPI.loadFromDrive(filename);
            
            const currentSession = this.sessionManager.getCurrentSession();
            this.ui.showMessage(`✅ Pestañas cargadas desde sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
            
            // Restore tabs
            const result = await this.tabManager.restoreTabs(tabs);
            if (result.success) {
                this.ui.showMessage(`✅ ${result.message}`);
            } else {
                this.ui.showMessage(`❌ ${result.message}`, 'error');
            }
            
            // Update stats
            const stats = await this.tabManager.getStats();
            this.ui.updateStats(stats);
        } catch (error) {
            this.ui.showMessage("❌ Error al cargar: " + error.message, 'error');
        } finally {
            this.ui.setButtonLoading(this.ui.loadFromDriveButton, false);
        }
    }

    async handleAutoSync(data) {
        try {
            this.ui.setSyncIndicatorStatus('syncing');
            
            await this.driveAPI.saveToDrive(data.filename, data.tabs);
            
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
