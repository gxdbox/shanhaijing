import { _decorator, Color, Component, Graphics, input, Input, EventKeyboard, KeyCode, Label, Node, resources, Sprite, SpriteFrame, tween, UITransform, UIOpacity, Vec3 } from 'cc';
import { ActorStats, FixedEncounterDef, SkillDef } from '../core/GameData';
import { BeastsData } from '../data/BeastsData';
import { SkillsData } from '../data/SkillsData';
import { GameManager, GameState } from '../core/GameManager';
import { EventBus, GEvent } from '../core/EventBus';
import { UIFactory } from '../ui/UIFactory';
import { PixelBeasts, BattleBgRenderer } from '../render/PixelBeasts';

const { ccclass } = _decorator;

/** 回合中的一条行动 */
interface PendingAction {
    actor: ActorStats;
    isEnemy: boolean;
    skill: SkillDef | null;
    targets: ActorStats[];
    text: string;
}

type Phase = 'off' | 'intro' | 'menu' | 'skillMenu' | 'target' | 'action' | 'victory' | 'defeat';

/**
 * 第一人称回合制战斗(DQ 式)
 * 敌人立绘在上,指令菜单在下;回合内按速度排序依次行动
 */
@ccclass('BattleManager')
export class BattleManager extends Component {
    static inst: BattleManager;

    phase: Phase = 'off';
    enemies: ActorStats[] = [];
    private party: ActorStats[] = [];
    private actions: PendingAction[] = [];
    private curActorIdx = 0;
    private cmdIdx = 0;
    private skillIdx = 0;
    private targetIdx = 0;
    private pendingSkill: SkillDef | null = null;
    private encounter: FixedEncounterDef | null = null;
    private bgTex = '';
    private pendingActions: PendingAction[] = [];

    // UI
    private uiRoot: Node;
    private enemyNodes: { node: Node; sprite: Sprite; hpBar: Graphics; nameLabel: Label }[] = [];
    private partyNodes: { node: Node; hpBar: Graphics; nameLabel: Label }[] = [];
    private panel: Node;
    private msgLabel: Label;
    private cmdButtons: Node[] = [];
    private skillButtons: Node[] = [];
    private targetBtns: Node[] = [];
    private partyLabel: Label;

    init(uiRoot: Node): void {
        this.uiRoot = uiRoot;
        this.node.layer = uiRoot.layer;
        this.node.addComponent(UITransform).setContentSize(960, 600);
        this.node.active = false;
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    get active(): boolean { return this.node.active; }

    // ==================== 开始与结束 ====================

    startBattle(beastIds: string[], bgTex: string, encounter: FixedEncounterDef | null = null): void {
        const gm = GameManager.inst;
        gm.setState(GameState.BATTLE);
        try {
            this.encounter = encounter;
            this.bgTex = bgTex;
            this.enemies = beastIds.map(id => BeastsData.toActor(BeastsData.get(id)));
            this.party = gm.getParty();
            this.pendingActions = [];
            this.curActorIdx = 0;
            this.cmdIdx = 0;
            this.skillIdx = 0;
            this.targetIdx = 0;
            this.pendingSkill = null;
            this.buildUI();
            this.node.active = true;
            this.phase = 'intro';
            const main = this.enemies[0];
            const mainDef = main && main.beastId ? BeastsData.get(main.beastId) : null;
            const tab = (mainDef && mainDef.boss) ? 'BOSS ' : '';
            this.setMsg(`${tab}${this.enemies.map(e => e.name).join('与')} 出现了!\n`);
        } catch (e) {
            // 战斗初始化异常:回滚到探索态,避免"状态在战斗但画面无战斗"的硬卡死
            console.error('[BattleManager] 战斗初始化失败,已回滚到探索状态', e);
            this.phase = 'off';
            this.node.active = false;
            this.clearUI();
            gm.setState(GameState.EXPLORE);
        }
    }

    private endBattle(win: boolean): void {
        this.phase = 'off';
        this.node.active = false;
        this.clearUI();
        const gm = GameManager.inst;
        // 先恢复探索状态再存档/广播:存档异常不会把玩家永久卡在 BATTLE 态
        gm.setState(GameState.EXPLORE);
        try {
            if (win) {
                if (this.encounter?.winFlag) gm.addFlag(this.encounter.winFlag);
                // 固定遇敌:胜利后才写入"已触发"标记 → 战败可重战,BOSS 不会消失
                if (this.encounter?.once) {
                    const mapId = gm.curMapId;
                    gm.addFlag(`enc!${mapId}_${this.encounter.x}_${this.encounter.y}`);
                }
            }
            gm.save();
        } catch (e) {
            console.error('[BattleManager] 战后存档失败(不影响继续游戏)', e);
        }
        EventBus.emit(GEvent.BATTLE_END, { win });
        EventBus.emit('battle:ended', { win, encounter: this.encounter });
    }

    // ==================== UI 构建 ====================

    private buildUI(): void {
        this.clearUI();

        // 背景:先程序化绘制,加载贴图成功则替换
        const bgNode = new Node('bg');
        bgNode.layer = this.node.layer;
        bgNode.addComponent(UITransform).setContentSize(960, 600);
        this.node.addChild(bgNode);
        const pixelBg = bgNode.addComponent(Graphics);
        BattleBgRenderer.draw(pixelBg, this.bgTex);
        resources.load(`textures/${this.bgTex}/spriteFrame`, SpriteFrame, (err, sf) => {
            if (!err && bgNode.isValid) {
                bgNode.addComponent(Sprite).spriteFrame = sf;
                pixelBg.enabled = false;
            }
        });

        // 敌人区(右侧,面朝左=朝向我方)
        this.enemyNodes = [];
        const n = this.enemies.length;
        this.enemies.forEach((e, i) => {
            const node = new Node(`enemy_${i}`);
            node.layer = this.node.layer;
            node.addComponent(UITransform).setContentSize(160, 160);
            const ex = 220;
            const ey = n === 1 ? 60 : (140 - i * 130);
            node.setPosition(ex, ey, 0);
            this.node.addChild(node);
            node.addComponent(UIOpacity);

            const def = BeastsData.get(e.beastId!);
            // 角色图放子节点:可独立水平翻转,不影响名字/血条
            const spriteNode = new Node('sprite');
            spriteNode.layer = this.node.layer;
            spriteNode.addComponent(UITransform).setContentSize(160, 160);
            node.addChild(spriteNode);
            const sprite = spriteNode.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            const pixels = spriteNode.addComponent(Graphics);
            PixelBeasts.draw(pixels, def.id, 140);
            resources.load(`textures/${def.tex}/spriteFrame`, SpriteFrame, (err2, sf) => {
                if (!err2 && spriteNode.isValid) {
                    sprite.spriteFrame = sf;
                    pixels.enabled = false;
                    spriteNode.getComponent(UITransform)!.setContentSize(160, 160);
                    spriteNode.setScale(1, 1, 1);
                }
            });
            const nameLabel = UIFactory.label(this.node, def.name, 16, new Vec3(ex, ey + 85), new Color(255, 230, 140, 255), { bold: true, outline: true });
            const hpBar = new Node('hp');
            hpBar.layer = this.node.layer;
            hpBar.addComponent(UITransform).setContentSize(120, 8);
            hpBar.setPosition(ex, ey + 68, 0);
            this.node.addChild(hpBar);
            this.enemyNodes.push({ node, sprite, hpBar: hpBar.addComponent(Graphics), nameLabel });
        });

        // ── 我方区域(左侧,全部面朝右=朝向敌人) ──
        this.partyNodes = [];
        const pn = this.party.length;
        this.party.forEach((member, i) => {
            const node = new Node(`party_${i}`);
            node.layer = this.node.layer;
            node.addComponent(UITransform).setContentSize(100, 100);
            const px = -240;
            const py = pn === 1 ? 40 : (130 - i * 120);
            node.setPosition(px, py, 0);
            this.node.addChild(node);
            node.addComponent(UIOpacity);

            // 角色图子节点
            const spriteNode = new Node('sprite');
            spriteNode.layer = this.node.layer;
            spriteNode.addComponent(UITransform).setContentSize(100, 100);
            node.addChild(spriteNode);
            const sprite = spriteNode.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            const pixels = spriteNode.addComponent(Graphics);
            if (member.beastId) {
                PixelBeasts.draw(pixels, member.beastId, 90);
            } else {
                BattleManager.drawPlayerBack(pixels);
            }
            // 加载立绘:主角→player/axuan(面向右),伙伴→beasts/<id>(面向左,翻转朝右)
            const texPath = member.beastId ? `textures/beasts/${member.beastId}` : 'textures/player/axuan';
            resources.load(`${texPath}/spriteFrame`, SpriteFrame, (err2, sf) => {
                if (!err2 && spriteNode.isValid) {
                    sprite.spriteFrame = sf;
                    pixels.enabled = false;
                    spriteNode.getComponent(UITransform)!.setContentSize(100, 100);
                    spriteNode.setScale(member.beastId ? -1 : 1, 1, 1);
                }
            });
            // 名字
            const nameLabel = UIFactory.label(this.node, member.name, 14, new Vec3(px, py - 60), new Color(200, 240, 200, 255), { outline: true });
            // HP 条
            const hpNode = new Node('php');
            hpNode.layer = this.node.layer;
            hpNode.addComponent(UITransform).setContentSize(90, 8);
            hpNode.setPosition(px, py - 75, 0);
            this.node.addChild(hpNode);
            const hpBar = hpNode.addComponent(Graphics);
            this.partyNodes.push({ node, hpBar, nameLabel });
        });
        this.refreshPartyHp();

        // 底部窗口
        this.panel = UIFactory.panel(this.node, 0, -220, 920, 155);
        this.msgLabel = UIFactory.label(this.panel, '', 18, new Vec3(0, 50), undefined, { anchorX: 0, anchorY: 1 });
        this.msgLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.msgLabel.verticalAlign = Label.VerticalAlign.TOP;
        (this.msgLabel.node.getComponent(UITransform)!).setContentSize(880, 65);
        this.partyLabel = UIFactory.label(this.node, '', 15, new Vec3(-420, -130), new Color(210, 230, 210, 255), { anchorX: 0, anchorY: 1 });
        (this.partyLabel.node.getComponent(UITransform)!).setContentSize(880, 50);

        // 指令菜单
        this.cmdButtons = [];
        const cmds = ['攻击', '技能', '收服', '防御', '逃跑'];
        cmds.forEach((c, i) => {
            const btn = UIFactory.button(this.panel, c, -340 + i * 170, -30, 155, 48, 18);
            this.cmdButtons.push(btn);
        });
        this.paintAll();
        this.refreshPartyLabel();
    }

    private clearUI(): void {
        this.enemyNodes = [];
        this.partyNodes = [];
        this.cmdButtons = [];
        this.skillButtons = [];
        this.targetBtns = [];
        this.node.destroyAllChildren();
    }

    /** 刷新全部按钮选中态 */
    private paintAll(): void {
        this.cmdButtons.forEach((btn, i) => {
            const g = btn.getComponent(Graphics);
            UIFactory.paintButton(g, 155, 48, this.phase === 'menu' && i === this.cmdIdx);
        });
        this.skillButtons.forEach((btn, i) => {
            const g = btn.getComponent(Graphics);
            UIFactory.paintButton(g, 300, 40, this.phase === 'skillMenu' && i === this.skillIdx);
        });
        this.targetBtns.forEach((btn, i) => {
            const g = btn.getComponent(Graphics);
            UIFactory.paintButton(g, 120, 40, this.phase === 'target' && i === this.targetIdx);
        });
    }

    private setMsg(text: string): void {
        if (this.msgLabel) this.msgLabel.string = text;
    }

    private refreshPartyLabel(): void {
        if (!this.partyLabel) return;
        const parts = this.party.map(a =>
            `${a.name} Lv.${a.level}  HP ${Math.max(0, a.hp)}/${a.maxHp}  MP ${Math.max(0, a.mp)}/${a.maxMp}`
        );
        this.partyLabel.string = parts.join('    ');
        this.refreshPartyHp();
    }

    /** 刷新我方像素 HP 条 */
    private refreshPartyHp(): void {
        this.party.forEach((member, i) => {
            const pn = this.partyNodes[i];
            if (!pn) return;
            const g = pn.hpBar;
            g.clear();
            const w = 100;
            if (member.hp <= 0) {
                // 倒下:灰条
                g.fillColor = new Color(60, 50, 50, 200);
                g.rect(-w / 2, -3, w, 6);
                g.fill();
                return;
            }
            const ratio = Math.max(0, Math.min(1, member.hp / member.maxHp));
            g.fillColor = new Color(30, 28, 38, 220);
            g.rect(-w / 2 - 1, -4, w + 2, 8);
            g.fill();
            g.fillColor = ratio > 0.5 ? new Color(80, 200, 90, 255) : ratio > 0.25 ? new Color(230, 180, 60, 255) : new Color(225, 70, 60, 255);
            g.rect(-w / 2, -3, w * ratio, 6);
            g.fill();
        });
    }

    /** 主角(阿玄)战斗背面像素立绘 */
    private static drawPlayerBack(g: Graphics): void {
        const u = 100 / 24;
        g.clear();
        // 头发(背面全黑发)
        g.fillColor = new Color(34, 26, 22, 255);
        g.rect(-7 * u, 2 * u, 14 * u, 10 * u);
        g.fill();
        // 耳
        g.fillColor = new Color(240, 216, 178, 255);
        g.rect(-8 * u, 3 * u, 2 * u, 3 * u);
        g.rect(6 * u, 3 * u, 2 * u, 3 * u);
        g.fill();
        // 身体(青衫背面)
        g.fillColor = new Color(52, 96, 128, 255);
        g.rect(-6 * u, -10 * u, 12 * u, 13 * u);
        g.fill();
        // 背部中线(衣缝)
        g.fillColor = new Color(40, 78, 106, 255);
        g.rect(-1 * u, -9 * u, 2 * u, 11 * u);
        g.fill();
        // 腰带
        g.fillColor = new Color(140, 106, 44, 255);
        g.rect(-6 * u, -4 * u, 12 * u, 2 * u);
        g.fill();
        // 腿
        g.fillColor = new Color(66, 52, 40, 255);
        g.rect(-5 * u, -14 * u, 4 * u, 5 * u);
        g.rect(1 * u, -14 * u, 4 * u, 5 * u);
        g.fill();
        // 草鞋
        g.fillColor = new Color(120, 96, 56, 255);
        g.rect(-6 * u, -15 * u, 5 * u, 2 * u);
        g.rect(1 * u, -15 * u, 5 * u, 2 * u);
        g.fill();
    }

    private refreshEnemyHp(): void {
        const living = this.enemies.filter(e => e.hp > 0).length;
        let idx = 0;
        this.enemies.forEach((e, i) => {
            const en = this.enemyNodes[i];
            if (!en || !en.hpBar) return;
            const g = en.hpBar;
            g.clear();
            if (e.hp <= 0) return;
            const w = 160;
            const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
            g.fillColor = new Color(40, 30, 40, 230);
            g.rect(-w / 2 - 2, -5, w + 4, 10);
            g.fill();
            g.fillColor = ratio > 0.5 ? new Color(80, 200, 90, 255) : ratio > 0.25 ? new Color(230, 180, 60, 255) : new Color(225, 70, 60, 255);
            g.rect(-w / 2, -4, w * ratio, 8);
            g.fill();
            idx++;
        });
    }

    // ==================== 输入 ====================

    private onKeyDown(event: EventKeyboard): void {
        if (!this.node.active) return;
        const code = event.keyCode;
        const confirm = code === KeyCode.ENTER || code === KeyCode.SPACE || code === KeyCode.KEY_Z;
        const cancel = code === KeyCode.KEY_X || code === KeyCode.ESCAPE;

        switch (this.phase) {
            case 'intro':
                if (confirm) this.openMenu();
                break;
            case 'menu':
                if (code === KeyCode.ARROW_LEFT) { this.cmdIdx = (this.cmdIdx + 4) % 5; this.paintAll(); }
                else if (code === KeyCode.ARROW_RIGHT) { this.cmdIdx = (this.cmdIdx + 1) % 5; this.paintAll(); }
                else if (confirm) this.onCmdConfirm();
                break;
            case 'skillMenu':
                if (code === KeyCode.ARROW_UP) { this.skillIdx = (this.skillIdx + this.skillButtons.length - 1) % this.skillButtons.length; this.paintAll(); }
                else if (code === KeyCode.ARROW_DOWN) { this.skillIdx = (this.skillIdx + 1) % this.skillButtons.length; this.paintAll(); }
                else if (confirm) this.onSkillConfirm();
                else if (cancel) { this.phase = 'menu'; this.closeSkillMenu(); this.paintAll(); }
                break;
            case 'target':
                if (code === KeyCode.ARROW_LEFT || code === KeyCode.ARROW_RIGHT) { this.targetIdx = (this.targetIdx + 1) % this.targetBtns.length; this.paintAll(); }
                else if (confirm) this.onTargetConfirm();
                else if (cancel) { this.phase = 'menu'; this.closeTargetMenu(); this.paintAll(); }
                break;
            case 'victory':
            case 'defeat':
                if (confirm) this.endBattle(this.phase === 'victory');
                break;
        }
    }

    // ==================== 指令处理 ====================

    private openMenu(): void {
        this.phase = 'menu';
        this.curActorIdx = 0;
        this.pendingActions = [];
        this.refreshPartyLabel();
        this.setMsg(`${this.party[0].name} 的回合,请选择指令。`);
        this.paintAll();
    }

    private onCmdConfirm(): void {
        const actor = this.party[this.curActorIdx];
        switch (this.cmdIdx) {
            case 0: { // 攻击
                const living = this.enemies.filter(e => e.hp > 0);
                if (living.length === 1) {
                    this.pushAction(actor, null, living[0]);
                    this.nextActor();
                } else {
                    this.pendingSkill = null;
                    this.openTargetMenu();
                }
                break;
            }
            case 1: // 技能
                this.openSkillMenu();
                break;
            case 2: // 收服
                this.tryCatch(actor);
                break;
            case 3: // 防御
                this.pendingActions.push({ actor, isEnemy: false, skill: null, targets: [], text: `${actor.name} 进入防御姿态!` });
                this.nextActor();
                break;
            case 4: // 逃跑
                this.tryRun();
                break;
        }
    }

    private pushAction(actor: ActorStats, skill: SkillDef | null, specific?: ActorStats): void {
        const living = this.enemies.filter(e => e.hp > 0);
        if (!skill) {
            // 普攻(可选指定目标)
            const t = specific && specific.hp > 0 ? [specific] : [living[0]];
            this.pendingActions.push({ actor, isEnemy: false, skill: null, targets: t, text: `${actor.name} 的攻击!` });
        } else if (skill.target === 'allEnemies') {
            this.pendingActions.push({ actor, isEnemy: false, skill, targets: living, text: `${actor.name} 使出「${skill.name}」!` });
        } else if (skill.target === 'enemy') {
            this.pendingActions.push({ actor, isEnemy: false, skill, targets: [living[0]], text: `${actor.name} 使出「${skill.name}」!` });
        } else {
            // 治疗自己
            this.pendingActions.push({ actor, isEnemy: false, skill, targets: [actor], text: `${actor.name} 使出「${skill.name}」!` });
        }
    }

    private nextActor(): void {
        this.curActorIdx++;
        if (this.curActorIdx < this.party.length) {
            this.setMsg(`${this.party[this.curActorIdx].name} 的回合,请选择指令。`);
            this.paintAll();
        } else {
            this.beginRound();
        }
    }

    private openSkillMenu(): void {
        const actor = this.party[this.curActorIdx];
        const skills = actor.skills.map(id => SkillsData.get(id));
        if (skills.length === 0) {
            this.setMsg(`${actor.name} 不会任何技能!`);
            return;
        }
        this.phase = 'skillMenu';
        this.skillIdx = 0;
        this.skillButtons = [];
        skills.forEach((s, i) => {
            const y = 40 - i * 46;
            const btn = UIFactory.button(this.panel, `${s.name}(${s.mpCost}MP)`, 130, y, 300, 40, 16);
            this.skillButtons.push(btn);
        });
        this.paintAll();
    }

    private closeSkillMenu(): void {
        this.skillButtons.forEach(b => b.destroy());
        this.skillButtons = [];
    }

    private onSkillConfirm(): void {
        const actor = this.party[this.curActorIdx];
        const skill = SkillsData.get(actor.skills[this.skillIdx]);
        this.pendingSkill = skill;
        if (actor.mp < skill.mpCost) {
            this.setMsg('MP 不足!');
            return;
        }
        this.closeSkillMenu();
        if (skill.target === 'enemy') {
            this.openTargetMenu();
        } else if (skill.target === 'allEnemies') {
            // 无需选择
            this.pushAction(actor, skill);
            this.nextActor();
        } else {
            this.pushAction(actor, skill);
            this.nextActor();
        }
    }

    private openTargetMenu(): void {
        this.phase = 'target';
        this.targetIdx = 0;
        this.targetBtns = [];
        this.enemies.forEach((e, i) => {
            if (e.hp <= 0) return;
            const btn = UIFactory.button(this.panel, e.name, -220 + i * 150, 40, 120, 40, 14);
            this.targetBtns.push(btn);
        });
        this.setMsg(`选择目标:`);
        this.paintAll();
    }

    private closeTargetMenu(): void {
        this.targetBtns.forEach(b => b.destroy());
        this.targetBtns = [];
    }

    private onTargetConfirm(): void {
        const actor = this.party[this.curActorIdx];
        const living = this.enemies.filter(e => e.hp > 0);
        const target = living[this.targetIdx];
        if (!target) {
            this.closeTargetMenu();
            this.phase = 'menu';
            this.paintAll();
            return;
        }
        this.closeTargetMenu();
        if (this.pendingSkill) {
            this.pendingActions.push({
                actor, isEnemy: false, skill: this.pendingSkill,
                targets: [target],
                text: `${actor.name} 使出「${this.pendingSkill.name}」!`,
            });
            this.pendingSkill = null;
        } else {
            this.pendingActions.push({
                actor, isEnemy: false, skill: null,
                targets: [target],
                text: `${actor.name} 的攻击!`,
            });
        }
        this.nextActor();
    }

    private tryCatch(actor: ActorStats): void {
        const living = this.enemies.filter(e => e.hp > 0 && BeastsData.get(e.beastId!).catchable);
        if (living.length === 0 || !GameManager.inst.hasFlag('got_book')) {
            this.setMsg('没有可以收服的异兽!');
            return;
        }
        const target = living[0];
        if (target.hp > target.maxHp * 0.3) {
            this.setMsg(`${target.name} 精神还很充沛,无法收服!`);
            return;
        }
        const rate = 0.65;
        if (Math.random() < rate) {
            GameManager.inst.catchBeast(target.beastId!);
            target.hp = 0;
            this.setMsg(`${target.name} 被收服了!`);
            this.refreshPartyLabel();
            this.fadeEnemy(target);
        } else {
            this.setMsg(`${target.name} 挣脱了!`);
        }
        this.nextActor();
    }

    private tryRun(): void {
        const bossFight = this.enemies.some(e => e.beastId && BeastsData.get(e.beastId).boss);
        if (bossFight) {
            this.setMsg('山崩地裂,无处可逃!');
            this.nextActor();
            return;
        }
        if (Math.random() < 0.8) {
            this.setMsg('成功逃离了战斗!');
            this.endBattle(false);
        } else {
            this.setMsg('逃跑失败!');
            this.nextActor();
        }
    }

    private fadeEnemy(enemy: ActorStats): void {
        const idx = this.enemies.indexOf(enemy);
        const en = this.enemyNodes[idx];
        if (en) {
            tween(en.node).to(0.4, { scale: new Vec3(0.1, 0.1, 1) }).start();
            tween(en.nameLabel.node).to(0.3, { scale: new Vec3(0.1, 0.1, 1) }).start();
        }
        this.refreshEnemyHp();
    }

    // ==================== 回合执行 ====================

    private async beginRound(): Promise<void> {
        this.phase = 'action';
        // 敌人行动
        const enemyActions = this.enemies
            .filter(e => e.hp > 0)
            .map(e => this.enemyAI(e));
        this.pendingActions = [...this.pendingActions, ...enemyActions].sort((a, b) => b.actor.spd - a.actor.spd);

        for (const act of this.pendingActions) {
            if (this.enemies.every(e => e.hp <= 0) || this.party.every(p => p.hp <= 0)) break;
            if (act.actor.hp <= 0) continue;
            await this.playAction(act);
            await sleep(450);
        }
        this.pendingActions = [];

        // 结算
        if (this.enemies.every(e => e.hp <= 0)) {
            this.onVictory();
        } else if (this.party.every(p => p.hp <= 0)) {
            this.onDefeat();
        } else {
            this.openMenu();
        }
    }

    private enemyAI(actor: ActorStats): PendingAction {
        const living = this.party.filter(p => p.hp > 0);
        const targets = [living[Math.floor(Math.random() * living.length)]];
        const skills = actor.skills.filter(id => {
            const s = SkillsData.get(id);
            return actor.mp >= s.mpCost;
        });
        if (skills.length > 0 && Math.random() < 0.45) {
            const skill = SkillsData.get(skills[Math.floor(Math.random() * skills.length)]);
            const t = skill.target === 'allEnemies' ? living : targets;
            actor.mp -= skill.mpCost;
            return { actor, isEnemy: true, skill, targets: t, text: `${actor.name} 发出「${skill.name}」!` };
        }
        return { actor, isEnemy: true, skill: null, targets, text: `${actor.name} 的攻击!` };
    }

    private async playAction(act: PendingAction): Promise<void> {
        this.setMsg(act.text);
        await sleep(500);

        // 攻击者前冲:我方朝右扑向敌人,敌人朝左扑向我方
        if (act.targets.length > 0) {
            const atkNode = act.isEnemy
                ? this.enemyNodes[this.enemies.indexOf(act.actor)]?.node
                : this.partyNodes[this.party.indexOf(act.actor)]?.node;
            if (atkNode) await this.lungeNode(atkNode, act.isEnemy);
        }

        for (const target of act.targets) {
            if (target.hp <= 0) continue;
            let amount = 0;
            let isHeal = false;
            if (act.skill) {
                const s = act.skill;
                if (s.type === 'heal') {
                    isHeal = true;
                    amount = Math.floor(s.power * (0.9 + Math.random() * 0.2));
                    target.hp = Math.min(target.maxHp, target.hp + amount);
                } else if (s.type === 'magic') {
                    amount = Math.max(1, Math.floor(act.actor.atk * s.power * (0.85 + Math.random() * 0.3) - target.def * 0.4));
                    target.hp = Math.max(0, target.hp - amount);
                } else if (s.type === 'buff') {
                    // 增益：提升目标防御（buffDef），持续本场战斗（简化：直接加防）
                    isHeal = true;
                    amount = s.buffDef || 3;
                    target.def += amount;
                    target.maxHp = target.maxHp; // 无副作用
                } else {
                    amount = Math.max(1, Math.floor(act.actor.atk * s.power - target.def));
                    target.hp = Math.max(0, target.hp - amount);
                }
                act.actor.mp = Math.max(0, act.actor.mp - s.mpCost);
            } else {
                // 普攻
                amount = Math.max(1, Math.floor(act.actor.atk * 2 - target.def) + Math.floor(Math.random() * 3));
                target.hp = Math.max(0, target.hp - amount);
            }

            // 目标节点与命中特效
            const tRef = this.targetNode(target);
            if (tRef) {
                const tx = tRef.node.position.x;
                const ty = tRef.node.position.y;
                if (isHeal) {
                    this.spawnBurst(tx, ty, new Color(120, 240, 140, 255), false);
                } else if (act.skill && act.skill.type === 'magic') {
                    this.spawnBurst(tx, ty, new Color(150, 110, 255, 255), true);
                } else {
                    this.spawnBurst(tx, ty, new Color(255, 240, 150, 255), false);
                }
                if (target.hp > 0) this.flashNode(tRef.node);
            }

            // 伤害/治疗数字(浮到目标上方)
            const color = isHeal ? new Color(120, 240, 140, 255) : new Color(255, 220, 90, 255);
            const prefix = isHeal ? '+' : '-';
            const dx = tRef ? tRef.node.position.x : 0;
            const dy = tRef ? tRef.node.position.y + 40 : 40;
            const label = UIFactory.label(this.node, `${prefix}${amount}`, 26, new Vec3(dx, dy), color, { bold: true, outline: true });
            tween(label.node)
                .by(0.8, { position: new Vec3(0, 40) })
                .call(() => label.node.destroy())
                .start();

            if (target.hp <= 0) {
                this.setMsg(`${target.name} 倒下了!`);
                if (act.isEnemy) {
                    // 我方倒下:提示
                } else {
                    this.fadeEnemy(target);
                }
            } else {
                // 受击 shake(水平抖动)
                const enIdx = this.enemies.indexOf(target);
                if (enIdx >= 0 && !act.isEnemy) {
                    const node = this.enemyNodes[enIdx].node;
                    const origX = node.position.x;
                    const origY = node.position.y;
                    tween(node)
                        .to(0.05, { position: new Vec3(origX + 10, origY) })
                        .to(0.05, { position: new Vec3(origX - 10, origY) })
                        .to(0.05, { position: new Vec3(origX, origY) })
                        .start();
                }
            }
            await sleep(600);
        }
        this.refreshEnemyHp();
        this.refreshPartyLabel();
    }

    /** 根据战斗者定位其节点 */
    private targetNode(target: ActorStats): { node: Node; isEnemy: boolean } | null {
        const ei = this.enemies.indexOf(target);
        if (ei >= 0 && this.enemyNodes[ei]) return { node: this.enemyNodes[ei].node, isEnemy: true };
        const pi = this.party.indexOf(target);
        if (pi >= 0 && this.partyNodes[pi]) return { node: this.partyNodes[pi].node, isEnemy: false };
        return null;
    }

    /** 攻击前冲:朝目标方向扑出再收回 */
    private lungeNode(node: Node, isEnemy: boolean): Promise<void> {
        return new Promise(res => {
            const orig = node.position.clone();
            const dx = isEnemy ? -36 : 36;   // 敌人向左扑向我方,我方向右扑向敌人
            tween(node)
                .to(0.1, { position: new Vec3(orig.x + dx, orig.y, orig.z) })
                .to(0.12, { position: orig })
                .call(() => res())
                .start();
        });
    }

    /** 受击闪白 */
    private flashNode(node: Node): void {
        const op = node.getComponent(UIOpacity);
        if (!op) return;
        op.opacity = 70;
        tween(op).to(0.12, { opacity: 255 }).start();
    }

    /** 命中冲击波:扩散圆环 + 中心光团,淡出后销毁 */
    private spawnBurst(x: number, y: number, color: Color, big = false): void {
        const fx = new Node('fx');
        fx.layer = this.node.layer;
        fx.addComponent(UITransform).setContentSize(1, 1);
        fx.setPosition(x, y, 0);
        this.node.addChild(fx);
        const g = fx.addComponent(Graphics);
        const r = big ? 42 : 24;
        g.lineWidth = 3;
        g.strokeColor = color;
        g.circle(0, 0, r);
        g.stroke();
        g.fillColor = new Color(color.r, color.g, color.b, 80);
        g.circle(0, 0, r * 0.55);
        g.fill();
        const op = fx.addComponent(UIOpacity);
        op.opacity = 255;
        tween(fx).to(0.32, { scale: new Vec3(1.7, 1.7, 1) }).call(() => fx.destroy()).start();
        tween(op).to(0.32, { opacity: 0 }).start();
    }

    private onVictory(): void {
        this.phase = 'victory';
        const gm = GameManager.inst;
        const exp = this.enemies.reduce((s, e) => s + BeastsData.get(e.beastId!).exp, 0);
        const gold = this.enemies.reduce((s, e) => s + BeastsData.get(e.beastId!).gold, 0);
        gm.gainExp(exp);
        gm.addGold(gold);
        this.enemies.forEach(e => gm.addToDex(e.beastId!));
        this.setMsg(`胜利!获得经验 ${exp}、金钱 ${gold}!\n${this.party[0].name} 当前经验 ${gm.player.exp}/${gm.player.nextExp}。按 Z 继续。`);
    }

    private onDefeat(): void {
        this.phase = 'defeat';
        this.setMsg('我方全员倒下……被送回了家中。按 Z 继续。');
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}