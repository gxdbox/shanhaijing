import { _decorator, Color, Component, Graphics, Node, resources, Sprite, SpriteFrame, sys, tween, Vec3, UITransform } from 'cc';
import { MapView, TILE } from './MapView';
import { GameManager, GameState } from '../core/GameManager';
import { EventBus, GEvent } from '../core/EventBus';
import { DialogueData } from '../data/DialogueData';

const { ccclass } = _decorator;

type Dir = 'up' | 'down' | 'left' | 'right';

const DIR_VEC: Record<Dir, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
};

/**
 * 主角:网格移动 / 碰撞 / 与 NPC 交互 / 传送与遇敌触发
 * 像素小人由 Graphics 绘制(两帧走路动画)
 */
@ccclass('PlayerController')
export class PlayerController extends Component {
    gx = 0;
    gy = 0;
    facing: Dir = 'down';
    moving = false;
    sprinting = sys.isMobile;  // 移动端默认冲刺(无Shift键)
    private holdDir: Dir | null = null;
    private gfx: Graphics;
    private texSprite: Sprite | null = null;   // 主角贴图(加载成功后隐藏 Graphics 绘制)
    private animT = 0;
    private lastFrame = -1;
    private mapView: MapView;
    /** 遇敌冷却:至少走这么多步才可能触发随机遇敌 */
    private stepsSinceEncounter = 0;
    private static readonly MIN_STEPS = 5;

    setMapView(map: MapView): void {
        this.mapView = map;
    }

    /** 放置到指定格(传送/读档) */
    placeAt(gx: number, gy: number, facing: Dir = 'down'): void {
        this.gx = gx;
        this.gy = gy;
        this.facing = facing;
        this.moving = false;
        this.stepsSinceEncounter = 0;  // 切图重置冷却
        this.node.setPosition(this.mapView.gridToPos(gx, gy));
        this.paintPlayer();
    }

    setHold(dir: Dir): void {
        this.holdDir = dir;
    }

    clearHold(dir: Dir): void {
        if (this.holdDir === dir) this.holdDir = null;
    }

    setSprint(on: boolean): void {
        this.sprinting = on;
    }

    /** 交互:面向格的 NPC */
    pressInteract(): void {
        if (this.moving) return;
        const vec = DIR_VEC[this.facing];
        const tx = this.gx + vec.dx;
        const ty = this.gy + vec.dy;
        const npc = this.mapView.mapDef.npcs.find(n => n.x === tx && n.y === ty);
        if (npc) {
            const gm = GameManager.inst;
            const nodeId = DialogueData.getNpcEntry(npc.dialogue);
            if (!nodeId) return;   // 对话入口缺失:不切 DIALOG 态,避免卡死
            gm.setState(GameState.DIALOG);
            EventBus.emit('ui:showDialogue', nodeId);
        }
    }

    tick(dt: number): void {
        const gm = GameManager.inst;
        if (gm.state !== GameState.EXPLORE) return;
        if (!this.moving && this.holdDir) {
            this.tryMove(this.holdDir);
        }
        // 走路动画
        this.animT += dt * (this.sprinting ? 2 : 1);
        const frame = this.moving ? Math.floor(this.animT * 8) % 2 : 0;
        if (frame !== this.lastFrame) {
            this.lastFrame = frame;
            this.paintPlayer();
        }
    }

    private tryMove(dir: Dir): void {
        const vec = DIR_VEC[dir];
        const tx = this.gx + vec.dx;
        const ty = this.gy + vec.dy;
        if (!this.mapView.isWalkable(tx, ty)) {
            // 撞墙:转向
            if (this.facing !== dir) {
                this.facing = dir;
                this.paintPlayer();
            }
            return;
        }
        this.facing = dir;
        this.moving = true;
        const to = this.mapView.gridToPos(tx, ty);
        const dur = this.sprinting ? 0.08 : 0.16;
        tween(this.node)
            .to(dur, { position: to }, { easing: 'linear' })
            .call(() => {
                this.moving = false;
                this.gx = tx;
                this.gy = ty;
                this.onStepDone();
            })
            .start();
        this.paintPlayer();
    }

    /** 落步结算:传送 / 固定遇敌 / 随机遇敌 / 存档点 */
    private onStepDone(): void {
        const gm = GameManager.inst;
        // 记录出生点
        gm.spawnX = this.gx;
        gm.spawnY = this.gy;

        // 1. 传送
        const portal = this.mapView.mapDef.portals.find(p => p.x === this.gx && p.y === this.gy);
        if (portal) {
            EventBus.emit('map:teleport', portal.mapId, portal.tx, portal.ty, portal.dir);
            return;
        }

        // 2. 固定遇敌
        const enc = this.mapView.mapDef.encounters.find(e => e.x === this.gx && e.y === this.gy);
        const encKey = `${this.mapView.mapDef.id}_${this.gx}_${this.gy}`;
        if (enc && !gm.hasFlag('enc!' + encKey)) {
            if (enc.flagKey && !gm.hasFlag(enc.flagKey)) return;
            // 注意:不再在此写入 enc!flag。战斗胜利后才标记(见 BattleManager.endBattle),
            // 战败不会导致穷奇/应龙这类 BOSS 永久消失、剧情卡死。
            EventBus.emit('battle:startFixed', enc);
            return;
        }

        // 3. 随机遇敌(带步数冷却)
        this.stepsSinceEncounter++;
        const map = this.mapView.mapDef;
        if (map.encounterRate > 0 && this.stepsSinceEncounter >= PlayerController.MIN_STEPS && Math.random() < map.encounterRate) {
            this.stepsSinceEncounter = 0;
            const beastId = map.pool[Math.floor(Math.random() * map.pool.length)];
            const count = Math.random() < 0.3 ? 2 : 1;   // 30% 概率两只
            const beasts = [beastId];
            if (count === 2) beasts.push(map.pool[Math.floor(Math.random() * map.pool.length)]);
            EventBus.emit('battle:startRandom', beasts, map.bgTex);
            return;
        }

        EventBus.emit(GEvent.PLAYER_MOVED, this.gx, this.gy);
    }

    /** 像素小人绘制(2 帧走路);贴图就绪则只维护朝向/踏步 */
    private paintPlayer(): void {
        if (this.texSprite && this.texSprite.isValid) {
            const step = (this.moving && Math.floor(this.animT * 8) % 2 === 1) ? 1 : 0;
            const stepY = this.moving ? (step ? 2 : -2) : 0;
            this.texSprite.node.setScale(this.facing === 'left' ? -1 : 1, 1, 1);
            this.texSprite.node.setPosition(0, stepY, 0);
            return;
        }
        const g = this.gfx;
        if (!g || !g.isValid) return;
        g.clear();
        const step = (this.moving && Math.floor(this.animT * 8) % 2 === 1) ? 1 : 0;
        const stepY = this.moving ? (step ? 2 : -2) : 0;

        // 头发
        g.fillColor = new Color(34, 26, 22, 255);
        if (this.facing === 'down') {
            g.rect(-7, 6, 14, 5);
            g.rect(-7, 6 + stepY, 14, 2);
        } else if (this.facing === 'up') {
            g.rect(-7, 6, 14, 6);
            g.rect(-8, 9, 4, 4);
            g.rect(4, 9, 4, 4);
        } else {
            g.rect(-7, 6, 14, 5);
            g.rect(this.facing === 'left' ? -8 : 4, 7, 4, 4);
        }
        g.fill();
        // 脸
        g.fillColor = new Color(240, 216, 178, 255);
        g.rect(-5, 1 + stepY, 10, 6);
        g.fill();
        if (this.facing !== 'up') {
            g.fillColor = new Color(30, 24, 20, 255);
            g.rect(this.facing === 'left' ? -4 : 1, 3 + stepY, 3, 3);
            g.fill();
        }
        // 身体(青衫)
        g.fillColor = new Color(52, 96, 128, 255);
        g.rect(-6, -12 + stepY, 12, 13);
        g.fill();
        // 腰带
        g.fillColor = new Color(140, 106, 44, 255);
        g.rect(-6, -6 + stepY, 12, 2);
        g.fill();
        // 腿
        g.fillColor = new Color(66, 52, 40, 255);
        if (this.moving) {
            g.rect(-6, -12 + (step ? 0 : 1), 5, 6);
            g.rect(1, -12 + (step ? 1 : 0), 5, 6);
        } else {
            g.rect(-6, -12, 5, 6);
            g.rect(1, -12, 5, 6);
        }
        g.fill();
        // 侧脸耳朵
        if (this.facing === 'left' || this.facing === 'right') {
            g.fillColor = new Color(240, 216, 178, 255);
            g.rect(this.facing === 'left' ? -7 : 5, 3 + stepY, 2, 2);
            g.fill();
        }
    }

    onLoad(): void {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        this.gfx = g;
        // 主角贴图:加载成功则替代程序化绘制(失败保留 Graphics 小人为 fallback)
        const texNode = new Node('tex');
        texNode.layer = this.node.layer;
        texNode.addComponent(UITransform).setContentSize(44, 44);
        this.node.addChild(texNode);
        const sp = texNode.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.trim = false;
        resources.load('textures/player/axuan/spriteFrame', SpriteFrame, (err, sf) => {
            if (!err && sf && texNode.isValid) {
                sp.spriteFrame = sf;
                this.texSprite = sp;
                this.gfx.enabled = false;
            } else {
                texNode.destroy();
            }
        });
    }
}
