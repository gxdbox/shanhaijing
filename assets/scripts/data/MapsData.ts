import { MapDef } from '../core/GameData';

/**
 * 地图数据(字符画)
 * 编码: 0草地 1路 2水(阻) 3山(阻) 4木地板 5墙(阻) 6门 7井(阻)
 *       8树(阻) 9桥 A洞地 B洞口 C祠堂地 D床桌(阻) E花 F石台/屋顶(阻)
 */
export class MapsData {
    static home: MapDef = {
        id: 'home',
        name: '家中',
        cols: 10, rows: 9,
        ground: [
            '5555555555',
            '54D4444445',
            '5444444445',
            '5444444445',
            '5444444445',
            '5444444445',
            '5444444445',
            '5444444445',
            '5555565555',
        ],
        npcs: [
            { id: 'mother', name: '母亲', x: 6, y: 3, dir: 'down', dialogue: 'mother', tex: 'npc/mother' },
        ],
        portals: [
            { x: 5, y: 8, mapId: 'qingqiu', tx: 3, ty: 7, dir: 'down' },
        ],
        encounters: [],
        encounterRate: 0,
        pool: [],
        bgTex: 'battle/home',
    };

    static qingqiu: MapDef = {
        id: 'qingqiu',
        name: '青丘村',
        cols: 22, rows: 16,
        ground: [
            '3333333333333333333333',
            '3000000000110000000003',
            '3000000000110000000003',
            '300080E000110000800003',
            '3FF000000011000000FF03',
            '3FF000000011000000FF03',
            '3006111111111111111103',
            '3000000000110000000003',
            '3000000080110000000003',
            '3000070000110000008003',
            '3000000000110000000003',
            '3000000000110000000003',
            '3000800000110000080003',
            '3000000000110000E00003',
            '3000000000110000000003',
            '3333333333333333333333',
        ],
        npcs: [
            { id: 'grandpa', name: '爷爷', x: 10, y: 13, dir: 'down', dialogue: 'grandpa', tex: 'npc/grandpa' },
            { id: 'elder', name: '长老', x: 19, y: 6, dir: 'down', dialogue: 'elder', tex: 'npc/elder' },
        ],
        portals: [
            { x: 10, y: 1, mapId: 'wild', tx: 13, ty: 16, dir: 'up' },
            { x: 3, y: 6, mapId: 'home', tx: 5, ty: 7, dir: 'up' },
        ],
        encounters: [],
        encounterRate: 0,
        pool: [],
        bgTex: 'battle/qingqiu',
    };

    static wild: MapDef = {
        id: 'wild',
        name: '青丘之野',
        cols: 26, rows: 18,
        ground: [
            '33333333333333333333333333',
            '30000000000010000000000003',
            '30000008000000000000008003',
            '30000000000000000000000003',
            '30008000000000000000008003',
            '30000000000000000002200003',
            '30000000000000000002200003',
            '30000000000000000009200003',
            '30000000000000000002200003',
            '30000000000000000002200003',
            '30000000000000080002200003',
            '30000000000000000002200003',
            '30000800000000000000220003',
            '30000000000000000002200003',
            '30000000000001000000000003',
            '30000000000001000000000003',
            '33000000000001000000000033',
            '33333333333310333333333333',
        ],
        npcs: [
            { id: 'jiuwei_npc', name: '九尾狐', x: 16, y: 10, dir: 'down', dialogue: 'jiuwei_npc', tex: 'beasts/jiuwei' },
            { id: 'guanguan', name: '灌灌', x: 4, y: 8, dir: 'down', dialogue: 'guanguan', tex: 'beasts/guanguan' },
        ],
        portals: [
            { x: 13, y: 17, mapId: 'qingqiu', tx: 10, ty: 2, dir: 'down' },
            { x: 12, y: 1, mapId: 'cave', tx: 6, ty: 12, dir: 'up' },
            { x: 2, y: 1, mapId: 'zhaoyao', tx: 8, ty: 10, dir: 'up' },
        ],
        encounters: [
            { x: 13, y: 16, beastIds: ['zhi'], once: true },
        ],
        encounterRate: 0.015,
        pool: ['zhi', 'xuangui', 'huanshu', 'xingxing', 'lushu', 'guanguan'],
        bgTex: 'battle/field',
    };

    static zhaoyao: MapDef = {
        id: 'zhaoyao',
        name: '招摇之山',
        cols: 18, rows: 12,
        ground: [
            '333333333333333333',
            '300008000000800003',
            '300000000000000003',
            '300080000800000003',
            '300000222000000003',
            '300000000000000003',
            '300000008000000003',
            '300800000000008003',
            '300000000000000003',
            '300000000000080003',
            '300000000000000003',
            '333333333333333333',
        ],
        npcs: [
            { id: 'xingxing', name: '狌狌', x: 6, y: 5, dir: 'down', dialogue: 'xingxing_talk', tex: 'beasts/xingxing' },
            { id: 'jingwei', name: '精卫', x: 13, y: 9, dir: 'down', dialogue: 'jingwei_meet', tex: 'npc/jingwei' },
        ],
        portals: [
            { x: 8, y: 10, mapId: 'wild', tx: 2, ty: 2, dir: 'down' },
            { x: 16, y: 6, mapId: 'tianshan', tx: 1, ty: 6, dir: 'right' },
        ],
        encounters: [
            { x: 10, y: 8, beastIds: ['lushu'], once: true, winFlag: 'lushu_down' },
            { x: 4, y: 3, beastIds: ['zheng'], once: true, winFlag: 'zheng_down' },
            { x: 13, y: 2, beastIds: ['bifang'], once: true, winFlag: 'bifang_down' },
            { x: 15, y: 4, beastIds: ['gudiao'], once: true, winFlag: 'gudiao_down' },
            { x: 1, y: 8, beastIds: ['bo'], once: true, winFlag: 'bo_down' },
        ],
        encounterRate: 0.02,
        pool: ['xingxing', 'guanguan'],
        bgTex: 'battle/zhaoyao',
    };

    static tianshan: MapDef = {
        id: 'tianshan',
        name: '天山',
        cols: 16, rows: 12,
        ground: [
            '3333333333333333',
            '3000000000000003',
            '3000AAAAAAAA0003',
            '300A00000000A003',
            '300A00000000A003',
            '3000000000000003',
            '3000000000000003',
            '300AA000000AA003',
            '300A00000000A003',
            '3000000000000003',
            '3000000000000003',
            '3333333333333333',
        ],
        npcs: [
            { id: 'stone', name: '石碑', x: 7, y: 5, dir: 'down', dialogue: 'dijiang_before', tex: 'npc/stone' },
        ],
        portals: [
            { x: 1, y: 6, mapId: 'zhaoyao', tx: 15, ty: 6, dir: 'left' },
        ],
        encounters: [
            { x: 12, y: 6, beastIds: ['dijiang'], once: true, winFlag: 'dijiang_down' },
        ],
        encounterRate: 0,
        pool: [],
        bgTex: 'battle/tianshan',
    };

    static cave: MapDef = {
        id: 'cave',
        name: '雾隐洞',
        cols: 18, rows: 14,
        ground: [
            '333333333333333333',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAFAAAFAAAAAA3A',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAA22AAAA22AAAA3',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAAAAAAAAAAAFA3',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAFAAAAAAAAAAA3',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAAAAAAAAAAAA3A',
            '3AAAAABAAAAAAAAAA3',
        ],
        npcs: [],
        portals: [
            { x: 6, y: 13, mapId: 'wild', tx: 12, ty: 2, dir: 'down' },
        ],
        encounters: [
            { x: 14, y: 7, beastIds: ['yinglong'], once: true, winFlag: 'yinglong_down' },
            { x: 8, y: 3, beastIds: ['qiongqi'], once: true, winFlag: 'qiongqi_down' },
        ],
        encounterRate: 0.02,
        pool: ['xuangui', 'huanshu'],
        bgTex: 'battle/cave',
    };

    static all: MapDef[] = [MapsData.home, MapsData.qingqiu, MapsData.wild, MapsData.zhaoyao, MapsData.tianshan, MapsData.cave];

    private static map = new Map<string, MapDef>(MapsData.all.map(m => [m.id, m]));

    static get(id: string): MapDef {
        return this.map.get(id)!;
    }
}
