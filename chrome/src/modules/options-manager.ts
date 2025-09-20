// Options Manager Module
import { Options, StorageType } from '../types';

export class OptionsManager {
    private options: Options;

    constructor() {
        this.options = {
            newWindow: false,
            closeExisting: false,
            preserveGroups: true,
            storageType: 'google-drive' as StorageType,
            bsyncServerUrl: 'http://localhost:2544',
            accountId: 'default-user'
        };
    }

    async loadOptions(): Promise<void> {
        try {
            const result = await chrome.storage.local.get(['options']);
            this.options = { ...this.options, ...result['options'] };
        } catch (error) {
            console.error('Error loading options:', error);
        }
    }

    async saveOptions(): Promise<void> {
        try {
            await chrome.storage.local.set({ options: this.options });
        } catch (error) {
            console.error('Error saving options:', error);
        }
    }

    async updateOption<K extends keyof Options>(key: K, value: Options[K]): Promise<void> {
        this.options[key] = value;
        await this.saveOptions();
    }

    getOptions(): Options {
        return { ...this.options };
    }

    getOption<K extends keyof Options>(key: K): Options[K] {
        return this.options[key];
    }
}
