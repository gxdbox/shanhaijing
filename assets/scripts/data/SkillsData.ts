import { SkillDef } from '../core/GameData';

/**
 * 技能表
 */
export class SkillsData {
    static list: SkillDef[] = [
        // —— 主角(获得《山海经》后习得)—— 
        {
            id: 'huofu',
            name: '炎符',
            desc: '以经书页为符,召出炎火灼烧一个敌人。',
            type: 'magic', power: 1.6, mpCost: 6, target: 'enemy',
        },
        {
            id: 'huichun',
            name: '回春术',
            desc: '东方句芒的生气,大幅回复一名队友。',
            type: 'heal', power: 24, mpCost: 7, target: 'ally',
        },
        // —— 异兽技能 ——
        {
            id: 'shuipao',
            name: '水柱',
            desc: '怪水之灵凝成水柱,喷向一个敌人。',
            type: 'magic', power: 1.4, mpCost: 4, target: 'enemy',
            learnBeast: 'xuangui',
        },
        {
            id: 'dujiao',
            name: '独角冲',
            desc: '挺起额前灵角,全力突刺一个敌人。',
            type: 'atk', power: 1.5, mpCost: 5, target: 'enemy',
            learnBeast: 'huanshu',
        },
        {
            id: 'yanzhu',
            name: '狐火・炎珠',
            desc: '九尾摇动,青蓝狐火如珠连射,焚烧一个敌人。',
            type: 'magic', power: 1.9, mpCost: 8, target: 'enemy',
            learnBeast: 'jiuwei',
        },
        {
            id: 'fengxi',
            name: '风啸',
            desc: '双翼鼓动巽风,卷袭全体敌人。',
            type: 'magic', power: 1.2, mpCost: 10, target: 'allEnemies',
            learnBeast: 'yinglong',
        },
        {
            id: 'tunri',
            name: '吞日',
            desc: '穷奇张开血口,天光为之黯淡,吞噬全体敌人。',
            type: 'magic', power: 1.5, mpCost: 12, target: 'allEnemies',
            learnBeast: 'qiongqi',
        },
        {
            id: 'huxiao',
            name: '虎啸',
            desc: '音如犬吠的怒吼,震慑并重击一个敌人。',
            type: 'atk', power: 1.2, mpCost: 0, target: 'enemy',
            learnBeast: 'zhi',
        },
        // ===== 第2期 异兽技能（日报开发,兼容现有战斗机制）=====
        {
            id: 'panyue',
            name: '攀跃',
            desc: '狌狌伏行扑击,以灵活身法重创一个敌人。',
            type: 'atk', power: 1.4, mpCost: 3, target: 'enemy',
            learnBeast: 'xingxing',
        },
        {
            id: 'fuzhe',
            name: '宜子孙・福泽',
            desc: '鹿蜀瑞兽的祝福,让一名伙伴恢复生命。',
            type: 'heal', power: 14, mpCost: 8, target: 'ally',
            learnBeast: 'lushu',
        },
        {
            id: 'yaoge',
            name: '谣歌',
            desc: '鹿蜀鸣声如谣,音波安抚,轻伤一个敌人。',
            type: 'atk', power: 1.1, mpCost: 4, target: 'enemy',
            learnBeast: 'lushu',
        },
        {
            id: 'jishi',
            name: '击石音',
            desc: '狰吼如击石,音波震荡,重击一个敌人。',
            type: 'atk', power: 1.6, mpCost: 5, target: 'enemy',
            learnBeast: 'zheng',
        },
        {
            id: 'wuweisao',
            name: '五尾扫',
            desc: '狰甩动五尾,横扫面前所有敌人。',
            type: 'atk', power: 1.1, mpCost: 8, target: 'allEnemies',
            learnBeast: 'zheng',
        },
        {
            id: 'ehua',
            name: '讹火',
            desc: '毕方喷出青红怪火,灼烧一个敌人。',
            type: 'magic', power: 1.8, mpCost: 8, target: 'enemy',
            learnBeast: 'bifang',
        },
        {
            id: 'hundunwu',
            name: '浑敦乱舞',
            desc: '帝江起舞,混沌之气席卷全场,重创所有敌人。',
            type: 'magic', power: 1.4, mpCost: 12, target: 'allEnemies',
            learnBeast: 'dijiang',
        },
    ];

    private static map = new Map<string, SkillDef>(
        SkillsData.list.map(s => [s.id, s])
    );

    static get(id: string): SkillDef {
        return this.map.get(id)!;
    }
}