// Options Manager Module
export class OptionsManager {
    constructor() {
        this.options = {
            newWindow: false,
            closeExisting: false,
            preserveGroups: true
        };
    }

    async loadOptions() {
        try {
            const result = await chrome.storage.local.get(['options']);
            this.options = { ...this.options, ...result.options };
            return this.options;
        } catch (error) {
            console.error('Error loading options:', error);
            return this.options;
        }
    }

    async saveOptions() {
        try {
            await chrome.storage.local.set({ options: this.options });
            return true;
        } catch (error) {
            console.error('Error saving options:', error);
            return false;
        }
    }

    async updateOption(key, value) {
        this.options[key] = value;
        return this.saveOptions();
    }

    getOptions() {
        return this.options;
    }

    getOption(key) {
        return this.options[key];
    }
}
