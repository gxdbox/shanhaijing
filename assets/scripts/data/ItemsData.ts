import { ItemDef } from '../core/GameData';

/**
 * 物品表 —— 素材掉落 + 炼金材料（重装机兵式"打怪→素材→合成"循环）
 */
export class ItemsData {
    static list: ItemDef[] = [
        // ===== 素材(打怪掉落) =====
        { id: 'beast_pelt', name: '兽皮', desc: '异兽的皮毛,可出售或炼药。', type: 'material', price: 15 },
        { id: 'beast_horn', name: '兽角', desc: '异兽的利角,可出售或炼药。', type: 'material', price: 25 },
        { id: 'beast_scale', name: '鳞片', desc: '异兽的鳞片,可出售或炼药。', type: 'material', price: 35 },
        { id: 'beast_bone', name: '兽骨', desc: '异兽的骨骼,可出售或炼药。', type: 'material', price: 45 },

        // ===== 丹药(炼金合成) =====
        { id: 'herb_pill', name: '回春丹', desc: '服用后回复100点生命。', type: 'potion', healHp: 100 },
        { id: 'spirit_pill', name: '回灵丹', desc: '服用后回复60点灵力。', type: 'potion', healMp: 60 },
        { id: 'revive_pill', name: '续命丹', desc: '战斗中服用可救回倒下同伴。', type: 'potion', healHp: 1 },
    ];

    // 炼金配方: 素材组合 → 丹药
    static readonly recipes: { id: string; name: string; out: string; need: [string, number][] }[] = [
        { id: 'rc_herb', name: '炼回春丹', out: 'herb_pill', need: [['beast_pelt', 2]] },
        { id: 'rc_spirit', name: '炼回灵丹', out: 'spirit_pill', need: [['beast_horn', 2]] },
        { id: 'rc_revive', name: '炼续命丹', out: 'revive_pill', need: [['beast_scale', 2], ['beast_bone', 1]] },
    ];

    private static map = new Map<string, ItemDef>(
        ItemsData.list.map(i => [i.id, i])
    );

    static get(id: string): ItemDef | null {
        return this.map.get(id) ?? null;
    }
}