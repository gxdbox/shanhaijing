import { _decorator, Color, Component, Graphics, input, Input, EventKeyboard, KeyCode, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager, GameState } from '../core/GameManager';
import { UIFactory } from '../ui/UIFactory';

const { ccclass } = _decorator;

/**
 * 属性加点面板(里程碑 M1)
 * C 键开关;↑↓ 选择属性,Z/空格 分配;显示剩余点数与当前属性
 */
@ccclass('AttrPanel')
export class AttrPanel extends Component {
    private open = false;
    private selIdx = 0;
    private ptsLabel: Label;
    private infoLabel: Label;
    private rows: { key: string; name: string; desc: string; label: Label; btn: Node }[] = [];
    private hintLabel: Label;

    init(uiRoot: Node): void {
        this.node.layer = uiRoot.layer;
        this.node.addComponent(UITransform).setContentSize(960, 600);
        this.node.active = false;

        const panel = UIFactory.panel(this.node, 0, 0, 640, 480, { fill: undefined, border: undefined });
        if (panel) {
            UIFactory.label(panel, '属性修行', 26, new Vec3(0, 200), undefined, { bold: true, outline: true });
        }
        this.ptsLabel = UIFactory.label(this.node, '', 18, new Vec3(0, 160), new Color(255, 218, 110, 255), { bold: true, outline: true });
        this.infoLabel = UIFactory.label(this.node, '', 15, new Vec3(0, -185), undefined, { outline: true });
        this.hintLabel = UIFactory.label(this.node, '↑↓ 选择　Z/空格 分配　C/X 关闭', 14, new Vec3(0, -220), undefined, { outline: true });

        // 四行属性
        const specs = [
            { key: 'atk', name: '攻击', desc: '攻击 +2' },
            { key: 'def', name: '防御', desc: '防御 +2' },
            { key: 'spd', name: '速度', desc: '速度 +1' },
            { key: 'maxHp', name: '生命', desc: '生命 +10' },
        ];
        specs.forEach((s, i) => {
            const y = 90 - i * 60;
            const label = UIFactory.label(this.node, '', 18, new Vec3(-160, y), undefined, { bold: true, outline: true });
            const btn = UIFactory.button(this.node, '＋', 200, y, 60, 36, 20);
            this.rows.push({ key: s.key, name: s.name, desc: s.desc, label, btn });
        });

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    toggle(): void {
        const gm = GameManager.inst;
        if (this.open) {
            this.open = false;
            this.node.active = false;
            gm.setState(GameState.EXPLORE);
            gm.save();
        } else {
            this.open = true;
            this.selIdx = 0;
            this.node.active = true;
            gm.setState(GameState.MENU);
            this.refresh();
        }
    }

    private refresh(): void {
        const gm = GameManager.inst;
        if (!gm) return;
        const p = gm.player;
        this.ptsLabel.string = `剩余属性点: ${gm.attrPoints}`;
        this.rows.forEach((r, i) => {
            const val = r.key === 'maxHp' ? p.maxHp : (p as any)[r.key];
            const extra = r.key === 'maxHp' ? '' : '';
            r.label.string = `${r.name}  ${val}${extra}`;
            r.label.node.setScale(i === this.selIdx ? 1.2 : 1, i === this.selIdx ? 1.2 : 1, 1);
        });
        this.infoLabel.string = gm.attrPoints > 0
            ? `${this.rows[this.selIdx].name}: ${this.rows[this.selIdx].desc}`
            : '升级可获得更多属性点';
    }

    private alloc(): void {
        const gm = GameManager.inst;
        if (!gm || gm.attrPoints <= 0) return;
        const row = this.rows[this.selIdx];
        if (gm.spendAttrPoint(row.key)) {
            this.refresh();
        }
    }

    private onKeyDown(event: EventKeyboard): void {
        if (!this.node.active || !this.open) return;
        const code = event.keyCode;
        if (code === KeyCode.ARROW_UP) {
            this.selIdx = (this.selIdx + this.rows.length - 1) % this.rows.length;
            this.refresh();
        } else if (code === KeyCode.ARROW_DOWN) {
            this.selIdx = (this.selIdx + 1) % this.rows.length;
            this.refresh();
        } else if (code === KeyCode.ENTER || code === KeyCode.SPACE || code === KeyCode.KEY_Z) {
            this.alloc();
        }
    }
}