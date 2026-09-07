import { _decorator, Color, Component, Graphics, input, Input, EventKeyboard, EventMouse, KeyCode, Label, Node, UITransform, Vec3 } from 'cc';
import { DialogueNode } from '../core/GameData';
import { DialogueData } from '../data/DialogueData';
import { GameManager, GameState } from '../core/GameManager';
import { EventBus, GEvent } from '../core/EventBus';
import { UIFactory } from '../ui/UIFactory';

const { ccclass } = _decorator;

/**
 * 对话系统:打字机文本 + 选项 + 数据指令推进剧情
 * actions 支持:setFlag / clearFlag / learnSkill / getBeast / heal / save / battle:id1,id2
 */
@ccclass('DialogueUI')
export class DialogueUI extends Component {
    static inst: DialogueUI;

    private nameLabel: Label;
    private textLabel: Label;
    private textNode: Node;
    private arrowNode: Node;
    private choices: Node[] = [];
    private choiceIdx = 0;

    private curNode: DialogueNode | null = null;
    private lineIdx = 0;
    private fullText = '';
    private shownChars = 0;
    private typing = false;
    private typingAcc = 0;
    private inChoices = false;

    private pendingActions: string[] = [];
    private awaitingBattle = false;
    private ended = false;   // 对话是否已结束(供 onKey 判断)

    init(uiRoot: Node): void {
        this.node.layer = uiRoot.layer;
        this.node.addComponent(UITransform).setContentSize(960, 600);
        this.node.active = false;

        // ── 主对话面板:屏幕底部(红白机 DQ 风格) ──
        // 面板 Y 范围: -150 ~ -290, X: -450 ~ +450
        UIFactory.panel(this.node, 0, -220, 900, 140);

        // ── 名字牌:骑在面板顶边左侧 ──
        const nameBox = UIFactory.panel(this.node, -320, -148, 160, 32);
        this.nameLabel = UIFactory.label(nameBox, '', 16, new Vec3(0, 0), undefined, { bold: true, outline: true });

        // ── 文字区域:严格在面板内部 ──
        this.textNode = new Node('text');
        this.textNode.layer = this.node.layer;
        this.textNode.addComponent(UITransform).setContentSize(840, 100);
        this.textNode.setPosition(0, -220);
        this.node.addChild(this.textNode);
        // 文字锚点=左上,从面板内顶部开始排列
        this.textLabel = UIFactory.label(this.textNode, '', 20, new Vec3(-410, 50), undefined, { anchorX: 0, anchorY: 1 });
        this.textLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.textLabel.verticalAlign = Label.VerticalAlign.TOP;
        (this.textLabel.node.getComponent(UITransform)!).setContentSize(820, 95);

        // ── ▼ 继续指示箭头:面板右下角 ──
        this.arrowNode = new Node('arrow');
        this.arrowNode.layer = this.node.layer;
        this.arrowNode.addComponent(UITransform).setContentSize(20, 16);
        this.arrowNode.setPosition(410, -278);
        const ag = this.arrowNode.addComponent(Graphics);
        ag.fillColor = new Color(255, 240, 160, 255);
        ag.moveTo(-7, 5);
        ag.lineTo(7, 5);
        ag.lineTo(0, -5);
        ag.close();
        ag.fill();
        this.node.addChild(this.arrowNode);
        this.arrowNode.active = false;

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onClick, this);
        input.on(Input.EventType.TOUCH_START, this.onClick, this);
    }

    update(dt: number): void {
        if (!this.typing || !this.curNode) return;
        this.typingAcc += dt;
        while (this.typingAcc > 0.028 && this.shownChars < this.fullText.length) {
            this.typingAcc -= 0.028;
            this.shownChars += 2;
            this.textLabel.string = this.fullText.slice(0, this.shownChars);
        }
        if (this.shownChars >= this.fullText.length) {
            this.typing = false;
            this.arrowNode.active = true;
        }
    }

    // ==================== 驱动 ====================

    show(nodeId: string): void {
        const node = DialogueData.get(nodeId);
        if (!node) {
            console.warn('[DialogueUI] 找不到对话节点', nodeId);
            GameManager.inst.setState(GameState.EXPLORE);
            return;
        }
        GameManager.inst.setState(GameState.DIALOG);
        this.node.active = true;
        this.ended = false;
        this.awaitingBattle = false;
        this.inChoices = false;
        this.choices = [];
        this.playNode(node);
    }

    private playNode(node: DialogueNode): void {
        this.curNode = node;
        this.lineIdx = 0;
        this.pendingActions = node.actions ? [...node.actions] : [];
        this.nextLine();
    }

    private nextLine(): void {
        if (!this.curNode) return;
        if (this.lineIdx >= this.curNode.lines.length) {
            // 文本结束:选项 or 结束
            this.clearChoiceButtons();
            if (this.curNode.choices && this.curNode.choices.length > 0) {
                this.showChoices();
            } else {
                this.finishNode();
            }
            return;
        }
        const line = this.curNode.lines[this.lineIdx++];
        this.nameLabel.string = line.speaker || ' ';
        this.fullText = line.text;
        this.shownChars = 0;
        this.typing = true;
        this.typingAcc = 0;
        this.textLabel.string = '';
        this.arrowNode.active = false;
    }

    private showChoices(): void {
        this.inChoices = true;
        this.choiceIdx = 0;
        this.choices = [];
        this.arrowNode.active = false;
        this.textLabel.string = '';
        this.curNode!.choices!.forEach((c, i) => {
            const btn = UIFactory.button(this.node, `　${c.text}`, 0, -185 - i * 42, 700, 36, 18);
            this.choices.push(btn);
        });
        this.paintChoices();
    }

    private paintChoices(): void {
        this.choices.forEach((btn, i) => {
            const g = btn.getComponent(Graphics);
            UIFactory.paintButton(g, 640, 42, i === this.choiceIdx);
        });
    }

    private clearChoiceButtons(): void {
        this.choices.forEach(b => b.destroy());
        this.choices = [];
    }

    /** 节点结束:执行动作 → 下一节点 */
    private finishNode(): void {
        const actions = this.pendingActions;
        this.pendingActions = [];
        this.runActions(actions, 0);
    }

    private runActions(actions: string[], i: number): void {
        if (i >= actions.length) {
            // 动作结束 → next
            const next = this.curNode?.next;
            if (next) {
                this.playNode(DialogueData.get(next));
            } else {
                this.close();
            }
            return;
        }
        const action = actions[i];
        const [cmd, ...rest] = action.split(':');
        const arg = rest.join(':');
        const gm = GameManager.inst;

        switch (cmd) {
            case 'setFlag':
                gm.addFlag(arg);
                this.runActions(actions, i + 1);
                break;
            case 'clearFlag':
                gm.flags.delete(arg);
                this.runActions(actions, i + 1);
                break;
            case 'learnSkill':
                if (!gm.player.skills.includes(arg)) gm.player.skills.push(arg);
                this.runActions(actions, i + 1);
                break;
            case 'getBeast':
                gm.catchBeast(arg);
                this.runActions(actions, i + 1);
                break;
            case 'heal':
                gm.healAll();
                this.runActions(actions, i + 1);
                break;
            case 'save':
                gm.save();
                this.runActions(actions, i + 1);
                break;
            case 'battle': {
                // 嵌入战斗:胜利后继续,失败由 GameRoot 处理回村并中断
                const beastIds = arg.split(',');
                EventBus.emit('battle:startDialogue', beastIds);
                this.awaitingBattle = true;
                this.node.active = false;
                break;
            }
            default:
                console.warn('[DialogueUI] 未知指令', cmd);
                this.runActions(actions, i + 1);
        }
    }

    /** 战斗胜利回调:继续对话 */
    onBattleWin(): void {
        if (!this.awaitingBattle) return;
        this.awaitingBattle = false;
        this.node.active = true;
        GameManager.inst.setState(GameState.DIALOG);
        const next = this.curNode?.next;
        if (next) {
            this.playNode(DialogueData.get(next));
        } else {
            this.close();
        }
    }

    /** 战斗失败回调:中断对话 */
    onBattleLose(): void {
        this.awaitingBattle = false;
        this.curNode = null;
        this.close();
    }

    close(): void {
        this.ended = true;
        this.inChoices = false;
        this.typing = false;
        this.arrowNode.active = false;
        this.clearChoiceButtons();
        this.node.active = false;
        this.curNode = null;
        EventBus.emit(GEvent.DIALOG_END);
        GameManager.inst.setState(GameState.EXPLORE);
    }

    get isAwaitingBattle(): boolean { return this.awaitingBattle; }

    // ==================== 输入 ====================

    private onKeyDown(event: EventKeyboard): void {
        if (!this.node.active || this.ended) return;
        const code = event.keyCode;
        const confirm = code === KeyCode.ENTER || code === KeyCode.SPACE || code === KeyCode.KEY_Z;
        const cancel = code === KeyCode.ESCAPE || code === KeyCode.KEY_X;

        // ESC/X 强制关闭对话
        if (cancel) {
            this.close();
            return;
        }

        if (this.inChoices) {
            if (code === KeyCode.ARROW_UP) { this.choiceIdx = (this.choiceIdx + this.choices.length - 1) % this.choices.length; this.paintChoices(); }
            else if (code === KeyCode.ARROW_DOWN) { this.choiceIdx = (this.choiceIdx + 1) % this.choices.length; this.paintChoices(); }
            else if (confirm) {
                const choice = this.curNode!.choices![this.choiceIdx];
                this.inChoices = false;
                this.clearChoiceButtons();
                if (choice.next) this.playNode(DialogueData.get(choice.next));
                else this.finishNode();
            }
            return;
        }

        if (confirm) {
            if (this.typing) {
                // 加速显示:直接补全
                this.shownChars = this.fullText.length;
                this.textLabel.string = this.fullText;
                this.typing = false;
                this.arrowNode.active = true;
            } else {
                this.nextLine();
            }
        }
    }

    /** 鼠标点击/触摸:推进对话(同 confirm 键) */
    private onClick(_event: EventMouse | any): void {
        if (!this.node.active || this.ended) return;
        if (this.inChoices) return;  // 选项中不响应点击,避免误触
        if (this.typing) {
            this.shownChars = this.fullText.length;
            this.textLabel.string = this.fullText;
            this.typing = false;
            this.arrowNode.active = true;
        } else {
            this.nextLine();
        }
    }
}