import { ActorStats, BeastDef } from '../core/GameData';
import { expForLevel } from '../core/GameManager';

/**
 * 异兽图鉴数据 —— 全部取材自《山海经》原典
 */
export class BeastsData {
    static list: BeastDef[] = [
        {
            id: 'zhi',
            name: '彘',
            kind: '兽',
            quote: '浮玉之山:有兽焉,其状如虎而牛尾,其音如吠犬,其名曰彘,是食人。',
            desc: '形如虎而拖牛尾的凶兽,常成群出没于山野。',
            maxHp: 18, maxMp: 0, atk: 9, def: 3, spd: 4,
            exp: 12, gold: 8,
            tex: 'beasts/zhi', skills: [],
            catchable: true,
        },
        {
            id: 'xuangui',
            name: '旋龟',
            kind: '龟',
            quote: '怪水出焉……其中多玄龟,其状如龟而鸟首虺尾,其名曰旋龟,其音如判木。',
            desc: '鸟首蛇尾的神龟,背甲坚硬,能喷水柱。',
            maxHp: 26, maxMp: 8, atk: 10, def: 7, spd: 3,
            exp: 22, gold: 16,
            tex: 'beasts/xuangui', skills: ['shuipao'],
            catchable: true,
        },
        {
            id: 'huanshu',
            name: '䑏疏',
            kind: '兽',
            quote: '带山:有兽焉,其状如马,一角有错,其名曰䑏疏,可以辟火。',
            desc: '独角的灵马,日行千里,独角可辟火。',
            maxHp: 30, maxMp: 12, atk: 13, def: 5, spd: 8,
            exp: 34, gold: 24,
            tex: 'beasts/huanshu', skills: ['dujiao'],
            catchable: true,
        },
        {
            id: 'jiuwei',
            name: '九尾狐',
            kind: '兽',
            quote: '青丘之山:有兽焉,其状如狐而九尾,其音如婴儿,能食人;食者不蛊。',
            desc: '青丘的灵狐,九尾摇动时喷吐青蓝狐火,岁月悠长。',
            maxHp: 40, maxMp: 24, atk: 15, def: 8, spd: 12,
            exp: 60, gold: 0,
            tex: 'beasts/jiuwei', skills: ['yanzhu'],
            catchable: true,
        },
        {
            id: 'yinglong',
            name: '应龙',
            kind: '龙',
            quote: '大荒之中,有山名曰凶犁土丘。应龙处南极,杀蚩尤与夸父,不得复上。',
            desc: '生双翼的神龙,曾助黄帝斩蚩尤、诛夸父。',
            maxHp: 55, maxMp: 30, atk: 18, def: 9, spd: 14,
            exp: 95, gold: 60,
            tex: 'beasts/yinglong', skills: ['fengxi'],
            catchable: true,
        },
        {
            id: 'qiongqi',
            name: '穷奇',
            kind: '兽',
            quote: '邽山:其上有兽焉,其状如虎,猬毛,有翼,名曰穷奇,音如獋狗,是食人。',
            desc: '生翼如虎的石青色凶兽,雾隐洞之主,吞食万象。',
            maxHp: 90, maxMp: 20, atk: 20, def: 10, spd: 9,
            exp: 160, gold: 150,
            tex: 'beasts/qiongqi', skills: ['tunri'],
            boss: true,
        },
    ];

    private static map = new Map<string, BeastDef>(
        BeastsData.list.map(b => [b.id, b])
    );

    static get(id: string): BeastDef {
        return this.map.get(id)!;
    }

    /** 配置转战斗者数据 */
    static toActor(def: BeastDef): ActorStats {
        return {
            name: def.name,
            level: 1,
            hp: def.maxHp,
            maxHp: def.maxHp,
            mp: def.maxMp,
            maxMp: def.maxMp,
            atk: def.atk,
            def: def.def,
            spd: def.spd,
            exp: 0,
            nextExp: expForLevel(2),
            skills: def.skills,
            tex: def.tex,
            beastId: def.id,
        };
    }
}