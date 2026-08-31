import { _decorator, Component, Graphics, input, Input, EventKeyboard, KeyCode, Label, Node, UITransform, Vec3 } from 'cc';
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

        const panel = UIFactory.panel(this.node, 0, -215, 920, 165);
        // 名字窗
        const nameBox = UIFactory.panel(this.node, -330, -118, 230, 42);
        this.nameLabel = UIFactory.label(nameBox, '', 18, new Vec3(0, 0), undefined, { bold: true, outline: true });
        this.textNode = new Node('text');
        this.textNode.layer = this.node.layer;
        this.textNode.addComponent(UITransform).setContentSize(860, 110);
        this.textNode.setPosition(0, -205);
        this.node.addChild(this.textNode);
        this.textLabel = UIFactory.label(this.textNode, '', 20, new Vec3(-430, 95), undefined, { anchorX: 0, anchorY: 1 });
        this.textLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.textLabel.verticalAlign = Label.VerticalAlign.TOP;
        (this.textLabel.node.getComponent(UITransform)!).setContentSize(860, 120);

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
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
    }

    private showChoices(): void {
        this.inChoices = true;
        this.choiceIdx = 0;
        this.choices = [];
        // 文本末尾追加提示
        this.textLabel.string = this.fullText + '\n　';
        this.curNode!.choices!.forEach((c, i) => {
            const btn = UIFactory.button(this.node, `　${c.text}`, -120, -20 - i * 46, 640, 42, 18);
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
            } else {
                this.nextLine();
            }
        }
    }
}