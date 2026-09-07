import { _decorator, Color, Component, Graphics, Node, tween, UITransform, Vec3, resources, Sprite, SpriteFrame, UIOpacity } from 'cc';
import { MapDef, NpcDef } from '../core/GameData';
import { MapsData } from '../data/MapsData';
import { UIFactory } from '../ui/UIFactory';
import { GameManager } from '../core/GameManager';

const { ccclass } = _decorator;

export const TILE = 32;

/** 相机放在 Z=1000 处俯视 Z=0 的世界/UI(近裁面 1、远裁面 2000 内) */
export const CAMERA_Z = 1000;

/**
 * 地图视图:程序化绘制瓦片地图(像素风),管理 NPC 节点与摄像机跟随
 * 坐标:grid (gx, gy) 左上为原点;世界像素:地图中心 (0,0)
 */
@ccclass('MapView')
export class MapView extends Component {
    mapDef: MapDef;
    playerNode: Node;
    cameraNode: Node;

    private gGround: Graphics;
    private npcNodes: Node[] = [];
    private portalNodes: Node[] = [];
    private bossNodes: Node[] = [];

    // —— 瓦片色板(FC 复古色)——
    private static COLORS: Record<string, Color[]> = {
        '0': [new Color(74, 138, 60, 255), new Color(66, 128, 54, 255), new Color(58, 118, 48, 255)],  // 草地
        '1': [new Color(207, 167, 90, 255), new Color(196, 156, 80, 255), new Color(184, 144, 70, 255)], // 路
        '2': [new Color(47, 111, 174, 255), new Color(41, 102, 162, 255), new Color(36, 92, 148, 255)],  // 水
        '3': [new Color(117, 96, 63, 255), new Color(108, 88, 57, 255), new Color(99, 80, 51, 255)],    // 山
        '4': [new Color(176, 129, 80, 255), new Color(166, 120, 72, 255), new Color(156, 112, 66, 255)], // 木地板
        '5': [new Color(154, 122, 88, 255), new Color(144, 114, 80, 255), new Color(133, 104, 72, 255)], // 墙
        '6': [new Color(138, 90, 46, 255), new Color(126, 82, 40, 255), new Color(116, 74, 35, 255)],    // 门
        '7': [new Color(137, 129, 115, 255)],                                                            // 井
        '8': [new Color(74, 138, 60, 255)],                                                              // 树(底为草地)
        '9': [new Color(176, 136, 72, 255), new Color(164, 126, 64, 255)],                               // 桥
        'A': [new Color(90, 74, 58, 255), new Color(82, 66, 51, 255), new Color(74, 59, 45, 255)],      // 洞地
        'B': [new Color(36, 31, 26, 255)],                                                               // 洞口
        'C': [new Color(194, 162, 92, 255), new Color(182, 151, 82, 255)],                               // 祠堂地
        'D': [new Color(143, 90, 60, 255)],                                                              // 床
        'E': [new Color(74, 138, 60, 255)],                                                              // 花(底为草地)
        'F': [new Color(138, 66, 56, 255), new Color(126, 60, 50, 255)],                                 // 屋顶/石台
    };

    /** 简单确定性哈希,保证每次绘制一致 */
    private static hash(x: number, y: number): number {
        let h = x * 374761393 + y * 668265263;
        h = (h ^ (h >> 13)) * 1274126177;
        return Math.abs(h ^ (h >> 16)) % 1000;
    }

    /** grid → 世界像素坐标 */
    gridToPos(gx: number, gy: number): Vec3 {
        const map = this.mapDef;
        return new Vec3(
            (gx + 0.5 - map.cols / 2) * TILE,
            (map.rows / 2 - (gy + 0.5)) * TILE,
            0,
        );
    }

    isWalkable(gx: number, gy: number): boolean {
        const map = this.mapDef;
        if (gx < 0 || gy < 0 || gx >= map.cols || gy >= map.rows) return false;
        const ch = map.ground[gy][gx];
        if ('25F387D'.includes(ch)) return false;  // 水/墙/屋顶/山/树/井/床 阻挡
        // NPC 占位阻挡:人物不能重叠
        if (map.npcs.some(n => n.x === gx && n.y === gy)) return false;
        return true;
    }

    /** 生在玩家脚下的触发格(6门 B洞口 仅用作景观,传送由 portal 定义) */
    private getTrigger(gx: number, gy: number): string {
        const map = this.mapDef;
        if (gx < 0 || gy < 0 || gx >= map.cols || gy >= map.rows) return '';
        return map.ground[gy][gx];
    }

    /** 构建地图 */
    build(mapId: string): void {
        const map = MapsData.get(mapId);
        this.mapDef = map;

        // 清理旧 NPC、传送门和 BOSS 标记
        for (const n of this.npcNodes) n.destroy();
        this.npcNodes = [];
        for (const n of this.portalNodes) n.destroy();
        this.portalNodes = [];
        for (const n of this.bossNodes) n.destroy();
        this.bossNodes = [];

        this.gGround.clear();
        this.paintGround();
        this.spawnPortals();
        this.spawnBossMarkers();
        this.spawnNpcs();
    }

    private paintGround(): void {
        const g = this.gGround;
        const map = this.mapDef;
        for (let gy = 0; gy < map.rows; gy++) {
            for (let gx = 0; gx < map.cols; gx++) {
                const ch = map.ground[gy][gx];
                const px = (gx - map.cols / 2) * TILE;
                const py = (map.rows / 2 - gy - 1) * TILE;
                const h = MapView.hash(gx, gy);
                const colors = MapView.COLORS[ch];
                let base: Color = colors ? colors[h % colors.length] : new Color(200, 60, 200, 255);

                if (ch === '8' || ch === 'E') {
                    // 树/花:先画草地
                    const grass = MapView.COLORS['0'];
                    g.fillColor = grass[h % grass.length];
                    g.rect(px, py, TILE, TILE);
                    g.fill();
                    if (ch === '8') {
                        // 树干+树冠
                        g.fillColor = new Color(96, 62, 34, 255);
                        g.rect(px + 13, py + 6, 6, 12);
                        g.fill();
                        g.fillColor = h % 2 ? new Color(36, 106, 48, 255) : new Color(44, 118, 56, 255);
                        g.rect(px + 5, py + 14, 22, 12);
                        g.fill();
                        g.fillColor = new Color(56, 136, 66, 255);
                        g.rect(px + 8, py + 17, 16, 6);
                        g.fill();
                    } else {
                        // 小花
                        const flower = [new Color(240, 220, 90, 255), new Color(240, 120, 120, 255), new Color(230, 230, 240, 255)][h % 3];
                        g.fillColor = flower;
                        const fx = px + 8 + (h % 2) * 14;
                        const fy = py + 6 + ((h >> 1) % 2) * 14;
                        g.rect(fx, fy, 4, 4);
                        g.rect(fx - 3, fy + 2, 10, 2);
                        g.rect(fx + 2, fy - 3, 2, 10);
                        g.fill();
                    }
                    continue;
                }

                // 常规:底部色块
                g.fillColor = base;
                g.rect(px, py, TILE, TILE);
                g.fill();

                switch (ch) {
                    case '0': { // 草地纹理点
                        g.fillColor = new Color(56, 118, 48, 255);
                        const dx = px + 4 + (h % 5) * 5;
                        const dy = py + 4 + ((h >> 2) % 5) * 5;
                        g.rect(dx, dy, 3, 2);
                        if (h % 3 === 0) g.rect(px + 20, py + 18, 3, 2);
                        g.fill();
                        break;
                    }
                    case '2': { // 水波纹
                        g.fillColor = new Color(110, 170, 215, 255);
                        g.rect(px + 6 + (h % 3) * 8, py + 8, 14, 2);
                        g.rect(px + 4 + ((h + 1) % 3) * 8, py + 20, 10, 2);
                        g.fill();
                        break;
                    }
                    case '3': { // 山:顶部亮棱
                        g.fillColor = new Color(154, 132, 96, 255);
                        g.rect(px, py + TILE - 6, TILE, 6);
                        g.fill();
                        break;
                    }
                    case '4': { // 木地板横缝
                        g.fillColor = new Color(146, 103, 58, 255);
                        g.rect(px, py + 14, TILE, 2);
                        g.fill();
                        break;
                    }
                    case '5': case 'F': { // 墙/屋顶结构线
                        g.fillColor = new Color(90, 66, 44, 255);
                        g.rect(px, py + TILE / 2 - 1, TILE, 2);
                        if (ch === '5') g.rect(px + TILE / 2 - 1, py, 2, TILE);
                        g.fill();
                        break;
                    }
                    case '7': { // 井口
                        g.fillColor = new Color(58, 52, 44, 255);
                        g.rect(px + 8, py + 8, TILE - 16, TILE - 16);
                        g.fill();
                        g.fillColor = new Color(174, 166, 148, 255);
                        g.rect(px + 6, py + 6, TILE - 12, 2);
                        g.fill();
                        break;
                    }
                    case '9': { // 桥板条
                        g.fillColor = new Color(128, 94, 46, 255);
                        for (let i = 0; i < 3; i++) g.rect(px + 2, py + 4 + i * 9, TILE - 4, 3);
                        g.fill();
                        break;
                    }
                    case 'A': { // 洞地碎石
                        g.fillColor = new Color(64, 52, 40, 255);
                        g.rect(px + 6 + (h % 3) * 8, py + 6 + ((h >> 1) % 3) * 8, 4, 4);
                        g.fill();
                        break;
                    }
                    case 'B': { // 洞口:石沿
                        g.fillColor = new Color(106, 98, 90, 255);
                        g.rect(px, py + TILE - 8, TILE, 8);
                        g.fill();
                        break;
                    }
                    case 'D': { // 床:被褥+枕
                        g.fillColor = new Color(226, 213, 176, 255);
                        g.rect(px + 4, py + 4, 12, 12);
                        g.fill();
                        g.fillColor = new Color(186, 100, 70, 255);
                        g.rect(px + 6, py + 18, TILE - 12, 10);
                        g.fill();
                        break;
                    }
                }
            }
        }
    }

    /** 传送门视觉:发光圆环 + 箭头 + 呼吸动画 */
    private spawnPortals(): void {
        const map = this.mapDef;
        for (const portal of map.portals) {
            const node = new Node(`portal_${portal.x}_${portal.y}`);
            node.layer = this.node.layer;
            node.addComponent(UITransform).setContentSize(TILE, TILE);
            node.setPosition(this.gridToPos(portal.x, portal.y));
            this.node.addChild(node);
            this.portalNodes.push(node);

            const g = node.addComponent(Graphics);
            const destMap = MapsData.get(portal.mapId);
            const destName = destMap ? destMap.name : '';

            // 外层光晕(淡蓝/淡紫透明圆)
            g.fillColor = new Color(80, 160, 255, 60);
            g.circle(0, 0, 15);
            g.fill();

            // 中层光环
            g.strokeColor = new Color(100, 200, 255, 200);
            g.lineWidth = 2;
            g.circle(0, 0, 11);
            g.stroke();

            // 内层光核
            g.fillColor = new Color(160, 220, 255, 180);
            g.circle(0, 0, 5);
            g.fill();

            // 方向箭头(指向传送方向)
            g.fillColor = new Color(255, 255, 200, 230);
            const dir = portal.dir || 'up';
            const ay = dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
            const ax = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
            g.moveTo(ax * 6 - ay * 4, ay * 6 - ax * 4);
            g.lineTo(ax * 6 + ay * 4, ay * 6 + ax * 4);
            g.lineTo(ax * 12, ay * 12);
            g.close();
            g.fill();

            // 目标地名标签
            if (destName) {
                UIFactory.label(node, `→${destName}`, 10, new Vec3(0, -22), new Color(180, 220, 255, 220), { outline: true });
            }

            // 呼吸动画:透明度循环
            const opacity = node.addComponent(UIOpacity);
            opacity.opacity = 220;
            tween(opacity)
                .to(1.2, { opacity: 120 })
                .to(1.2, { opacity: 220 })
                .union()
                .repeatForever()
                .start();
        }
    }

    /** BOSS 标记:固定遇敌点显示醒目警告标识（已击败则不显示） */
    private spawnBossMarkers(): void {
        const map = this.mapDef;
        const gm = GameManager.inst;
        for (const enc of map.encounters) {
            // 已触发过的固定遇敌不再显示
            const encKey = `enc!${map.id}_${enc.x}_${enc.y}`;
            if (gm && gm.hasFlag(encKey)) continue;

            const node = new Node(`boss_${enc.x}_${enc.y}`);
            node.layer = this.node.layer;
            node.addComponent(UITransform).setContentSize(TILE, TILE);
            node.setPosition(this.gridToPos(enc.x, enc.y));
            this.node.addChild(node);
            this.bossNodes.push(node);

            const g = node.addComponent(Graphics);

            // 红色警告光环
            g.fillColor = new Color(200, 50, 40, 50);
            g.circle(0, 0, 14);
            g.fill();

            g.strokeColor = new Color(255, 80, 60, 200);
            g.lineWidth = 2;
            g.circle(0, 0, 12);
            g.stroke();

            // 中心“！”警告符号
            g.fillColor = new Color(255, 240, 100, 240);
            g.rect(-2, -2, 4, 12);  // 竖线
            g.rect(-2, -7, 4, 4);   // 下点
            g.fill();

            // 呼吸动画
            const opacity = node.addComponent(UIOpacity);
            opacity.opacity = 230;
            tween(opacity)
                .to(0.8, { opacity: 100 })
                .to(0.8, { opacity: 230 })
                .union()
                .repeatForever()
                .start();
        }
    }

    private spawnNpcs(): void {
        const map = this.mapDef;
        for (const def of map.npcs) this.spawnNpc(def);
    }

    private spawnNpc(def: NpcDef): void {
        const node = new Node(`npc_${def.id}`);
        node.layer = this.node.layer;
        node.addComponent(UITransform).setContentSize(TILE, TILE);
        node.setPosition(this.gridToPos(def.x, def.y));
        this.node.addChild(node);
        this.npcNodes.push(node);

        if (def.tex) {
            // 有立绘的 NPC(九尾狐):加载贴图
            const sprite = node.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.trim = false;
            resources.load(`textures/${def.tex}/spriteFrame`, SpriteFrame, (err, sf) => {
                if (!err && node.isValid) {
                    sprite.spriteFrame = sf;
                    node.getComponent(UITransform)!.setContentSize(56, 44);
                } else {
                    this.paintSimpleNpc(node, def);
                }
            });
        } else {
            this.paintSimpleNpc(node, def);
        }
        // 名字
        UIFactory.label(node, def.name, 12, new Vec3(0, 30), new Color(255, 245, 210, 255), { outline: true });
    }

    /** 简易像素小人(占位 / 普通村民) */
    private paintSimpleNpc(node: Node, def: NpcDef): void {
        const g = node.addComponent(Graphics);
        const h = MapView.hash(def.x, def.y);
        const cloth = [new Color(158, 70, 62, 255), new Color(90, 110, 150, 255), new Color(120, 96, 58, 255)][h % 3];
        // 头
        g.fillColor = new Color(240, 220, 185, 255);
        g.rect(-6, 4, 12, 8);
        g.fill();
        // 发
        g.fillColor = def.id === 'elder' ? new Color(225, 225, 225, 255) : new Color(40, 32, 28, 255);
        g.rect(-6, 9, 12, 4);
        g.fill();
        // 身
        g.fillColor = cloth;
        g.rect(-7, -12, 14, 16);
        g.fill();
    }

    /** 居中跟随玩家,并限制在地图范围内 */
    followCamera(): void {
        const map = this.mapDef;
        const pw = map.cols * TILE;
        const ph = map.rows * TILE;
        const p = this.playerNode.position;
        const viewW = 960;
        const viewH = 600;
        const cx = pw > viewW ? Math.max(-(pw - viewW) / 2, Math.min((pw - viewW) / 2, p.x)) : 0;
        const cy = ph > viewH ? Math.max(-(ph - viewH) / 2, Math.min((ph - viewH) / 2, p.y)) : 0;
        this.cameraNode.setPosition(cx, cy, CAMERA_Z);
    }

    onLoad(): void {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        this.gGround = g;
    }
}