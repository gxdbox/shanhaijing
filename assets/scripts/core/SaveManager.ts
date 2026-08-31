import { sys } from 'cc';
import { SaveData } from './GameData';

const KEY = 'shj_save_v1';

/**
 * 存档管理:使用 cc.sys.localStorage
 * (web 与微信小游戏双端通用)
 */
export class SaveManager {
    static save(data: SaveData): void {
        try {
            sys.localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[SaveManager] 保存失败', e);
        }
    }

    static load(): SaveData | null {
        try {
            const raw = sys.localStorage.getItem(KEY);
            if (!raw) return null;
            return JSON.parse(raw) as SaveData;
        } catch (e) {
            console.warn('[SaveManager] 读取失败', e);
            return null;
        }
    }

    static hasSave(): boolean {
        return !!sys.localStorage.getItem(KEY);
    }

    static clear(): void {
        sys.localStorage.removeItem(KEY);
    }
}