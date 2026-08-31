import { _decorator, Component, Graphics, input, Input, EventKeyboard, KeyCode, Label, Node, UITransform, Vec3 } from 'cc';
import { BeastsData } from '../data/BeastsData';
import { GameManager, GameState } from '../core/GameManager';
import { UIFactory } from '../ui/UIFactory';

const { ccclass } = _decorator;

/**
 * 《山海经》图鉴:展示已收录的异兽与原文
 * X 键开关;↑↓ 翻页
 */
@ccclass('CodexUI')
export class CodexUI extends Component {
    private page = 0;
    private pageLabel: Label;
    private listRoot: Node;
    private open = false;

    init(uiRoot: Node): void {
        this.node.layer = uiRoot.layer;
        this.node.addComponent(UITransform).setContentSize(960, 600);
        this.node.active = false;

        const panel = UIFactory.panel(this.node, 0, 0, 920, 560, { fill: undefined, border: undefined });
        if (panel) {
            UIFactory.label(panel, '《山海经》图鉴', 26, new Vec3(0, 245), undefined, { bold: true, outline: true });
            UIFactory.label(panel, '↑↓ 翻页　X 关闭', 14, new Vec3(0, -255), undefined, { outline: true });
        }
        this.listRoot = new Node('list');
        this.listRoot.layer = this.node.layer;
        this.listRoot.addComponent(UITransform).setContentSize(860, 420);
        this.listRoot.setPosition(0, 15);
        this.node.addChild(this.listRoot);
        this.pageLabel = UIFactory.label(this.node, '', 14, new Vec3(430, 268), undefined, { anchorX: 1, anchorY: 1 });

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    toggle(): void {
        const gm = GameManager.inst;
        if (this.open) {
            this.open = false;
            this.node.active = false;
            gm.setState(GameState.EXPLORE);
        } else {
            this.open = true;
            this.page = 0;
            this.node.active = true;
            gm.setState(GameState.MENU);
            this.renderPage();
        }
    }

    private renderPage(): void {
        const gm = GameManager.inst;
        this.listRoot.destroyAllChildren();
        const perPage = 4;
        const start = this.page * perPage;
        const entries = gm.dex.slice(start, start + perPage);
        this.pageLabel.string = gm.dex.length === 0 ? '暂无收录' : `${start + 1}-${Math.min(start + perPage, gm.dex.length)} / ${gm.dex.length}`;

        if (gm.dex.length === 0) {
            UIFactory.label(this.listRoot, '——尚未收录异兽,击败它们吧——', 18, new Vec3(0, 100), undefined, { outline: true });
            return;
        }

        entries.forEach((id, i) => {
            const def = BeastsData.get(id);
            const y = 160 - i * 105;
            // 条目框
            const box = UIFactory.panel(this.listRoot, 0, y - 30, 820, 96);
            const num = UIFactory.label(box, `${id === 'jiuwei' ? '〔伙伴〕' : ''}${def.name} · ${def.kind}`, 20, new Vec3(-350, 28), undefined, { bold: true, outline: true, anchorX: 0 });
            UIFactory.label(box, `「${def.quote}」`, 14, new Vec3(-350, 0), undefined, { anchorX: 0 });
            UIFactory.label(box, def.desc, 13, new Vec3(-350, -26), undefined, { anchorX: 0 });
        });
    }

    private onKeyDown(event: EventKeyboard): void {
        if (!this.node.active || !this.open) return;
        const code = event.keyCode;
        const gm = GameManager.inst;
        const perPage = 4;
        if (code === KeyCode.KEY_X || code === KeyCode.ESCAPE) {
            this.toggle();
        } else if (code === KeyCode.ARROW_UP) {
            if (this.page > 0) { this.page--; this.renderPage(); }
        } else if (code === KeyCode.ARROW_DOWN) {
            if ((this.page + 1) * perPage < gm.dex.length) { this.page++; this.renderPage(); }
        }
    }
}