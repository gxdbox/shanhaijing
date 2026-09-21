import { WeaponDef } from '../core/GameData';

/**
 * 武器表 —— DQ 式装备系统（参考勇者斗恶龙）
 * 武器决定基础攻击加成，购买后永久装备（存 weaponId）
 */
export class WeaponsData {
    static list: WeaponDef[] = [
        {
            id: 'wooden_sword',
            name: '木剑',
            desc: '村口木匠削的练习剑,聊胜于无。',
            atkBonus: 0,
            price: 0,
        },
        {
            id: 'bronze_sword',
            name: '青铜剑',
            desc: '青丘铁匠铺的入门货,锋利尚可。',
            atkBonus: 4,
            price: 80,
        },
        {
            id: 'iron_sword',
            name: '铁剑',
            desc: '淬火精铁打造,斩妖除魔的好伙伴。',
            atkBonus: 10,
            price: 220,
        },
        {
            id: 'jade_sword',
            name: '玉剑',
            desc: '以青丘美玉磨砺而成,隐隐透出灵光。',
            atkBonus: 18,
            price: 500,
        },
        {
            id: 'ganjiang_sword',
            name: '干将剑',
            desc: '上古名剑传说,剑身赤红如血,斩兽如切纸。',
            atkBonus: 30,
            price: 1200,
        },
    ];

    private static map = new Map<string, WeaponDef>(
        WeaponsData.list.map(w => [w.id, w])
    );

    static get(id: string): WeaponDef {
        return this.map.get(id) ?? WeaponsData.list[0];
    }
}
