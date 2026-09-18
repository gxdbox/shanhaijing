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
        // ===== 第2期 南山经・西山经（日报开发）=====
        {
            id: 'xingxing',
            name: '狌狌',
            kind: '兽',
            quote: '招摇之山:有兽焉,其状如禺而白耳,伏行人走,其名曰狌狌,食之善走。',
            desc: '白耳灵猿,能直立行走,知往事而不能知未来,奔跑如飞。',
            maxHp: 22, maxMp: 6, atk: 10, def: 4, spd: 10,
            exp: 15, gold: 10,
            tex: 'beasts/xingxing', skills: ['panyue'],
            catchable: true,
        },
        {
            id: 'lushu',
            name: '鹿蜀',
            kind: '兽',
            quote: '杻阳之山:有兽焉,其状如马而白首,其文如虎而赤尾,其音如谣,其名曰鹿蜀,佩之宜子孙。',
            desc: '白头虎纹赤尾的瑞兽,鸣声如歌,温驯却警觉,其毛皮宜子孙。',
            maxHp: 34, maxMp: 18, atk: 11, def: 7, spd: 9,
            exp: 40, gold: 28,
            tex: 'beasts/lushu', skills: ['fuzhe', 'yaoge'],
            catchable: true,
        },
        {
            id: 'zheng',
            name: '狰',
            kind: '兽',
            quote: '章莪之山:有兽焉,其状如赤豹,五尾一角,其音如击石,其名曰狰。',
            desc: '赤豹五尾独角的怪山之主,吼声如击石,震慑山林。',
            maxHp: 52, maxMp: 10, atk: 17, def: 9, spd: 8,
            exp: 70, gold: 45,
            tex: 'beasts/zheng', skills: ['jishi', 'wuweisao'],
            catchable: true,
        },
        {
            id: 'bifang',
            name: '毕方',
            kind: '鸟',
            quote: '章莪之山:有鸟焉,其状如鹤,一足,赤文青质而白喙,名曰毕方,其鸣自叫也,见则其邑有讹火。',
            desc: '单足青鹤,赤纹白喙,鸣声自呼其名,所至之处必有讹火。',
            maxHp: 45, maxMp: 26, atk: 16, def: 6, spd: 13,
            exp: 80, gold: 55,
            tex: 'beasts/bifang', skills: ['ehua'],
            catchable: true,
        },
        {
            id: 'dijiang',
            name: '帝江',
            kind: '神',
            quote: '天山:有神焉,其状如黄囊,赤如丹火,六足四翼,浑敦无面目,是识歌舞,实为帝江也。',
            desc: '赤囊六足四翼的无面之神,通晓歌舞,混沌未凿,乃帝鸿之相。',
            maxHp: 130, maxMp: 40, atk: 24, def: 12, spd: 10,
            exp: 400, gold: 300,
            tex: 'beasts/dijiang', skills: ['hundunwu'],
            boss: true,
        },
        // ===== 第3期 青丘・南岭・西荒（日报开发）=====
        {
            id: 'guanguan',
            name: '灌灌',
            kind: '鸟',
            quote: '青丘之山:有鸟焉,其状如鸠,其音若呵,名曰灌灌,佩之不惑。',
            desc: '青丘的呵鸣灵鸟,羽佩于身可不受迷惑,与九尾狐同栖一山。',
            maxHp: 24, maxMp: 14, atk: 10, def: 5, spd: 9,
            exp: 30, gold: 12,
            tex: 'beasts/guanguan', skills: ['qingxin'],
            catchable: true,
        },
        {
            id: 'gudiao',
            name: '蛊雕',
            kind: '兽',
            quote: '鹿吴之山:水有兽焉,名曰蛊雕,其状如雕而有角,其音如婴儿之音,是食人。',
            desc: '水陆两栖的猛禽,头顶弯角,以婴儿啼哭诱食行人,食人恶兽。',
            maxHp: 62, maxMp: 20, atk: 19, def: 8, spd: 11,
            exp: 110, gold: 70,
            tex: 'beasts/gudiao', skills: ['yingti'],
            catchable: true,
        },
        {
            id: 'bo',
            name: '驳',
            kind: '兽',
            quote: '中曲之山:有兽焉,其状如马而白身黑尾,一角,虎牙爪,音如鼓音,其名曰驳,是食虎豹,可以御兵。',
            desc: '白身黑尾的独角灵马,虎牙虎爪,鸣声如鼓,以虎豹为食,可御兵灾。',
            maxHp: 68, maxMp: 18, atk: 16, def: 13, spd: 7,
            exp: 120, gold: 80,
            tex: 'beasts/bo', skills: ['yubing'],
            catchable: true,
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