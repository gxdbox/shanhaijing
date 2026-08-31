import { DialogueNode } from '../core/GameData';
import { GameManager } from '../core/GameManager';

/**
 * 剧情数据:NPC 入口按 flag 条件选择对话节点;节点指令驱动流程
 */
export class DialogueData {
    static nodes: Record<string, DialogueNode> = {
        // ============ 开场(无存档自动触发) ============
        home_intro: {
            id: 'home_intro',
            lines: [
                { speaker: '', text: '东海之外,有山曰青丘。山下小村,少年阿玄夜夜梦见万水千山之间的奇异生灵。' },
                { speaker: '', text: '这一日,天色将晓——' },
                { speaker: '母亲', text: '阿玄,又做噩梦了?你满头是汗。' },
                { speaker: '阿玄', text: '娘……我梦见一头九条尾巴的狐狸,浑身是火,一直望着我。' },
                { speaker: '母亲', text: '又是那些古怪的梦。长老说过,你是被《山海经》选中的人。' },
                { speaker: '母亲', text: '昨夜祠堂的烛火无风自动,村外彘群也闹了一宿。快去找长老吧。' },
            ],
            actions: ['setFlag:intro_done', 'save'],
        },

        // ============ 母亲 ============
        mother_go: {
            id: 'mother_go',
            lines: [
                { speaker: '母亲', text: '别磨蹭啦,快去祠堂见长老。' },
            ],
        },
        mother_hurry: {
            id: 'mother_hurry',
            lines: [
                { speaker: '母亲', text: '长老把书交给你了?那便去吧。记住——书在,人在。' },
            ],
        },
        mother_wish: {
            id: 'mother_wish',
            lines: [
                { speaker: '母亲', text: '和狐狸一起,要平安回来呀。' },
            ],
        },
        mother_proud: {
            id: 'mother_proud',
            lines: [
                { speaker: '母亲', text: '连穷奇都败在你手下……娘以你为傲。' },
            ],
        },

        // ============ 爷爷 ============
        grandpa_tip: {
            id: 'grandpa_tip',
            lines: [
                { speaker: '爷爷', text: '祠堂的烛火昨夜又自己亮了。长老在等你呢,孩子。' },
            ],
        },
        grandpa_jiuwei: {
            id: 'grandpa_jiuwei',
            lines: [
                { speaker: '爷爷', text: '北边山口有只白狐狸,九条尾巴的,我年轻时见过。' },
                { speaker: '爷爷', text: '听猎户说它快不行了。《山海经》在手,兴许能救它。' },
            ],
        },
        grandpa_next: {
            id: 'grandpa_next',
            lines: [
                { speaker: '爷爷', text: '雾隐洞深处住着穷奇,能吞天噬日。' },
                { speaker: '爷爷', text: '要去,得先练壮实些。洞里的应龙也是不好惹的主。' },
            ],
        },
        grandpa_clear: {
            id: 'grandpa_clear',
            lines: [
                { speaker: '爷爷', text: '好好好!老头子活了一辈子,头回见着书上写的活物。' },
            ],
        },

        // ============ 长老 ============
        elder_give: {
            id: 'elder_give',
            lines: [
                { speaker: '长老', text: '阿玄,你近了。看,烛火在摇。' },
                { speaker: '长老', text: '这本《山海经》,我族守护了三百余年。昨夜它无风自动,翻停在「青丘之山」。' },
                { speaker: '长老', text: '青丘之山有兽焉,其状如狐而九尾……它快死了。而这书,认定了你。' },
                { speaker: '阿玄', text: '我?长老,我只是个会做怪梦的毛头小子。' },
                { speaker: '长老', text: '梦,就是书在唤你。带上它吧——危难之时,它自会助你。' },
                { speaker: '长老', text: '村外彘群横行。先向北,去山野寻那九尾狐。' },
            ],
            actions: ['setFlag:got_book', 'learnSkill:huofu', 'learnSkill:huichun', 'heal', 'save'],
        },
        elder_remind: {
            id: 'elder_remind',
            lines: [
                { speaker: '长老', text: '去吧,去北边的山野。九尾狐还在等你。' },
            ],
        },
        elder_done: {
            id: 'elder_done',
            lines: [
                { speaker: '长老', text: '你做到了。穷奇伏诛,九尾归队……' },
                { speaker: '长老', text: '三百年的等待,今日有了结果。孩子,这《山海经》从此由你执掌。' },
                { speaker: '', text: '《山海经》光芒大盛——图鉴自行翻开,万兽齐鸣。' },
                { speaker: '', text: '★ 本 demo 已通关!更广阔的西荒、南岭、海外诸国,敬请期待。 ★' },
            ],
            actions: ['setFlag:game_clear', 'heal', 'save'],
        },
        elder_clear: {
            id: 'elder_clear',
            lines: [
                { speaker: '长老', text: '新世界的大门已经打开。青丘之民,永世铭记你的名字。' },
            ],
        },

        // ============ 九尾狐 ============
        jiuwei_keep: {
            id: 'jiuwei_keep',
            lines: [
                { speaker: '九尾狐', text: '(低鸣)……人类,别过来。我的狐火会烧伤你。' },
            ],
        },
        jiuwei_meet: {
            id: 'jiuwei_meet',
            lines: [
                { speaker: '九尾狐', text: '(蜷在树下,声音如婴儿啼哭)……是谁?' },
                { speaker: '阿玄', text: '你受伤了!这血……' },
                { speaker: '九尾狐', text: '是穷奇。他夺走了我的一尾之灵,封进了雾隐洞。' },
                { speaker: '阿玄', text: '别动,我带你回村疗伤!' },
                { speaker: '九尾狐', text: '没用的。失去一尾,便活不过今日月升。' },
                { speaker: '', text: '草叶沙沙作响——两头彘循着血腥气,围了上来!' },
            ],
            actions: ['setFlag:met_jiuwei', 'battle:zhi,zhi'],
            next: 'jiuwei_saved',
        },
        jiuwei_saved: {
            id: 'jiuwei_saved',
            lines: [
                { speaker: '九尾狐', text: '你怀里的……书。原来它选了你。' },
                { speaker: '阿玄', text: '《山海经》上说,与你结契,你就能活。' },
                { speaker: '九尾狐', text: '结契……便是一生同行。人类,你愿意带上我吗?' },
            ],
            choices: [
                { text: '从今往后,同生共死!', next: 'jiuwei_join' },
                { text: '救命要紧,别管那么多!', next: 'jiuwei_join' },
            ],
        },
        jiuwei_join: {
            id: 'jiuwei_join',
            lines: [
                { speaker: '九尾狐', text: '好。从今日起,青丘山上,雾隐洞中——风雨同行。' },
                { speaker: '', text: '结契之光没入《山海经》,「九尾狐」一页骤然点亮!' },
                { speaker: '', text: '☆ 九尾狐 加入了队伍! ☆' },
            ],
            actions: ['setFlag:jiuwei_joined', 'getBeast:jiuwei', 'heal', 'save'],
        },
        jiuwei_again: {
            id: 'jiuwei_again',
            lines: [
                { speaker: '九尾狐', text: '你回来了……还愿意和我结契吗?' },
            ],
            choices: [
                { text: '愿意。', next: 'jiuwei_join' },
                { text: '……让我再想想。', next: '' },
            ],
        },
        jiuwei_talk: {
            id: 'jiuwei_talk',
            lines: [
                { speaker: '九尾狐', text: '穷奇就在雾隐洞最深处,洞口在野地北边。' },
                { speaker: '九尾狐', text: '他很强,还会「吞日」。先去把洞里的应龙领教了吧,契约者。' },
            ],
        },
    };

    /**
     * NPC 对话入口:[条件flag, 节点] 依次匹配,最后一个为兜底
     */
    static npcEntries: Record<string, { cond?: string; node: string }[]> = {
        mother: [
            { cond: 'game_clear', node: 'mother_proud' },
            { cond: 'jiuwei_joined', node: 'mother_wish' },
            { cond: 'got_book', node: 'mother_hurry' },
            { cond: 'intro_done', node: 'mother_go' },
            { node: 'mother_go' },
        ],
        grandpa: [
            { cond: 'game_clear', node: 'grandpa_clear' },
            { cond: 'jiuwei_joined', node: 'grandpa_next' },
            { cond: 'got_book', node: 'grandpa_jiuwei' },
            { node: 'grandpa_tip' },
        ],
        elder: [
            { cond: 'game_clear', node: 'elder_clear' },
            { cond: 'qiongqi_down', node: 'elder_done' },
            { cond: 'got_book', node: 'elder_remind' },
            { node: 'elder_give' },
        ],
        jiuwei_npc: [
            { cond: 'jiuwei_joined', node: 'jiuwei_talk' },
            { cond: 'met_jiuwei', node: 'jiuwei_again' },
            { cond: 'got_book', node: 'jiuwei_meet' },
            { node: 'jiuwei_keep' },
        ],
    };

    static getNpcEntry(npcId: string): string {
        const entries = this.npcEntries[npcId];
        if (!entries) return 'mother_go';
        const gm = GameManager.inst;
        for (const e of entries) {
            if (e.cond === undefined) return e.node;
            if (gm.hasFlag(e.cond)) return e.node;
        }
        return entries[entries.length - 1].node;
    }

    static get(id: string): DialogueNode {
        return this.nodes[id];
    }
}