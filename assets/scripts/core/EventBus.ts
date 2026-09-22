/**
 * 全局事件总线(轻量)
 * 解耦 UI / 地图 / 战斗 / 剧情模块
 */
type Handler = (...args: any[]) => void;

export class EventBus {
    private static map = new Map<string, { cb: Handler; target: any }[]>();

    static on(event: string, cb: Handler, target?: any): void {
        let list = this.map.get(event);
        if (!list) { list = []; this.map.set(event, list); }
        list.push({ cb, target });
    }

    static off(event: string, cb: Handler, target?: any): void {
        const list = this.map.get(event);
        if (!list) return;
        const idx = list.findIndex(h => h.cb === cb && h.target === target);
        if (idx >= 0) list.splice(idx, 1);
    }

    /** 清理某目标对象注册的所有监听 */
    static offTarget(target: any): void {
        this.map.forEach((list, event) => {
            const rest = list.filter(h => h.target !== target);
            if (rest.length === 0) this.map.delete(event);
            else this.map.set(event, rest);
        });
    }

    static emit(event: string, ...args: any[]): void {
        const list = this.map.get(event);
        if (!list) return;
        // 拷贝一份,防止回调中增删监听
        for (const h of list.slice()) h.cb.apply(h.target, args);
    }
}

/** 全局事件名常量 */
export const GEvent = {
    STATE_CHANGED: 'state-changed',
    PLAYER_MOVED: 'player-moved',        // (gridX, gridY, mapId)
    STEP_OCCURRED: 'step-occurred',      // 每走一步(遇敌判定)
    MAP_CHANGED: 'map-changed',          // (mapId)
    DIALOG_END: 'dialog-end',            // (nodeId, action)
    BATTLE_START: 'battle-start',        // (beastIds, bgTex)
    BATTLE_END: 'battle-end',            // ({win, exp, gold, beast?})
    PLAYER_HP_CHANGED: 'player-hp-changed',
    GOLD_CHANGED: 'gold-changed',
    FLAG_CHANGED: 'flag-changed',
    GAME_OVER: 'game-over',
    BEAST_JOINED: 'beast-joined',        // (beastId)
    DEX_ADDED: 'dex-added',              // (beastId)
    QUEST_CHANGED: 'quest-changed',      // (questId|null)
};