import { _decorator, Color, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { GameManager, GameState } from '../core/GameManager';
import { MapsData } from '../data/MapsData';
import { UIFactory } from '../ui/UIFactory';

const { ccclass } = _decorator;

/**
 * 探索 HUD:地图名 / 队伍状态 / 按键提示(战斗中自动隐藏)
 */
@ccclass('HUD')
export class HUD extends Component {
    private mapLabel: Label;
    private partyLabel: Label;
    private goldLabel: Label;
    private hintLabel: Label;
    private weaponLabel: Label | null = null;

    init(uiRoot: Node): void {
        this.node.layer = uiRoot.layer;
        this.node.addComponent(UITransform).setContentSize(960, 600);
        this.node.active = true;

        this.mapLabel = UIFactory.label(this.node, '', 18, new Vec3(-430, 278), undefined, { bold: true, outline: true, anchorX: 0, anchorY: 1 });
        this.goldLabel = UIFactory.label(this.node, '', 16, new Vec3(430, 278), undefined, { bold: true, outline: true, anchorX: 1, anchorY: 1 });
        this.partyLabel = UIFactory.label(this.node, '', 15, new Vec3(-430, 252), undefined, { bold: true, outline: true, anchorX: 0, anchorY: 1 });
        this.hintLabel = UIFactory.label(this.node, '方向键/WASD 移动　Z/空格 对话·确认　X 图鉴　C 属性加点　红圈! = 强敌/Boss位置', 13, new Vec3(0, -282), undefined, { outline: true });
    }

    update(): void {
        const gm = GameManager.inst;
        if (!gm) return;
        const visible = gm.state === GameState.EXPLORE || gm.state === GameState.MENU;
        this.node.active = !!visible;

        if (!visible) return;
        this.mapLabel.string = `　${MapsData.get(gm.curMapId).name}`;
        this.goldLabel.string = `金币 ${gm.gold}`;
        const lines: string[] = [];
        lines.push(`${gm.player.name} Lv.${gm.player.level}  HP ${Math.max(0, gm.player.hp)}/${gm.player.maxHp}  MP ${Math.max(0, gm.player.mp)}/${gm.player.maxMp}`);
        if (gm.beast) {
            lines.push(`${gm.beast.name}  HP ${Math.max(0, gm.beast.hp)}/${gm.beast.maxHp}  MP ${Math.max(0, gm.beast.mp)}/${gm.beast.maxMp}`);
        }
        this.partyLabel.string = lines.join('\n');
        // 武器显示(右上角,金币下方)——成长反馈:让玩家看到装备变化
        if (!this.weaponLabel) {
            this.weaponLabel = UIFactory.label(this.node, '', 14, new Vec3(430, 256), new Color(230, 210, 160, 255), { outline: true, anchorX: 1, anchorY: 1 });
        }
        this.weaponLabel.string = `武器 ${gm.getWeapon().name}`;
    }
}