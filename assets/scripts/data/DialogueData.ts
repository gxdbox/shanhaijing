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

        // ============ 第2期 招摇之山・天山剧情（日报开发）============
        xingxing_talk: {
            id: 'xingxing_talk',
            lines: [
                { speaker: '', text: '一只白耳灵猿挂在桂树枝头,直勾勾望着你,忽然开口——' },
                { speaker: '狌狌', text: '你……你刚才路过西边的两棵树,踩断了一根枯枝。' },
                { speaker: '阿玄', text: '你怎么知道?!' },
                { speaker: '狌狌', text: '我生而能知过去,却不知将来。你走过的每一步,我都看得见。' },
                { speaker: '狌狌', text: '《山海经》说,食我者善走。你若收我,从此山海再远——一步即至。' },
            ],
            choices: [
                { text: '结契!', next: 'xingxing_join' },
            ],
        },
        xingxing_join: {
            id: 'xingxing_join',
            lines: [
                { speaker: '狌狌', text: '嘿嘿,走咯!' },
                { speaker: '', text: '☆ 狌狌 加入了队伍! ☆' },
            ],
            actions: ['setFlag:xingxing_joined', 'getBeast:xingxing', 'save'],
        },

        jingwei_meet: {
            id: 'jingwei_meet',
            lines: [
                { speaker: '', text: '一只白喙赤足的小鸟衔着树枝,落在你肩头。' },
                { speaker: '精卫', text: '……你也见过那片海吗?' },
                { speaker: '阿玄', text: '你是……?' },
                { speaker: '精卫', text: '我名女娃,炎帝之女。溺于东海,化为此鸟。' },
                { speaker: '精卫', text: '人们叫我誓鸟、冤禽、志鸟……叫什么也罢。只要我还在飞,海就一天填不完。' },
                { speaker: '阿玄', text: '你恨那片海吗?' },
                { speaker: '精卫', text: '恨。可恨意不足以填海。' },
                { speaker: '', text: '她衔起石子,头也不回地朝东海的方向飞去。' },
            ],
            actions: ['setFlag:met_jingwei', 'save'],
        },

        dijiang_before: {
            id: 'dijiang_before',
            lines: [
                { speaker: '', text: '天山顶上,一团赤红的"黄囊"在雾中起舞,六足四翼,没有面目。' },
                { speaker: '帝江', text: '(歌舞之声)……又一个想替我开窍的人吗?' },
                { speaker: '阿玄', text: '开窍?' },
                { speaker: '帝江', text: '很久以前,也有两位好友,待我极好。他们说——"无窍,便享不了声色之乐"。一日凿一窍,七日,我死了。' },
                { speaker: '帝江', text: '死后我归来,明白了:他们凿开的不是窍,是欲望。如今我无面无目,反而看得比谁都清。' },
                { speaker: '帝江', text: '你若要收我,便先证明——你能听懂这舞!' },
            ],
            actions: ['battle:dijiang'],
        },

        // ============ 第3期 青丘双灵・南岭西荒（日报开发）============
        guanguan_meet: {
            id: 'guanguan_meet',
            lines: [
                { speaker: '', text: '一只青灰色的肥鸟扑棱着翅膀落在枝头,头顶羽毛炸起,冲你大声呵斥——' },
                { speaker: '灌灌', text: '呵!呵!——(吵吵嚷嚷,像是在骂人)' },
                { speaker: '阿玄', text: '这是……灌灌?《山海经》说,佩其羽者不惑。' },
                { speaker: '灌灌', text: '呵!(点头,得意地抖了抖青羽)' },
                { speaker: '阿玄', text: '九尾狐被穷奇所惑,正缺你这样的清心羽。你愿意助我么?' },
                { speaker: '灌灌', text: '呵!(跳到阿玄肩头,蹭了蹭)' },
                { speaker: '', text: '☆ 灌灌 加入了队伍! ☆' },
            ],
            actions: ['setFlag:guanguan_joined', 'getBeast:guanguan', 'heal', 'save'],
        },
        guanguan_talk: {
            id: 'guanguan_talk',
            lines: [
                { speaker: '灌灌', text: '呵!呵!(扑棱着翅膀,昂首挺胸——仿佛在说:跟着我,不会错)' },
                { speaker: '阿玄', text: '哈哈,好好好,知道你厉害了。走,我们去帮九尾狐! ' },
            ],
        },
        elder_shuangling: {
            id: 'elder_shuangling',
            lines: [
                { speaker: '长老', text: '阿玄,你可知道——青丘之山,一兽一鸟,同守千年。' },
                { speaker: '阿玄', text: '是九尾狐……和那只总像在骂人的青鸟?' },
                { speaker: '长老', text: '九尾狐食之可辟蛊,灌灌之羽佩之不惑。蛊与惑,正是穷奇最得意的两门手段。' },
                { speaker: '阿玄', text: '所以穷奇才先夺九尾一尾,又封了灌灌的羽!' },
                { speaker: '长老', text: '去吧。取回灌灌之羽,九尾狐便再不会被穷奇的邪音所惑。' },
            ],
            actions: ['setFlag:met_shuangling', 'save'],
        },
        gudiao_meet: {
            id: 'gudiao_meet',
            lines: [
                { speaker: '', text: '泽更水边,忽然传来一阵婴儿啼哭,凄厉渗人——' },
                { speaker: '阿玄', text: '这哭声……不对劲。' },
                { speaker: '蛊雕', text: '(破水而出)呜哇——呜哇——' },
                { speaker: '阿玄', text: '果然是蛊雕!《山海经》说它"其音如婴儿之音,是食人"!' },
                { speaker: '蛊雕', text: '(露出白骨双角,血目圆睁,扑了过来)' },
            ],
            actions: ['battle:gudiao'],
        },
        bo_meet: {
            id: 'bo_meet',
            lines: [
                { speaker: '', text: '山道尽头,一匹白马黑尾的独角灵兽傲然而立,虎爪踏地,鸣声如鼓——' },
                { speaker: '阿玄', text: '驳!《山海经》说它食虎豹,可以御兵!' },
                { speaker: '驳', text: '(鼓声般低鸣)……' },
                { speaker: '阿玄', text: '它脚下……是刚被它撕碎的虎豹残骸。它在守这条路。' },
                { speaker: '阿玄', text: '要过去,就得先过它这一关!' },
            ],
            actions: ['battle:bo'],
        },

        // ============ DQ式设施：武器店/旅店/驿站（阶段1）============
        shopkeeper_talk: {
            id: 'shopkeeper_talk',
            lines: [
                { speaker: '铁匠', text: '欢迎光临!青丘铁匠铺,好武器助你闯荡山海!看看货?要买现在就买,不买就去别家——(!)' },
            ],
            choices: [
                { text: '买青铜剑(80金,攻+4)', next: 'shop_bronze' },
                { text: '买铁剑(220金,攻+10)', next: 'shop_iron' },
                { text: '买玉剑(500金,攻+18)', next: 'shop_jade' },
                { text: '买干将剑(1200金,攻+30)', next: 'shop_ganjiang' },
                { text: '看看而已', next: '' },
            ],
        },
        shop_bronze: {
            id: 'shop_bronze',
            lines: [
                { speaker: '铁匠', text: '青铜剑,锋利尚可,保你砍彘不费劲!' },
            ],
            actions: ['buyWeapon:bronze_sword'],
            next: 'shopkeeper_talk',
        },
        shop_iron: {
            id: 'shop_iron',
            lines: [
                { speaker: '铁匠', text: '淬火铁剑,斩妖除魔的好伙伴!' },
            ],
            actions: ['buyWeapon:iron_sword'],
            next: 'shopkeeper_talk',
        },
        shop_jade: {
            id: 'shop_jade',
            lines: [
                { speaker: '铁匠', text: '好眼力!青丘美玉磨的剑,透灵光!' },
            ],
            actions: ['buyWeapon:jade_sword'],
            next: 'shopkeeper_talk',
        },
        shop_ganjiang: {
            id: 'shop_ganjiang',
            lines: [
                { speaker: '铁匠', text: '……这把干将剑可是镇店之宝,你可得想清楚!' },
            ],
            actions: ['buyWeapon:ganjiang_sword'],
            next: 'shopkeeper_talk',
        },

        innkeeper_talk: {
            id: 'innkeeper_talk',
            lines: [
                { speaker: '旅店老板', text: '远道而来辛苦了!小店歇脚,20 金币一晚,包你睡到日上三竿,体力全满!' },
            ],
            choices: [
                { text: '住一晚(20金,全队回满)', next: 'inn_sleep' },
                { text: '喂食随行异兽(30金,羁绊+3)', next: 'inn_feed' },
                { text: '先不了', next: '' },
            ],
        },
        inn_feed: {
            id: 'inn_feed',
            lines: [
                { speaker: '旅店老板', text: '好嘞!客官随行的灵兽也喂些好吃的——' },
            ],
            actions: ['feedBeast:30'],
            next: 'innkeeper_talk',
        },
        inn_sleep: {
            id: 'inn_sleep',
            lines: [
                { speaker: '旅店老板', text: '好嘞!客官里边请——(次日清晨)睡得真香!' },
            ],
            actions: ['restInn:20'],
            next: 'innkeeper_talk',
        },

        waypoint_talk: {
            id: 'waypoint_talk',
            lines: [
                { speaker: '驿丞', text: '山海驿道,通达四方。客官要去哪儿?(去过的地界随你挑)' },
            ],
            choices: [
                { text: '青丘村(家)', next: 'wp_qingqiu' },
                { text: '青丘之野', next: 'wp_wild' },
                { text: '招摇之山', next: 'wp_zhaoyao' },
                { text: '天山', next: 'wp_tianshan' },
                { text: '雾隐洞', next: 'wp_cave' },
                { text: '暂不出发', next: '' },
            ],
        },
        wp_qingqiu: { id: 'wp_qingqiu', lines: [], actions: ['teleportTo:qingqiu'], next: '' },
        wp_wild: { id: 'wp_wild', lines: [], actions: ['teleportTo:wild'], next: '' },
        wp_zhaoyao: { id: 'wp_zhaoyao', lines: [], actions: ['teleportTo:zhaoyao'], next: '' },
        wp_tianshan: { id: 'wp_tianshan', lines: [], actions: ['teleportTo:tianshan'], next: '' },
        wp_cave: { id: 'wp_cave', lines: [], actions: ['teleportTo:cave'], next: '' },
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
            { cond: 'met_shuangling', node: 'elder_remind' },
            { cond: 'got_book', node: 'elder_shuangling' },
            { node: 'elder_give' },
        ],
        jiuwei_npc: [
            { cond: 'jiuwei_joined', node: 'jiuwei_talk' },
            { cond: 'met_jiuwei', node: 'jiuwei_again' },
            { cond: 'got_book', node: 'jiuwei_meet' },
            { node: 'jiuwei_keep' },
        ],
        guanguan: [
            { cond: 'guanguan_joined', node: 'guanguan_talk' },
            { node: 'guanguan_meet' },
        ],
        shopkeeper: [
            { node: 'shopkeeper_talk' },
        ],
        innkeeper: [
            { node: 'innkeeper_talk' },
        ],
        waypoint: [
            { node: 'waypoint_talk' },
        ],
    };

    static getNpcEntry(npcId: string): string {
        const entries = this.npcEntries[npcId];
        if (!entries) {
            // 兼容新式写法:dialogue 字段直接给节点名(xingxing_talk 等)
            if (this.nodes[npcId]) return npcId;
            console.warn('[DialogueData] 找不到对话入口:', npcId);
            return '';
        }
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