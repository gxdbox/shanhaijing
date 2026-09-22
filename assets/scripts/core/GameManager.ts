import { ActorStats, BeastDef, SaveData, WeaponDef } from './GameData';
import { BeastsData } from '../data/BeastsData';
import { MapsData } from '../data/MapsData';
import { SkillsData } from '../data/SkillsData';
import { WeaponsData } from '../data/WeaponsData';
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
    weaponId = 'wooden_sword';         // 当前武器(DQ式装备)
    attrPoints = 0;                    // 未分配的属性点(每次升级+3)
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
        this.weaponId = 'wooden_sword';
        this.attrPoints = 0;
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
            this.weaponId = data.weaponId || 'wooden_sword';
            this.attrPoints = data.attrPoints || 0;
            this.flags = new Set(data.flags);
            this.playTime = data.playTime;
            this.curMapId = data.mapId;
            this.spawnX = data.x;
            this.spawnY = data.y;
            this.migrateFlags();
        } else {
            this.newGame();
        }
    }

    /**
     * 旧存档兼容:修复"战败后固定BOSS消失"的历史 bug。
     * 旧版本在触发战斗的瞬间就写入 enc!flag,战败后穷奇/应龙永久消失、剧情卡死。
     * 现在:触发点标记只有真正击败后才写。读档时若发现"已标记但对应 winFlag 不存在",
     * 说明玩家当年是战败离开的 → 移除标记,让 BOSS 重新出现。
     */
    private migrateFlags(): void {
        for (const map of MapsData.all) {
            for (const enc of map.encounters) {
                if (!enc.once || !enc.winFlag) continue;
                const encKey = `enc!${map.id}_${enc.x}_${enc.y}`;
                if (this.flags.has(encKey) && !this.flags.has(enc.winFlag)) {
                    this.flags.delete(encKey);
                    console.log(`[GameManager] 兼容修复:重放固定遇敌 ${map.id}(${enc.x},${enc.y})`);
                }
            }
        }
    }

    save(): void {
        const data: SaveData = {
            player: this.player,
            beast: this.beast,
            dex: this.dex,
            gold: this.gold,
            weaponId: this.weaponId,
            attrPoints: this.attrPoints,
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

    /** 购买武器:扣金币+装备(仅能买更高阶的) */
    buyWeapon(id: string): { ok: boolean; msg: string } {
        const w = WeaponsData.get(id);
        if (!w) return { ok: false, msg: '没有这把武器。' };
        if (this.gold < w.price) return { ok: false, msg: `金币不足!(需 ${w.price})` };
        this.gold -= w.price;
        this.weaponId = id;
        EventBus.emit(GEvent.GOLD_CHANGED, this.gold);
        return { ok: true, msg: `买下「${w.name}」!攻击 +${w.atkBonus}` };
    }

    /** 当前武器 */
    getWeapon(): WeaponDef {
        return WeaponsData.get(this.weaponId);
    }

    /** 武器攻击加成(叠加到战斗者 atk) */
    getWeaponBonus(): number {
        return this.getWeapon().atkBonus;
    }

    /** 旅店休息:扣金币+全队回满 */
    restAtInn(cost: number): { ok: boolean; msg: string } {
        if (this.gold < cost) return { ok: false, msg: `金币不足!(需 ${cost})` };
        this.gold -= cost;
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        if (this.beast) {
            this.beast.hp = this.beast.maxHp;
            this.beast.mp = this.beast.maxMp;
        }
        EventBus.emit(GEvent.GOLD_CHANGED, this.gold);
        EventBus.emit(GEvent.PLAYER_HP_CHANGED);
        return { ok: true, msg: '你美美地睡了一觉,体力全满!' };
    }

    addFlag(flag: string): void {
        this.flags.add(flag);
        EventBus.emit(GEvent.FLAG_CHANGED, flag);
    }

    removeFlag(flag: string): void {
        this.flags.delete(flag);
    }

    hasFlag(flag: string): boolean {
        return this.flags.has(flag);
    }

    /** 战斗队伍:主角(含武器加成) + 随行异兽 */
    getParty(): ActorStats[] {
        const list: ActorStats[] = [];
        // 玩家用副本+武器加成(不污染存档数据)
        list.push({
            ...this.player,
            atk: this.player.atk + this.getWeaponBonus(),
        });
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
            // 升级自由属性点(供玩家分配:攻/防/速/生命)
            this.attrPoints += 3;
            console.log(`[升级] ${this.player.name} Lv.${this.player.level}! 获得 3 点自由属性点`);
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

    /** 分配自由属性点:key=atk/def/spd/maxHp, 成功返回 true */
    spendAttrPoint(key: string): boolean {
        if (this.attrPoints <= 0) return false;
        const p = this.player;
        switch (key) {
            case 'atk': p.atk += 2; break;
            case 'def': p.def += 2; break;
            case 'spd': p.spd += 1; break;
            case 'maxHp': p.maxHp += 10; p.hp = Math.min(p.maxHp, p.hp + 10); break;
            default: return false;
        }
        this.attrPoints--;
        EventBus.emit(GEvent.PLAYER_HP_CHANGED);
        return true;
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