/**
 * 游戏核心数据类型定义
 */

/** 技能定义 */
export interface SkillDef {
    id: string;
    name: string;
    desc: string;
    /** atk=物理攻击 magic=法术攻击 heal=治疗 buff=增益 */
    type: 'atk' | 'magic' | 'heal' | 'buff';
    power: number;          // 威力系数(攻击力的倍数)或固定治疗量
    mpCost: number;
    target: 'enemy' | 'allEnemies' | 'self' | 'ally';
    buffDef?: number;       // buff 增加的防御值
    learnBeast?: string;    // 专属异兽
}

/** 异兽(敌人/伙伴)配置 */
export interface BeastDef {
    id: string;
    name: string;
    kind: string;           // 山海经原文分类(兽/鸟/龙…)
    quote: string;          // 《山海经》原文摘录
    desc: string;
    maxHp: number;
    maxMp: number;
    atk: number;
    def: number;
    spd: number;
    exp: number;
    gold: number;
    tex: string;            // 立绘资源路径(战斗第一人称)
    skills: string[];       // 初始技能
    bondSkill?: string;     // 羁绊Lv2解锁技能
    element?: string;       // 五行属性: 金木水火土
    boss?: boolean;
    catchable?: boolean;    // 可收服
}

/** 战斗者实时数据(玩家/伙伴/敌人通用) */
export interface ActorStats {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    atk: number;
    def: number;
    spd: number;
    exp: number;
    nextExp: number;        // 升到下一级所需
    skills: string[];       // 技能 id 列表
    bond?: number;          // 羁绊等级(1=刚收服,最高5)
    bondExp?: number;       // 羁绊经验(战斗胜利积累)
    element?: string;       // 五行属性(金木水火土,无则普攻无克制)
    tex?: string;           // 我方头像(伙伴消除用)
    beastId?: string;       // 若为异兽伙伴/敌方,对应的 BeastDef id
}

/** 存档结构 */
export interface SaveData {
    player: ActorStats;
    beast: ActorStats | null;   // 已收服的随行异兽
    dex: string[];              // 图鉴已收录异兽 id
    gold: number;
    weaponId: string;           // 当前武器
    attrPoints: number;         // 可分配的属性点(升级获得)
    flags: string[];
    mapId: string;
    x: number;
    y: number;
    playTime: number;
}

/** 武器定义 */
export interface WeaponDef {
    id: string;
    name: string;
    desc: string;
    atkBonus: number;   // 攻击加成
    price: number;      // 价格(金币)
    element?: string;   // 五金行属性
}

/** NPC 配置 */
export interface NpcDef {
    id: string;
    name: string;
    x: number;
    y: number;
    dir: 'up' | 'down' | 'left' | 'right';
    tex?: string;           // 立绘(留空则画小色块)
    dialogue: string;       // 对话节点 id(见 DialogueData)
    walkable?: boolean;     // 是否占格阻挡
}

/** 传送点(走到即触发) */
export interface PortalDef {
    x: number;
    y: number;
    mapId: string;          // 目标地图
    tx: number;
    ty: number;
    dir?: 'up' | 'down' | 'left' | 'right';
}

/** 固定遇敌(教学战/剧情战) */
export interface FixedEncounterDef {
    x: number;
    y: number;
    beastIds: string[];
    bgTex?: string;
    once?: boolean;         // 只触发一次
    flagKey?: string;       // 需要已具备的剧情标记
    winFlag?: string;       // 战胜后写入的剧情标记
}

/** 地图定义 */
export interface MapDef {
    id: string;
    name: string;
    cols: number;
    rows: number;
    /** 字符画地图,每行同长。编码: 0草地 1路 2水(阻) 3山(阻) 4木地板 5墙(阻) 6门 7井(阻) 8树(阻) 9桥 A洞地 B洞口 C祠堂地 D床桌(阻) E花 F石台/屋顶(阻) */
    ground: string[];
    npcs: NpcDef[];
    portals: PortalDef[];
    encounters: FixedEncounterDef[];
    encounterRate: number;  // 每步随机遇敌概率 0~1,0 为不遇敌
    pool: string[];         // 随机遇敌池
    bgTex: string;          // 战斗背景
}

/** 对话行 */
export interface DialogueLine {
    speaker: string;        // '' 表示旁白
    text: string;
}

/** 对话节点(数据驱动剧情) */
export interface DialogueNode {
    id: string;
    lines: DialogueLine[];
    /** 末尾选项 */
    choices?: { text: string; next: string }[];
    /** 默认下一节点 */
    next?: string;
    /** 结束时执行的指令列表,如 ["setFlag:hasBook","getBeast:jiuwei","battle:zhi"] */
    actions?: string[];
}