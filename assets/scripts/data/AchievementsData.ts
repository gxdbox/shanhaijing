import { AchievementDef } from '../core/GameData';

/**
 * 成就表 —— 收集/战斗/通关类成就（成就=玩家留下的里程碑记录）
 * 完成条件:检查 flag 即可(由 GameManager 在事件点触发检测)
 */
export class AchievementsData {
    static list: AchievementDef[] = [
        // ===== 图鉴收集 =====
        { id: 'ach_dex5', name: '初窥山海', desc: '收录 5 只异兽。', type: 'dex', target: 5, rewardGold: 50 },
        { id: 'ach_dex10', name: '山海行者', desc: '收录 10 只异兽。', type: 'dex', target: 10, rewardGold: 120 },
        { id: 'ach_dex20', name: '山海博闻家', desc: '收录 20 只异兽。', type: 'dex', target: 20, rewardGold: 300 },
        // ===== 战斗 =====
        { id: 'ach_kill50', name: '斩兽五十', desc: '累计击败 50 只异兽。', type: 'kill', target: 50, rewardGold: 100 },
        { id: 'ach_boss', name: '降服四凶', desc: '击败四凶合体,终结混沌。', type: 'boss', target: 1, rewardGold: 500 },
        // ===== 经济 =====
        { id: 'ach_gold500', name: '家底殷实', desc: '持有 500 金币。', type: 'gold', target: 500, rewardGold: 50 },
        // ===== 羁绊/进化 =====
        { id: 'ach_evolve', name: '灵兽之约', desc: '让一只异兽完成进化。', type: 'evolve', target: 1, rewardGold: 200 },
        // ===== 通关 =====
        { id: 'ach_clear', name: '山海归宁', desc: '通关主线,四凶合体被封印。', type: 'clear', target: 1, rewardGold: 1000 },
    ];

    private static map = new Map<string, AchievementDef>(
        AchievementsData.list.map(a => [a.id, a])
    );

    static get(id: string): AchievementDef | null {
        return this.map.get(id) ?? null;
    }
}