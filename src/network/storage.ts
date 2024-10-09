class Storage {
  private localStorage: any;

  constructor() {
    // Dynamically import localStorage to avoid TypeScript errors
    this.localStorage = require('localStorage');
  }

  getItem(key: string): string | null {
    return this.localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.localStorage.removeItem(key);
  }
}

export const storage = new Storage();