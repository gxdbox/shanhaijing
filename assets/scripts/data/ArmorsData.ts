import { ArmorDef } from '../core/GameData';

/**
 * 防具表 —— DQ式装备(防御成长)
 * 购买后永久装备(存 armorId),战斗防御加成
 */
export class ArmorsData {
    static list: ArmorDef[] = [
        { id: 'cloth_armor', name: '粗布衣', desc: '青丘村妇缝制的粗布衣裳,聊胜于无。', defBonus: 0, price: 0 },
        { id: 'leather_armor', name: '皮甲', desc: '以野兽皮革鞣制,轻便而坚韧。', defBonus: 3, price: 100 },
        { id: 'scale_armor', name: '鳞甲', desc: '缀满旋龟鳞片的战甲,防御大增。', defBonus: 6, price: 220 },
        { id: 'iron_armor', name: '玄铁甲', desc: '玄铁打造的厚重战甲,刀枪难入。', defBonus: 10, price: 450 },
        { id: 'jade_armor', name: '玉鳞甲', desc: '以青玉与异兽鳞片编织,灵气护体。', defBonus: 15, price: 800 },
        { id: 'dragon_armor', name: '龙鳞甲', desc: '传说以应龙之鳞锻造的绝世宝甲。', defBonus: 22, price: 1500 },
    ];

    private static map = new Map<string, ArmorDef>(
        ArmorsData.list.map(a => [a.id, a])
    );

    static get(id: string): ArmorDef {
        return this.map.get(id) ?? ArmorsData.list[0];
    }
}