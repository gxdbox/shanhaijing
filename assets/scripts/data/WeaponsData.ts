import { WeaponDef } from '../core/GameData';

/**
 * 武器表 —— DQ 式装备系统（参考勇者斗恶龙）
 * 武器决定基础攻击加成，购买后永久装备（存 weaponId）
 * 五行: 金克木 木克土 土克水 水克火 火克金
 */
export class WeaponsData {
    static list: WeaponDef[] = [
        {
            id: 'wooden_sword',
            name: '木剑',
            desc: '村口木匠削的练习剑,聊胜于无。',
            atkBonus: 0,
            price: 0,
            element: '木',
        },
        {
            id: 'bronze_sword',
            name: '青铜剑',
            desc: '青丘铁匠铺的入门货,锋利尚可。',
            atkBonus: 4,
            price: 80,
            element: '金',
        },
        {
            id: 'fire_sword',
            name: '赤炎剑',
            desc: '淬火精铁以兽血淬炼,剑身赤红。',
            atkBonus: 8,
            price: 180,
            element: '火',
        },
        {
            id: 'iron_sword',
            name: '玄铁重剑',
            desc: '淬火精铁打造,沉重而锋利。',
            atkBonus: 12,
            price: 260,
            element: '金',
        },
        {
            id: 'jade_sword',
            name: '青玉剑',
            desc: '以青丘美玉磨砺而成,隐隐透出灵光。',
            atkBonus: 18,
            price: 500,
            element: '木',
        },
        {
            id: 'water_sword',
            name: '碧水剑',
            desc: '取自东海寒流锻造,剑身如水流动。',
            atkBonus: 24,
            price: 800,
            element: '水',
        },
        {
            id: 'ganjiang_sword',
            name: '干将剑',
            desc: '上古名剑传说,剑身赤红如血,斩兽如切纸。',
            atkBonus: 30,
            price: 1200,
            element: '火',
        },
    ];

    private static map = new Map<string, WeaponDef>(
        WeaponsData.list.map(w => [w.id, w])
    );

    static get(id: string): WeaponDef {
        return this.map.get(id) ?? WeaponsData.list[0];
    }
}
