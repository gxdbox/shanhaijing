import { ActorStats, BeastDef, SaveData } from './GameData';
import { BeastsData } from '../data/BeastsData';
import { SkillsData } from '../data/SkillsData';
import { EventBus, GEvent } from './EventBus';
import { SaveManager } from './SaveManager';

/** 游戏全局状态机 */
export enum GameState {
    BOOT = 'BOOT',          // 启动
    EXPLORE = 'EXPLORE',    // 地图探索
    DIALOG = 'DIALOG',      // 对话/剧情
    BATTLE = 'BATTLE',      // 战斗
    MENU = 'MENU',          // 菜单(图鉴等)
    TRANSITION = 'TRANSITION',
    GAMEOVER = 'GAMEOVER',
}

/** 升级所需经验曲线:DQ 式 4*n^3/5 简化 */
export function expForLevel(level: number): number {
    return Math.floor(4 * level * level * level / 5);
}

export class GameManager {
    static inst: GameManager;

    private _state: GameState = GameState.BOOT;

    player: ActorStats;
    beast: ActorStats | null = null;   // 随行异兽伙伴
    dex: string[] = [];                // 图鉴
    gold = 0;
    flags = new Set<string>();
    playTime = 0;

    curMapId = 'home';
    spawnX = 4;
    spawnY = 4;

    get state(): GameState { return this._state; }

    /** 切换状态并广播 */
    setState(s: GameState): void {
        if (this._state === s) return;
        console.log(`[GameManager] ${this._state} -> ${s}`);
        this._state = s;
        EventBus.emit(GEvent.STATE_CHANGED, s);
    }

    /** 新游戏初始数据 */
    newGame(): void {
        this.player = {
            name: '阿玄',
            level: 1,
            hp: 30, maxHp: 30,
            mp: 12, maxMp: 12,
            atk: 8, def: 5,
            spd: 7,
            exp: 0, nextExp: expForLevel(2),
            skills: [],
        };
        this.beast = null;
        this.dex = [];
        this.gold = 50;
        this.flags = new Set<string>();
        this.playTime = 0;
        this.curMapId = 'home';
        this.spawnX = 4;
        this.spawnY = 6;
    }

    /** 游戏开始(新档 或 读档) */
    start(): void {
        const data = SaveManager.load();
        if (data) {
            this.player = data.player;
            this.beast = data.beast;
            this.dex = data.dex;
            this.gold = data.gold;
            this.flags = new Set(data.flags);
            this.playTime = data.playTime;
            this.curMapId = data.mapId;
            this.spawnX = data.x;
            this.spawnY = data.y;
        } else {
            this.newGame();
        }
    }

    save(): void {
        const data: SaveData = {
            player: this.player,
            beast: this.beast,
            dex: this.dex,
            gold: this.gold,
            flags: Array.from(this.flags),
            mapId: this.curMapId,
            x: this.spawnX,
            y: this.spawnY,
            playTime: this.playTime,
        };
        SaveManager.save(data);
    }

    addGold(n: number): void {
        this.gold = Math.max(0, this.gold + n);
        EventBus.emit(GEvent.GOLD_CHANGED, this.gold);
    }

    addFlag(flag: string): void {
        this.flags.add(flag);
        EventBus.emit(GEvent.FLAG_CHANGED, flag);
    }

    hasFlag(flag: string): boolean {
        return this.flags.has(flag);
    }

    /** 战斗队伍:主角 + 随行异兽 */
    getParty(): ActorStats[] {
        const list: ActorStats[] = [this.player];
        if (this.beast) list.push(this.beast);
        return list;
    }

    /** 收服异兽 */
    catchBeast(id: string): boolean {
        if (!this.beast) {
            const def = BeastsData.get(id);
            this.beast = BeastsData.toActor(def);
            EventBus.emit(GEvent.BEAST_JOINED, id);
            this.addToDex(id);
            return true;
        }
        // 已有伙伴:加入图鉴并转化为经验
        this.addToDex(id);
        this.player.exp += 30;
        return false;
    }

    /** 图鉴收录 */
    addToDex(id: string): void {
        if (!this.dex.includes(id)) {
            this.dex.push(id);
            EventBus.emit(GEvent.DEX_ADDED, id);
        }
    }

    /** 全队治疗(回村/剧情) */
    healAll(): void {
        const party = this.getParty();
        for (const a of party) {
            a.hp = a.maxHp;
            a.mp = a.maxMp;
        }
        EventBus.emit(GEvent.PLAYER_HP_CHANGED);
    }

    /** 给玩家加经验并结算升级 */
    gainExp(amount: number): void {
        this.player.exp += amount;
        while (this.player.exp >= this.player.nextExp) {
            this.player.exp -= this.player.nextExp;
            this.player.level++;
            this.player.nextExp = expForLevel(this.player.level);
            // 属性成长
            this.player.maxHp += 6 + Math.floor(this.player.level / 3);
            this.player.maxMp += 3;
            this.player.atk += 2;
            this.player.def += 2;
            this.player.spd += 1;
            this.player.hp = this.player.maxHp;
            this.player.mp = this.player.maxMp;
            console.log(`[升级] ${this.player.name} Lv.${this.player.level}!`);
        }
        // 伙伴同步升级(简单跟随)
        if (this.beast && this.beast.level < this.player.level) {
            this.beast.level = this.player.level;
            this.beast.maxHp += 5;
            this.beast.maxMp += 4;
            this.beast.atk += 2;
            this.beast.def += 2;
            this.beast.hp = Math.min(this.beast.maxHp, this.beast.hp + 5);
        }
        EventBus.emit(GEvent.PLAYER_HP_CHANGED);
    }

    /** 玩家是否习得某技能(主角技能随剧情解锁) */
    knowsSkill(actor: ActorStats, skillId: string): boolean {
        return actor.skills.includes(skillId);
    }

    getSkillName(id: string): string {
        const s = SkillsData.get(id);
        return s ? s.name : id;
    }
}