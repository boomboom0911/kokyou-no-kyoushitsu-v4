const STORAGE_VERSION = 1;

interface StorageItem<T> {
  version: number;
  data: T;
}

export const storage = {
  /**
   * データをLocalStorageに保存
   */
  save: <T>(key: string, data: T): void => {
    try {
      const item: StorageItem<T> = {
        version: STORAGE_VERSION,
        data,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  /**
   * LocalStorageからデータを読み込み
   */
  load: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item) as StorageItem<T>;

      // バージョンチェック
      if (parsed.version !== STORAGE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * データを削除
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  /**
   * 全データをクリア
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// 開発環境での自動クリア
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const APP_VERSION = '4.0';
  const storedVersion = localStorage.getItem('appVersion');

  if (storedVersion !== APP_VERSION) {
    localStorage.clear();
    localStorage.setItem('appVersion', APP_VERSION);
    console.log('🗑️ LocalStorage cleared for new version:', APP_VERSION);
  }
}
