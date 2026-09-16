import { Color, Graphics, Label, Node, resources, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';

/**
 * UI 工厂:红白机风格的窗口面板 / 文字
 * 设计分辨率 960x600,原点在屏幕中心
 *
 * v2 升级：面板/按钮优先加载"清新国风"AI 素材（textures/ui/panel、button），
 * 加载成功用 Sprite 显示（九宫格拉伸），失败自动回退 Graphics 画法（零素材可玩）。
 */
export class UIFactory {
    // 素材缓存：防止重复加载
    private static cache: Record<string, SpriteFrame> = {};

    /** 异步加载 SpriteFrame（带缓存）；失败返回 null */
    static loadSF(path: string, cb: (sf: SpriteFrame | null) => void): void {
        if (UIFactory.cache[path]) { cb(UIFactory.cache[path]); return; }
        resources.load(`textures/${path}/spriteFrame`, SpriteFrame, (err, sf) => {
            if (!err && sf) {
                UIFactory.cache[path] = sf;
                cb(sf);
            } else {
                cb(null);
            }
        });
    }

    /** 给节点挂 Sprite（九宫格拉伸模式，适配不同尺寸面板） */
    static setSprite(node: Node, sf: SpriteFrame, w: number, h: number): void {
        const sp = node.getComponent(Sprite) ?? node.addComponent(Sprite);
        sp.spriteFrame = sf;
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SLICED;   // 九宫格：边框不变形、内部拉伸
        const tf = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        tf.setContentSize(w, h);
    }
    /** 创建文字标签 */
    static label(
        parent: Node,
        text: string,
        size: number,
        pos: Vec3,
        color: Color = new Color(240, 240, 230, 255),
        opts: { bold?: boolean; outline?: boolean; anchorX?: number; anchorY?: number } = {},
    ): Label {
        const node = new Node('label');
        node.layer = parent.layer;
        node.addComponent(UITransform);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = Math.floor(size * 1.35);
        label.color = color;
        label.isBold = !!opts.bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        if (opts.outline) {
            label.enableOutline = true;
            label.outlineColor = new Color(20, 20, 30, 255);
            label.outlineWidth = 2;
        }
        (node.getComponent(UITransform)!).setAnchorPoint(opts.anchorX ?? 0.5, opts.anchorY ?? 0.5);
        node.setPosition(pos);
        parent.addChild(node);
        return label;
    }

    /** 创建 DQ 风格窗口面板：优先加载"清新国风"素材，失败回退 Graphics 画法 */
    static panel(
        parent: Node,
        x: number, y: number,
        w: number, h: number,
        opts: { fill?: Color; border?: Color; radius?: number; useImage?: boolean } = {},
    ): Node {
        const node = new Node('panel');
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(w, h);
        const useImage = opts.useImage !== false;   // 默认尝试用素材
        if (useImage) {
            UIFactory.loadSF('ui/panel', (sf) => {
                if (sf && node.isValid) {
                    UIFactory.setSprite(node, sf, w, h);
                } else {
                    UIFactory.paintPanelGfx(node, w, h, opts);
                }
            });
        } else {
            UIFactory.paintPanelGfx(node, w, h, opts);
        }
        node.setPosition(x, y, 0);
        parent.addChild(node);
        return node;
    }

    /** Graphics 兜底画面板（原 DQ 风格，素材加载失败时用） */
    private static paintPanelGfx(node: Node, w: number, h: number, opts: { fill?: Color; border?: Color; radius?: number }): void {
        const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
        const fill = opts.fill ?? new Color(8, 10, 24, 200);
        const border = opts.border ?? new Color(235, 235, 235, 255);
        const r = opts.radius ?? 8;
        g.fillColor = fill;
        g.roundRect(-w / 2, -h / 2, w, h, r);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = border;
        g.roundRect(-w / 2, -h / 2, w, h, r);
        g.stroke();
        g.lineWidth = 1;
        g.roundRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, r - 3);
        g.stroke();
    }

    /** 创建按钮节点：优先加载"清新国风"素材，失败回退 Graphics 画法 */
    static button(
        parent: Node,
        text: string,
        x: number, y: number,
        w: number, h: number,
        size: number = 18,
    ): Node {
        const node = new Node('btn');
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(w, h);
        UIFactory.loadSF('ui/button', (sf) => {
            if (sf && node.isValid) {
                UIFactory.setSprite(node, sf, w, h);
            } else {
                const g = node.getComponent(Graphics) ?? node.addComponent(Graphics);
                this.paintButton(g, w, h, false);
            }
        });
        this.label(node, text, size, new Vec3(0, 0), new Color(230, 230, 220, 255), { outline: true });
        node.setPosition(x, y, 0);
        parent.addChild(node);
        return node;
    }

    static paintButton(g: Graphics, w: number, h: number, selected: boolean): void {
        g.clear();
        // 底
        g.fillColor = selected ? new Color(30, 90, 150, 255) : new Color(20, 24, 46, 235);
        g.roundRect(-w / 2, -h / 2, w, h, 6);
        g.fill();
        // 框
        g.lineWidth = selected ? 3 : 2;
        g.strokeColor = selected ? new Color(255, 230, 120, 255) : new Color(160, 170, 200, 255);
        g.roundRect(-w / 2, -h / 2, w, h, 6);
        g.stroke();
        if (selected) {
            // 三角指示
            g.fillColor = new Color(255, 230, 120, 255);
            g.moveTo(-w / 2 + 8, 3);
            g.lineTo(-w / 2 + 14, 0);
            g.lineTo(-w / 2 + 8, -3);
            g.close();
            g.fill();
        }
    }
}