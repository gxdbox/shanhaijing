import {
    _decorator, Camera, Canvas, Color, Component, input, Input, EventKeyboard, KeyCode,
    Layers, Node, UITransform,
} from 'cc';
import { GameManager, GameState } from './GameManager';
import { EventBus, GEvent } from './EventBus';
import { SaveManager } from './SaveManager';
import { MapView, TILE, CAMERA_Z } from '../map/MapView';
import { PlayerController } from '../map/PlayerController';
import { HUD } from '../ui/HUD';
import { DialogueUI } from '../ui/DialogueUI';
import { CodexUI } from '../ui/CodexUI';
import { BattleManager } from '../battle/BattleManager';
import { MapsData } from '../data/MapsData';

const { ccclass } = _decorator;

/**
 * 游戏入口:动态创建 Canvas/双相机与世界、UI 根节点,
 * 接线输入、战斗、对话、存档,驱动整个游戏
 * 场景中只需一个挂此组件的节点
 */
@ccclass('GameRoot')
export class GameRoot extends Component {
    private gm: GameManager;
    private mapView: MapView;
    private player: PlayerController;
    private codex: CodexUI;
    private dialogue: DialogueUI;
    private battle: BattleManager;
    private worldCam: Camera;

    onLoad(): void {
        this.gm = new GameManager();
        GameManager.inst = this.gm;

        this.buildCanvas();
        this.buildWorld();
        this.buildUI();
        this.wireEvents();
        this.focusCanvas();

        // 启动
        const hasSave = SaveManager.hasSave();
        this.gm.start();
        this.buildMap(this.gm.curMapId);
        this.player.placeAt(this.gm.spawnX, this.gm.spawnY);
        this.gm.setState(GameState.EXPLORE);
        if (!hasSave) {
            // 新游戏:开场剧情
            this.dialogue.show('home_intro');
        }
    }

    /** 自动聚焦 canvas,让键盘立即可用(web 端 Cocos 需画布获得焦点)*/
    private focusCanvas(): void {
        const doc = (globalThis as any).document;
        if (!doc) return;
        const canvasEl = doc.getElementById('GameCanvas');
        if (canvasEl) canvasEl.focus();
    }

    update(_dt: number): void {
        if (this.player) this.player.tick(_dt);
        if (this.mapView) this.mapView.followCamera();
    }

    // ==================== 场景结构 ====================

    private buildCanvas(): void {
        const canvasNode = new Node('Canvas');
        canvasNode.layer = Layers.Enum.UI_2D;
        canvasNode.addComponent(UITransform);
        const canvas = canvasNode.addComponent(Canvas);
        this.node.scene.addChild(canvasNode);

        // 世界相机(渲染 DEFAULT 层,跟随玩家)
        const wNode = new Node('WorldCamera');
        wNode.layer = Layers.Enum.UI_2D;
        wNode.setPosition(0, 0, CAMERA_Z);
        canvasNode.addChild(wNode);
        const wCam = wNode.addComponent(Camera);
        wCam.projection = Camera.ProjectionType.ORTHO;
        wCam.priority = 0;
        wCam.visibility = Layers.Enum.DEFAULT;
        wCam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        wCam.clearColor = new Color(12, 14, 24, 255);
        wCam.near = 1;
        wCam.far = 2000;
        wCam.orthoHeight = 300;
        this.worldCam = wCam;

        // UI 相机(渲染 UI_2D 层)
        const uNode = new Node('UICamera');
        uNode.layer = Layers.Enum.UI_2D;
        uNode.setPosition(0, 0, CAMERA_Z);
        canvasNode.addChild(uNode);
        const uCam = uNode.addComponent(Camera);
        uCam.projection = Camera.ProjectionType.ORTHO;
        uCam.priority = 10;
        uCam.visibility = Layers.Enum.UI_2D;
        uCam.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
        uCam.near = 1;
        uCam.far = 2000;
        uCam.orthoHeight = 300;
        canvas.cameraComponent = uCam;
    }

    private buildWorld(): void {
        const worldRoot = new Node('WorldRoot');
        worldRoot.layer = Layers.Enum.DEFAULT;
        worldRoot.addComponent(UITransform);
        this.node.scene.addChild(worldRoot);

        this.mapView = worldRoot.addComponent(MapView);
        this.mapView.cameraNode = this.worldCam.node;

        const playerNode = new Node('Player');
        playerNode.layer = Layers.Enum.DEFAULT;
        playerNode.addComponent(UITransform).setContentSize(TILE, TILE);
        playerNode.setPosition(0, 0);
        worldRoot.addChild(playerNode);
        this.player = playerNode.addComponent(PlayerController);
        this.player.setMapView(this.mapView);
        this.mapView.playerNode = playerNode;
    }

    private buildUI(): void {
        const uiRoot = new Node('UIRoot');
        uiRoot.layer = Layers.Enum.UI_2D;
        uiRoot.addComponent(UITransform).setContentSize(960, 600);
        this.node.scene.addChild(uiRoot);

        const hudNode = new Node('HUD');
        hudNode.layer = Layers.Enum.UI_2D;
        uiRoot.addChild(hudNode);
        hudNode.addComponent(HUD).init(uiRoot);

        const dlgNode = new Node('Dialogue');
        dlgNode.layer = Layers.Enum.UI_2D;
        uiRoot.addChild(dlgNode);
        this.dialogue = dlgNode.addComponent(DialogueUI);
        DialogueUI.inst = this.dialogue;
        this.dialogue.init(uiRoot);

        const battleNode = new Node('Battle');
        battleNode.layer = Layers.Enum.UI_2D;
        uiRoot.addChild(battleNode);
        this.battle = battleNode.addComponent(BattleManager);
        BattleManager.inst = this.battle;
        this.battle.init(uiRoot);

        const codexNode = new Node('Codex');
        codexNode.layer = Layers.Enum.UI_2D;
        uiRoot.addChild(codexNode);
        this.codex = codexNode.addComponent(CodexUI);
        this.codex.init(uiRoot);
    }

    // ==================== 事件与输入 ====================

    private wireEvents(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        EventBus.on('ui:showDialogue', (nodeId: string) => this.dialogue.show(nodeId), this);
        EventBus.on('map:teleport', (mapId: string, x: number, y: number, dir: string) => {
            this.teleportTo(mapId, x, y, (dir as any) || 'down');
        }, this);

        EventBus.on('battle:startFixed', (enc) => {
            this.gm.save();
            this.battle.startBattle(enc.beastIds, this.curBattleBg(), enc);
        }, this);
        EventBus.on('battle:startRandom', (beasts: string[], bgTex: string) => {
            this.gm.save();
            this.battle.startBattle(beasts, bgTex, null);
        }, this);
        EventBus.on('battle:startDialogue', (beasts: string[]) => {
            this.gm.save();
            this.battle.startBattle(beasts, this.curBattleBg(), null);
        }, this);

        EventBus.on('battle:ended', ({ win }: { win: boolean }) => {
            if (this.dialogue.isAwaitingBattle) {
                if (win) this.dialogue.onBattleWin();
                else {
                    this.dialogue.onBattleLose();
                    this.afterDefeat();
                }
            } else {
                if (!win) this.afterDefeat();
                this.gm.setState(GameState.EXPLORE);
            }
        }, this);
    }

    private curBattleBg(): string {
        return MapsData.get(this.gm.curMapId).bgTex || 'battle/field';
    }

    /** 战败:送回家里,全队复活 */
    private afterDefeat(): void {
        this.gm.healAll();
        this.teleportTo('home', 4, 6, 'down');
        this.gm.save();
    }

    private teleportTo(mapId: string, x: number, y: number, dir: 'up' | 'down' | 'left' | 'right'): void {
        this.gm.setState(GameState.TRANSITION);
        this.gm.curMapId = mapId;
        this.gm.spawnX = x;
        this.gm.spawnY = y;
        this.buildMap(mapId);
        this.player.placeAt(x, y, dir);
        this.gm.save();
        this.gm.setState(GameState.EXPLORE);
    }

    private buildMap(mapId: string): void {
        this.mapView.build(mapId);
    }

    // ==================== 键盘 ====================

    private keyToDir(code: KeyCode): 'up' | 'down' | 'left' | 'right' | null {
        switch (code) {
            case KeyCode.ARROW_UP: case KeyCode.KEY_W: return 'up';
            case KeyCode.ARROW_DOWN: case KeyCode.KEY_S: return 'down';
            case KeyCode.ARROW_LEFT: case KeyCode.KEY_A: return 'left';
            case KeyCode.ARROW_RIGHT: case KeyCode.KEY_D: return 'right';
            default: return null;
        }
    }

    private onKeyDown(event: EventKeyboard): void {
        const dir = this.keyToDir(event.keyCode);
        if (dir) {
            this.player.setHold(dir);
            // 转向(即使撞墙也先转身,由 tryMove 处理)
            return;
        }
        const code = event.keyCode;
        const confirm = code === KeyCode.ENTER || code === KeyCode.SPACE || code === KeyCode.KEY_Z;

        if (this.gm.state === GameState.EXPLORE) {
            if (confirm) this.player.pressInteract();
            else if (code === KeyCode.KEY_X) this.codex.toggle();
        } else if (this.gm.state === GameState.MENU) {
            if (code === KeyCode.KEY_X || code === KeyCode.ESCAPE) this.codex.toggle();
        }
    }

    private onKeyUp(event: EventKeyboard): void {
        const dir = this.keyToDir(event.keyCode);
        if (dir) this.player.clearHold(dir);
    }
}