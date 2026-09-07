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
            { id: 'mother', name: '母亲', x: 6, y: 3, dir: 'down', dialogue: 'mother' },
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
            { id: 'grandpa', name: '爷爷', x: 10, y: 13, dir: 'down', dialogue: 'grandpa' },
            { id: 'elder', name: '长老', x: 19, y: 6, dir: 'down', dialogue: 'elder' },
        ],
        portals: [
            { x: 10, y: 1, mapId: 'wild', tx: 13, ty: 16, dir: 'up' },
            { x: 3, y: 6, mapId: 'home', tx: 5, ty: 7, dir: 'up' },
        ],
        encounters: [],
        encounterRate: 0,
        pool: [],
        bgTex: 'battle/field',
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
            { id: 'jiuwei_npc', name: '九尾狐', x: 16, y: 10, dir: 'down', dialogue: 'jiuwei_npc' },
        ],
        portals: [
            { x: 13, y: 17, mapId: 'qingqiu', tx: 10, ty: 2, dir: 'down' },
            { x: 12, y: 1, mapId: 'cave', tx: 6, ty: 12, dir: 'up' },
        ],
        encounters: [
            { x: 13, y: 16, beastIds: ['zhi'], once: true },
        ],
        encounterRate: 0.015,
        pool: ['zhi', 'xuangui', 'huanshu'],
        bgTex: 'battle/field',
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

    static all: MapDef[] = [MapsData.home, MapsData.qingqiu, MapsData.wild, MapsData.cave];

    private static map = new Map<string, MapDef>(MapsData.all.map(m => [m.id, m]));

    static get(id: string): MapDef {
        return this.map.get(id)!;
    }
}
