import { BeastDef } from '../core/GameData';

/**
 * 异兽进化表 —— 收集→培养→进化（参考宝可梦式进化）
 * 规则:羁绊Lv4 + 等级≥10 → 自动进化
 * 进化后:名字+「灵」前缀,全属性+40%,学会对应五行进化技
 * 通过 BeastsData.get('xxx_evo') 取进化形态(数据在原形态基础上生成)
 */
export class EvolutionsData {
    // 可进化异兽列表(id -> 进化形态名)
    static readonly evolutions: Record<string, string> = {
        zhi: '灵彘', xuangui: '灵龟', huanshu: '灵犀', jiuwei: '九尾灵狐',
        xingxing: '灵猿', lushu: '灵鹿蜀', zheng: '灵狰', bifang: '灵毕方',
        guanguan: '灵灌灌', gudiao: '灵蛊雕', bo: '灵驳', wenyao: '灵文鳐',
        huan: '灵讙', shuhu: '灵孰湖', mengji: '灵孟极', tiangou: '灵天狗',
        heluoyu: '灵何罗', ershu: '灵耳鼠', zhuhuai: '灵诸怀',
    };

    // 按五行给进化专属技(通用但符合属性)
    static readonly evoSkills: Record<string, string> = {
        '金': 'jinling_po',  // 金灵破:单体金芒重击
        '木': 'muling_yu',   // 木灵愈:全队回复
        '水': 'shuiling_xiao', // 水灵啸:水系群攻
        '火': 'huoling_fen', // 火灵焚:火系重击
        '土': 'tuling_zhen', // 土灵镇:土系震荡
    };

    /** 生成进化形态的 BeastDef(原属性×1.4,名字+灵,加进化技) */
    static evoDef(base: BeastDef): BeastDef {
        if (!this.canEvolve(base.id)) return base;
        const evoName = this.evolutions[base.id];
        const evoSkill = this.evoSkills[base.element || '土'] ?? 'hundun_tunshi';
        return {
            ...base,
            id: base.id + '_evo',
            name: evoName,
            maxHp: Math.floor(base.maxHp * 1.4),
            maxMp: Math.floor(base.maxMp * 1.4),
            atk: Math.floor(base.atk * 1.4),
            def: Math.floor(base.def * 1.4),
            spd: Math.floor(base.spd * 1.4),
            skills: [...base.skills, evoSkill],
            boss: false,
            catchable: true,
        };
    }

    static canEvolve(beastId: string): boolean {
        return beastId in this.evolutions;
    }
}