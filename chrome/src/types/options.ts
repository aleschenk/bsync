// Options Types
import { StorageType } from './storage';

export interface Options {
  newWindow: boolean;
  closeExisting: boolean;
  preserveGroups: boolean;
  storageType: StorageType;
  bsyncServerUrl: string;
  accountId: string;
}

export interface UIElements {
  // Status elements
  statusIndicator: HTMLElement;
  statusDot: HTMLElement;
  statusText: HTMLElement;
  
  // Stats elements
  tabsCount: HTMLElement;
  groupsCount: HTMLElement;
  
  // Button elements
  saveToDriveButton: HTMLButtonElement;
  loadFromDriveButton: HTMLButtonElement;
  testDriveButton: HTMLButtonElement;
  
  // Session elements
  sessionSelect: HTMLSelectElement;
  newSessionButton: HTMLButtonElement;
  deleteSessionButton: HTMLButtonElement;
  newSessionModal: HTMLElement;
  sessionNameInput: HTMLInputElement;
  createSessionButton: HTMLButtonElement;
  cancelNewSessionButton: HTMLButtonElement;
  closeModalButton: HTMLButtonElement;
  
  // Auto sync elements
  autoSyncToggle: HTMLInputElement;
  syncStatus: HTMLElement;
  syncIndicator: HTMLElement;
  syncText: HTMLElement;
  
  // Options elements
  expandOptionsButton: HTMLButtonElement;
  optionsContent: HTMLElement;
  newWindowToggle: HTMLInputElement;
  closeExistingToggle: HTMLInputElement;
  preserveGroupsToggle: HTMLInputElement;
  
  // Storage elements
  storageTypeSelect?: HTMLSelectElement;
  bsyncServerUrlInput?: HTMLInputElement;
  accountIdInput?: HTMLInputElement;
}
