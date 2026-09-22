import { QuestDef } from '../core/GameData';

/**
 * 任务表 —— 主线/支线/悬赏（参考DQ式任务日志）
 * 完成条件: 检查对应 flag(战斗胜利/剧情flag已由系统设置)
 */
export class QuestsData {
    static list: QuestDef[] = [
        // ===== 主线(南山经→西山经→天山) =====
        {
            id: 'q1_elder_errand',
            title: '初入山海',
            desc: '长老说村外野地有异兽作乱,去青丘之野探查一番。',
            type: 'main',
            target: '前往青丘之野(村北出口)',
            clearFlag: 'met_jiuwei',
            rewardGold: 30, rewardExp: 40,
            next: 'q2_jiuwei',
        },
        {
            id: 'q2_jiuwei',
            title: '九尾狐的求助',
            desc: '青丘之野的九尾狐受伤了,她说穷奇夺走了她一尾之灵,需要你的帮助。',
            type: 'main',
            target: '与九尾狐对话,击退来袭的彘',
            clearFlag: 'jiuwei_joined',
            rewardGold: 60, rewardExp: 80,
            next: 'q3_qiongqi',
        },
        {
            id: 'q3_qiongqi',
            title: '雾隐洞之主',
            desc: '雾隐洞深处的穷奇吞食万象,击败它,取回九尾狐的尾灵!',
            type: 'main',
            target: '前往雾隐洞击败穷奇',
            clearFlag: 'qiongqi_down',
            rewardGold: 200, rewardExp: 260,
            next: 'q4_zhaoyao',
        },
        {
            id: 'q4_zhaoyao',
            title: '招摇之山的异兽',
            desc: '长老说招摇之山出现了未曾见过的异兽,去收服狌狌、弄清真相。',
            type: 'main',
            target: '前往招摇之山,遇见狌狌',
            clearFlag: 'xingxing_joined',
            rewardGold: 100, rewardExp: 150,
            next: 'q5_tianshan',
        },
        {
            id: 'q5_tianshan',
            title: '天山的混沌',
            desc: '天山之巅,无面无目的帝江在雾中起舞。击败他,领悟混沌的真意。',
            type: 'main',
            target: '前往天山,挑战帝江',
            clearFlag: 'dijiang_down',
            rewardGold: 300, rewardExp: 400,
        },
        // ===== 支线 =====
        {
            id: 's1_jingwei',
            title: '精卫的心愿',
            desc: '招摇之山的精卫衔着石子,向东海飞去。去听听她的故事。',
            type: 'side',
            target: '在招摇之山找到精卫并对话',
            clearFlag: 'met_jingwei',
            rewardGold: 50, rewardExp: 30,
        },
        {
            id: 's2_guanguan',
            title: '青丘双灵',
            desc: '长老说:九尾狐食之辟蛊,灌灌之羽佩之不惑。去收服青丘的灌灌。',
            type: 'side',
            target: '在青丘之野收服灌灌',
            clearFlag: 'guanguan_joined',
            rewardGold: 80, rewardExp: 60,
        },
        // ===== 悬赏 =====
        {
            id: 'b1_zhi_hunt',
            title: '悬赏:除彘',
            desc: '村外彘群为患,猎杀彘(可在青丘之野遇敌)为民除害。',
            type: 'bounty',
            target: '击败3只彘',
            clearFlag: 'bounty_zhi_done',
            rewardGold: 90, rewardExp: 50,
        },
    ];

    private static map = new Map<string, QuestDef>(
        QuestsData.list.map(q => [q.id, q])
    );

    static get(id: string): QuestDef | null {
        return this.map.get(id) ?? null;
    }
}