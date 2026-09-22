import { FishDef } from '../core/GameData';

/**
 * 钓鱼表 —— 休闲副玩法(参考动森/星露谷式渔获随机)
 * 水域钓鱼:随机渔获,稀有鱼有惊喜(盼头)
 */
export class FishData {
    static list: FishDef[] = [
        { id: 'fish_small', name: '小鱼', desc: '一尾小银鱼,聊胜于无。', price: 10, weight: 50 },
        { id: 'fish_carp', name: '锦鲤', desc: '斑斓锦鲤,转卖好价钱。', price: 30, weight: 25 },
        { id: 'fish_crab', name: '溪蟹', desc: '张牙舞爪的溪蟹。', price: 20, weight: 12 },
        { id: 'fish_rare', name: '文鳐幼鱼', desc: '长着小翅膀的幼鱼!稀有!', price: 120, weight: 8 },
        { id: 'fish_pearl', name: '夜明珠', desc: '蚌中之宝,光芒温润。', price: 300, weight: 4 },
        { id: 'fish_trash', name: '水草', desc: '一团水草…', price: 2, weight: 30 },
    ];

    private static total = FishData.list.reduce((s, f) => s + f.weight, 0);

    /** 按权重随机渔获 */
    static randomFish(): FishDef {
        let r = Math.random() * this.total;
        for (const f of this.list) {
            r -= f.weight;
            if (r <= 0) return f;
        }
        return this.list[0];
    }
}