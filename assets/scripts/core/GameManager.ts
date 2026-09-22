import { ActorStats, ArmorDef, BeastDef, ItemDef, QuestDef, SaveData, WeaponDef } from './GameData';
import { BeastsData } from '../data/BeastsData';
import { MapsData } from '../data/MapsData';
import { SkillsData } from '../data/SkillsData';
import { WeaponsData } from '../data/WeaponsData';
import { ArmorsData } from '../data/ArmorsData';
import { ItemsData } from '../data/ItemsData';
import { QuestsData } from '../data/QuestsData';
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
    armorId = 'cloth_armor';           // 当前防具
    items: string[] = [];              // 背包(物品id)
    attrPoints = 0;                    // 未分配的属性点(每次升级+3)
    questId: string | null = null;     // 当前主线任务
    questDone: string[] = [];          // 已完成任务
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
        this.armorId = 'cloth_armor';
        this.items = [];
        this.attrPoints = 0;
        this.questId = 'q1_elder_errand';
        this.questDone = [];
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
            this.armorId = data.armorId || 'cloth_armor';
            this.items = data.items || [];
            this.attrPoints = data.attrPoints || 0;
            this.questId = data.questId || null;
            this.questDone = data.questDone || [];
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
            armorId: this.armorId,
            items: this.items,
            attrPoints: this.attrPoints,
            questId: this.questId ?? undefined,
            questDone: this.questDone,
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

    /** 购买防具:扣钱换装(DQ式装备成长) */
    buyArmor(id: string): { ok: boolean; msg: string } {
        const a = ArmorsData.get(id);
        if (!a) return { ok: false, msg: '没有这件防具。' };
        if (this.gold < a.price) return { ok: false, msg: `金币不足!(需 ${a.price})` };
        this.gold -= a.price;
        this.armorId = id;
        EventBus.emit(GEvent.GOLD_CHANGED, this.gold);
        return { ok: true, msg: `穿上「${a.name}」!防御 +${a.defBonus}` };
    }

    /** 当前防具 */
    getArmor(): ArmorDef {
        return ArmorsData.get(this.armorId);
    }

    /** 防具防御加成(叠加到战斗者 def) */
    getArmorBonus(): number {
        return this.getArmor().defBonus;
    }

    /** 获得物品(战斗掉落/奖励),stack 存多份 */
    addItem(id: string, count = 1): void {
        const def = ItemsData.get(id);
        if (!def) return;
        for (let i = 0; i < count; i++) this.items.push(id);
    }

    /** 背包里某物品数量 */
    itemCount(id: string): number {
        return this.items.filter(x => x === id).length;
    }

    /** 使用丹药(战斗外):回复HP/MP */
    usePotion(id: string): { ok: boolean; msg: string } {
        const def = ItemsData.get(id);
        if (!def || def.type !== 'potion') return { ok: false, msg: '这不是可用的丹药。' };
        const idx = this.items.indexOf(id);
        if (idx < 0) return { ok: false, msg: '背包里没有这个丹药。' };
        this.items.splice(idx, 1);
        if (def.healHp) { this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.healHp); }
        if (def.healMp) { this.player.mp = Math.min(this.player.maxMp, this.player.mp + def.healMp); }
        EventBus.emit(GEvent.PLAYER_HP_CHANGED);
        return { ok: true, msg: `服下「${def.name}」!${def.healHp ? `HP +${def.healHp} ` : ''}${def.healMp ? `MP +${def.healMp}` : ''}` };
    }

    /** 炼金合成:消耗素材→丹药(重装机兵式掉落→合成循环) */
    craftItem(recipeId: string): { ok: boolean; msg: string } {
        const rc = ItemsData.recipes.find(r => r.id === recipeId);
        if (!rc) return { ok: false, msg: '没有这个配方。' };
        // 检查素材足够
        for (const [matId, need] of rc.need) {
            if (this.itemCount(matId) < need) {
                const mat = ItemsData.get(matId);
                return { ok: false, msg: `素材不足:还缺 ${mat?.name ?? matId} ×${need}` };
            }
        }
        // 扣素材、给成品
        for (const [matId, need] of rc.need) {
            let left = need;
            for (let i = this.items.length - 1; i >= 0 && left > 0; i--) {
                if (this.items[i] === matId) { this.items.splice(i, 1); left--; }
            }
        }
        const out = ItemsData.get(rc.out);
        this.items.push(rc.out);
        return { ok: true, msg: `炼制成功!获得「${out?.name ?? rc.out}」` };
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
        // 任务检测:若此 flag 正好达成当前任务,自动发奖并推进
        this.checkQuestProgress();
    }

    removeFlag(flag: string): void {
        this.flags.delete(flag);
    }

    hasFlag(flag: string): boolean {
        return this.flags.has(flag);
    }

    /** 战斗队伍:主角(含武器攻击+防具防御加成) + 随行异兽 */
    getParty(): ActorStats[] {
        const list: ActorStats[] = [];
        // 玩家用副本+武器/防具加成(不污染存档数据)
        list.push({
            ...this.player,
            atk: this.player.atk + this.getWeaponBonus(),
            def: this.player.def + this.getArmorBonus(),
            element: this.player.element || this.getWeapon().element || '金',
        });
        if (this.beast) list.push(this.beast);
        return list;
    }

    /** 收服异兽 */
    catchBeast(id: string): boolean {
        if (!this.beast) {
            const def = BeastsData.get(id);
            this.beast = BeastsData.toActor(def);
            // 羁绊初始化:1级+0经验
            this.beast.bond = 1;
            this.beast.bondExp = 0;
            EventBus.emit(GEvent.BEAST_JOINED, id);
            this.addToDex(id);
            return true;
        }
        // 已有伙伴:加入图鉴并转化为经验
        this.addToDex(id);
        this.player.exp += 30;
        return false;
    }

    /** 羁绊经验需求:等级 → 下一级所需经验 */
    bondExpNeed(level: number): number {
        return 20 + (level - 1) * 30;   // 20/50/80/110
    }

    /** 随行异兽获得羁绊经验(战斗胜利调用);升级时若达到Lv2解锁专属技能 */
    gainBeastBond(amount: number): { leveled: boolean; newSkill?: string } {
        const b = this.beast;
        if (!b) return { leveled: false };
        b.bondExp = (b.bondExp || 0) + amount;
        let leveled = false;
        let newSkill: string | undefined;
        while (b.bond && b.bond < 5 && b.bondExp >= this.bondExpNeed(b.bond)) {
            b.bondExp -= this.bondExpNeed(b.bond);
            b.bond++;
            leveled = true;
            // Lv2 解锁羁绊专属技能
            if (b.bond === 2) {
                const def = BeastsData.get(b.beastId!);
                if (def.bondSkill && !b.skills.includes(def.bondSkill)) {
                    b.skills.push(def.bondSkill);
                    newSkill = def.bondSkill;
                }
            }
        }
        EventBus.emit(GEvent.BEAST_JOINED, b.beastId!);   // 刷新HUD
        return { leveled, newSkill };
    }

    // ==================== 任务系统(M3) ====================

    /** 当前任务(无则 null) */
    getQuest(): QuestDef | null {
        return this.questId ? QuestsData.get(this.questId) : null;
    }

    /** 检查并推进当前任务:若完成条件flag达成→发奖励→接续主线 */
    checkQuestProgress(): QuestDef | null {
        const q = this.getQuest();
        if (!q) return null;
        if (this.hasFlag(q.clearFlag)) {
            // 完成:发奖励
            this.addGold(q.rewardGold);
            this.gainExp(q.rewardExp);
            this.questDone.push(q.id);
            // 主线接续
            this.questId = q.next || null;
            EventBus.emit(GEvent.QUEST_CHANGED, this.questId);
            return q;
        }
        return null;
    }

    /** 喂食异兽:花费金币提升羁绊经验(养成盼头) */
    feedBeast(cost: number): { ok: boolean; msg: string } {
        if (!this.beast) return { ok: false, msg: '没有随行异兽可喂食。' };
        if (this.gold < cost) return { ok: false, msg: `金币不足,需要 ${cost} 金币。` };
        this.addGold(-cost);
        const amt = Math.floor(cost / 10);   // 每10金 = 1羁绊经验
        const r = this.gainBeastBond(amt);
        let msg = `${this.beast.name} 吃了一顿好食,羁绊经验 +${amt}。`;
        if (r.newSkill) {
            const s = SkillsData.get(r.newSkill);
            msg += `羁绊提升!学会了「${s.name}」!`;
        } else if (r.leveled) {
            msg += `羁绊提升到 Lv.${this.beast.bond}!`;
        }
        this.save();
        return { ok: true, msg };
    }

    /** 当前随行异兽数量(悬赏统计用) */
    getBeastKillCount(targetId: string): number {
        let n = 0;
        this.flags.forEach(f => { if (f.startsWith(`kill_${targetId}`)) n++; });
        return n;
    }

    /** 记录击杀(悬赏进度):用当前flag数做唯一后缀,避免同毫秒重复 */
    recordKill(targetId: string): void {
        this.addFlag(`kill_${targetId}_${this.flags.size}`);
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