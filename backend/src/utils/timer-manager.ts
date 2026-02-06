export class TimerManager {
  private timers = new Map<string, NodeJS.Timeout>();

  set(key: string, callback: () => void, delay: number): void {
    this.clear(key);
    this.timers.set(key, setTimeout(callback, delay));
  }

  clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.timers.keys()) {
      if (key.startsWith(prefix)) {
        this.clear(key);
      }
    }
  }

  has(key: string): boolean {
    return this.timers.has(key);
  }

  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

export const timerManager = new TimerManager();
