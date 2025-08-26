// Initialize Google Drive API
const driveAPI = new GoogleDriveAPI();

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusDot = statusIndicator.querySelector('.status-dot');
const statusText = statusIndicator.querySelector('.status-text');
const tabsCount = document.getElementById('tabsCount');
const groupsCount = document.getElementById('groupsCount');
const saveToDriveButton = document.getElementById('saveToDriveButton');
const loadFromDriveButton = document.getElementById('loadFromDriveButton');
const testDriveButton = document.getElementById('testDriveButton');

// Session management elements
const sessionSelect = document.getElementById('sessionSelect');
const newSessionButton = document.getElementById('newSessionButton');
const deleteSessionButton = document.getElementById('deleteSessionButton');
const newSessionModal = document.getElementById('newSessionModal');
const sessionNameInput = document.getElementById('sessionNameInput');
const createSessionButton = document.getElementById('createSessionButton');
const cancelNewSessionButton = document.getElementById('cancelNewSessionButton');
const closeModalButton = document.getElementById('closeModalButton');

// Auto sync elements
const autoSyncToggle = document.getElementById('autoSyncToggle');
const syncStatus = document.getElementById('syncStatus');
const syncIndicator = syncStatus.querySelector('.sync-indicator');
const syncText = syncStatus.querySelector('.sync-text');

// Session management
let currentSession = 'default';
let sessions = ['default'];

// Initialize the popup
async function initializePopup() {
    await loadSessions();
    await updateStats();
    await checkConnection();
    await loadAutoSyncStatus();
}

// Load auto sync status
async function loadAutoSyncStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getAutoSyncStatus' });
        autoSyncToggle.checked = response.enabled;
        updateSyncStatus(response.lastSyncTime);
    } catch (error) {
        console.error('Error loading auto sync status:', error);
    }
}

// Update sync status display
function updateSyncStatus(lastSyncTime) {
    if (lastSyncTime) {
        const date = new Date(lastSyncTime);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            syncText.textContent = 'Última sincronización: Ahora mismo';
        } else if (diffMins < 60) {
            syncText.textContent = `Última sincronización: Hace ${diffMins} min`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            syncText.textContent = `Última sincronización: Hace ${diffHours}h`;
        }
        
        syncIndicator.className = 'sync-indicator synced';
    } else {
        syncText.textContent = 'Última sincronización: Nunca';
        syncIndicator.className = 'sync-indicator';
    }
}

// Load sessions from Google Drive
async function loadSessions() {
    try {
        const sessionsData = await driveAPI.loadFromDrive('bsync-sessions.json');
        sessions = sessionsData.sessions || ['default'];
        currentSession = sessionsData.currentSession || 'default';
        updateSessionSelect();
        
        // Update background script with current session
        await chrome.runtime.sendMessage({ 
            action: 'setCurrentSession', 
            session: currentSession 
        });
    } catch (error) {
        console.log('No sessions file found, using default');
        sessions = ['default'];
        currentSession = 'default';
        updateSessionSelect();
    }
}

// Save sessions to Google Drive
async function saveSessions() {
    try {
        const sessionsData = {
            sessions: sessions,
            currentSession: currentSession
        };
        await driveAPI.saveToDrive('bsync-sessions.json', sessionsData);
        
        // Update background script with current session
        await chrome.runtime.sendMessage({ 
            action: 'setCurrentSession', 
            session: currentSession 
        });
    } catch (error) {
        console.error('Error saving sessions:', error);
    }
}

// Update session select dropdown
function updateSessionSelect() {
    sessionSelect.innerHTML = '';
    sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session;
        option.textContent = session === 'default' ? 'Sesión Principal' : session;
        if (session === currentSession) {
            option.selected = true;
        }
        sessionSelect.appendChild(option);
    });
    
    // Enable/disable delete button
    deleteSessionButton.disabled = currentSession === 'default';
}

// Get current session filename
function getSessionFilename() {
    return currentSession === 'default' ? 'bsync-tabs.json' : `bsync-tabs-${currentSession}.json`;
}

// Update statistics
async function updateStats() {
    try {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        
        tabsCount.textContent = tabs.length;
        groupsCount.textContent = groups.length;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Check Google Drive connection
async function checkConnection() {
    try {
        statusText.textContent = 'Verificando conexión...';
        statusDot.className = 'status-dot';
        
        const authenticated = await driveAPI.authenticate();
        if (authenticated) {
            statusText.textContent = 'Conectado a Google Drive';
            statusDot.className = 'status-dot connected';
        } else {
            statusText.textContent = 'No conectado';
            statusDot.className = 'status-dot error';
        }
    } catch (error) {
        statusText.textContent = 'Error de conexión';
        statusDot.className = 'status-dot error';
        console.error('Connection check failed:', error);
    }
}

// Show message
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Add loading state to button
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Modal functions
function showModal() {
    newSessionModal.classList.add('show');
    sessionNameInput.focus();
}

function hideModal() {
    newSessionModal.classList.remove('show');
    sessionNameInput.value = '';
}

// Event listeners for session management
sessionSelect.addEventListener('change', async (e) => {
    currentSession = e.target.value;
    await saveSessions();
    updateSessionSelect();
    showMessage(`Cambiado a sesión: ${currentSession === 'default' ? 'Principal' : currentSession}`);
});

newSessionButton.addEventListener('click', showModal);

deleteSessionButton.addEventListener('click', async () => {
    if (currentSession === 'default') return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar la sesión "${currentSession}"?`)) {
        try {
            // Remove session from list
            sessions = sessions.filter(s => s !== currentSession);
            currentSession = 'default';
            
            // Save updated sessions
            await saveSessions();
            updateSessionSelect();
            
            // Try to delete the session file
            try {
                await driveAPI.deleteFile(`bsync-tabs-${currentSession}.json`);
            } catch (error) {
                console.log('Session file not found or already deleted');
            }
            
            showMessage(`Sesión "${currentSession}" eliminada`);
        } catch (error) {
            showMessage('Error al eliminar la sesión', 'error');
        }
    }
});

createSessionButton.addEventListener('click', async () => {
    const sessionName = sessionNameInput.value.trim();
    if (!sessionName) {
        showMessage('Por favor ingresa un nombre para la sesión', 'error');
        return;
    }
    
    if (sessions.includes(sessionName)) {
        showMessage('Ya existe una sesión con ese nombre', 'error');
        return;
    }
    
    try {
        sessions.push(sessionName);
        currentSession = sessionName;
        await saveSessions();
        updateSessionSelect();
        hideModal();
        showMessage(`Sesión "${sessionName}" creada`);
    } catch (error) {
        showMessage('Error al crear la sesión', 'error');
    }
});

cancelNewSessionButton.addEventListener('click', hideModal);
closeModalButton.addEventListener('click', hideModal);

// Close modal when clicking outside
newSessionModal.addEventListener('click', (e) => {
    if (e.target === newSessionModal) {
        hideModal();
    }
});

// Auto sync toggle event listener
autoSyncToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    
    try {
        await chrome.runtime.sendMessage({ 
            action: 'setAutoSync', 
            enabled: enabled 
        });
        
        if (enabled) {
            showMessage('✅ Sincronización automática activada');
            syncIndicator.className = 'sync-indicator syncing';
        } else {
            showMessage('⏸️ Sincronización automática desactivada');
            syncIndicator.className = 'sync-indicator';
        }
    } catch (error) {
        console.error('Error setting auto sync:', error);
        showMessage('Error al cambiar sincronización automática', 'error');
        e.target.checked = !enabled; // Revert the toggle
    }
});

// Listen for auto sync messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'autoSync') {
        handleAutoSync(message.data);
    }
});

// Handle automatic sync
async function handleAutoSync(data) {
    try {
        syncIndicator.className = 'sync-indicator syncing';
        
        await driveAPI.saveToDrive(data.filename, data.tabs);
        
        syncIndicator.className = 'sync-indicator synced';
        updateSyncStatus(new Date().toISOString());
        
        console.log('Auto sync completed successfully');
    } catch (error) {
        console.error('Auto sync failed:', error);
        syncIndicator.className = 'sync-indicator error';
    }
}

// Test Google Drive connection
testDriveButton.addEventListener("click", async () => {
    try {
        setButtonLoading(testDriveButton, true);
        console.log("Testing Google Drive connection...");
        
        const authenticated = await driveAPI.authenticate();
        if (authenticated) {
            showMessage("✅ Conexión exitosa con Google Drive");
            statusText.textContent = 'Conectado a Google Drive';
            statusDot.className = 'status-dot connected';
        } else {
            showMessage("❌ Error de conexión con Google Drive", 'error');
            statusText.textContent = 'Error de conexión';
            statusDot.className = 'status-dot error';
        }
    } catch (error) {
        console.error("Test failed:", error);
        showMessage("❌ Error: " + error.message, 'error');
        statusText.textContent = 'Error de conexión';
        statusDot.className = 'status-dot error';
    } finally {
        setButtonLoading(testDriveButton, false);
    }
});

// Save tabs to Google Drive
saveToDriveButton.addEventListener("click", async () => {
    try {
        setButtonLoading(saveToDriveButton, true);
        
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        const groupCache = Object.assign({}, ...groups.map((group) => ({[group.id]: group.title})));
        const normalizedTabs = tabs
            .map(tab => ({ ...tab, groupName: groupCache[tab.groupId] }))
            .map(function(item) { 
                delete item.vivExtData;
                return item; 
            });

        const filename = getSessionFilename();
        await driveAPI.saveToDrive(filename, normalizedTabs);
        
        showMessage(`✅ ${tabs.length} pestañas guardadas en sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
        console.log("Tabs saved:", normalizedTabs);
        
        // Update stats and sync status
        await updateStats();
        updateSyncStatus(new Date().toISOString());
    } catch (error) {
        console.error("Save failed:", error);
        showMessage("❌ Error al guardar: " + error.message, 'error');
    } finally {
        setButtonLoading(saveToDriveButton, false);
    }
});

// Load tabs from Google Drive
loadFromDriveButton.addEventListener("click", async () => {
    try {
        setButtonLoading(loadFromDriveButton, true);
        
        const filename = getSessionFilename();
        const tabs = await driveAPI.loadFromDrive(filename);
        
        showMessage(`✅ Pestañas cargadas desde sesión "${currentSession === 'default' ? 'Principal' : currentSession}"`);
        console.log("Tabs loaded:", tabs);
        
        // Restore tabs
        await restoreTabs(tabs);
        
        // Update stats
        await updateStats();
    } catch (error) {
        console.error("Load failed:", error);
        showMessage("❌ Error al cargar: " + error.message, 'error');
    } finally {
        setButtonLoading(loadFromDriveButton, false);
    }
});

// Function to restore tabs
async function restoreTabs(savedTabs) {
    try {
        // Get current window
        const currentWindow = await chrome.windows.getCurrent();
        
        // Get all currently open tabs
        const currentTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        const currentUrls = currentTabs.map(tab => tab.url);
        
        // Filter out tabs that are already open
        const tabsToOpen = savedTabs.filter(savedTab => !currentUrls.includes(savedTab.url));
        
        if (tabsToOpen.length === 0) {
            showMessage("✅ Todas las pestañas ya están abiertas");
            return;
        }
        
        // Open new tabs in the current window
        for (const tab of tabsToOpen) {
            await chrome.tabs.create({
                windowId: currentWindow.id,
                url: tab.url,
                active: false
            });
        }

        // Restore tab groups if they exist
        const groups = savedTabs.filter(tab => tab.groupName);
        if (groups.length > 0) {
            await restoreTabGroups(currentWindow.id, groups);
        }

        showMessage(`✅ ${tabsToOpen.length} pestañas restauradas en la ventana actual`);
    } catch (error) {
        console.error("Error restoring tabs:", error);
        showMessage("❌ Error al restaurar pestañas: " + error.message, 'error');
    }
}

// Function to restore tab groups
async function restoreTabGroups(windowId, tabsWithGroups) {
    try {
        const groupNames = [...new Set(tabsWithGroups.map(tab => tab.groupName))];
        
        for (const groupName of groupNames) {
            // Create the group
            const group = await chrome.tabGroups.create({
                windowId: windowId,
                title: groupName
            });

            // Get all tabs in this window
            const allTabs = await chrome.tabs.query({ windowId: windowId });
            
            // Find tabs that should be in this group
            const tabsToGroup = allTabs.filter(tab => {
                const savedTab = tabsWithGroups.find(saved => saved.url === tab.url);
                return savedTab && savedTab.groupName === groupName;
            });

            // Add tabs to the group
            for (const tab of tabsToGroup) {
                await chrome.tabGroups.update(group.id, {
                    tabIds: [...(group.tabIds || []), tab.id]
                });
            }
        }
    } catch (error) {
        console.error("Error restoring tab groups:", error);
    }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', initializePopup);

