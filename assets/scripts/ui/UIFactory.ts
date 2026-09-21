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
    /** 九宫格边框(素材像素):panel 素材实测装饰边框约 40px(930x426,深色花纹框+纯色芯)；
     *  panel 实际使用会按自身尺寸动态收缩,避免过矮面板(如名字框 32px)内容区为负 */
    private static readonly PANEL_INSET = 40;
    /** 按钮素材恢复时使用的九宫格边框(需配合边框≤20px 的合格素材,否则小按钮内容区为负) */
    private static readonly BUTTON_INSET = 30;
    /** 按钮是否使用"清新国风"素材:当前 button.png(890x510)是整幅大图,中心有图案、
     *  边缘渐变带超 100px,而按钮目标高仅 36~48px,SLICED 拉伸必然变形(内容区为负/图案压扁)。
     *  暂回退 Graphics 兜底绘制,待有合格九宫格按钮素材(边框≤20px、中心均匀)再恢复。 */
    private static readonly BUTTON_USE_TEXTURE = false;

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

    /**
     * 给节点挂 Sprite（九宫格拉伸模式，适配不同尺寸面板）
     * 注意:meta 里的九宫格 border 不会写入 sprite-frame 子资产(运行时读不到),
     * 必须在代码层设置 inset,SLICED 才真正生效、面板/按钮拉伸不变形。
     */
    static setSprite(node: Node, sf: SpriteFrame, w: number, h: number, inset = 0): void {
        if (inset > 0) {
            sf.insetTop = sf.insetBottom = inset;
            sf.insetLeft = sf.insetRight = inset;
        }
        // 素材异步加载窗口期内节点可能已被兜底 Graphics 画过,素材生效后移除,避免同节点双层绘制
        const oldG = node.getComponent(Graphics);
        if (oldG) node.removeComponent(oldG);
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
        // 素材边框 ~40px,过矮面板(名字框 32px/图鉴条目 96px)内容区会被挤没,回退 Graphics
        const useImage = opts.useImage !== false && Math.min(w, h) >= 100;
        if (useImage) {
            UIFactory.loadSF('ui/panel', (sf) => {
                if (sf && node.isValid) {
                    // 小面板按尺寸收缩 inset,保证内容区不为负
                    const cap = Math.max(6, Math.floor(Math.min(w, h) / 2) - 4);
                    const inset = Math.min(UIFactory.PANEL_INSET, cap);
                    UIFactory.setSprite(node, sf, w, h, inset);
                    // 素材中心是浅色纸面:内衬子节点叠加深蓝圆角(Sprite 与 Graphics 同节点互斥,
                    // 必须挂子节点),保证米白文字可读、拉伸区不外露;排到兄弟最前避免盖住文字
                    const inner = new Node('inner');
                    inner.layer = node.layer;
                    inner.addComponent(UITransform);
                    node.addChild(inner);
                    inner.setSiblingIndex(0);
                    const g = inner.addComponent(Graphics);
                    g.clear();
                    g.fillColor = new Color(8, 10, 24, 205);
                    g.roundRect(-w / 2 + inset + 2, -h / 2 + inset + 2, w - 2 * (inset + 2), h - 2 * (inset + 2), 8);
                    g.fill();
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
            if (UIFactory.BUTTON_USE_TEXTURE && sf && node.isValid) {
                UIFactory.setSprite(node, sf, w, h, UIFactory.BUTTON_INSET);
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

    /**
     * 安全刷新按钮选中态(战斗/对话选项高亮的统一入口)。
     * 素材按钮只挂 Sprite 没有 Graphics,直接 getComponent(Graphics) 得到 null
     * 再调 paintButton 会抛异常(战斗初始化回滚 → 战斗永远起不来)。
     * - 素材模式:在按钮下叠加 'hl' 子节点画金色描边+三角指示;
     * - 兜底模式:重绘 Graphics 原样式。
     */
    static paintButtonState(btn: Node, w: number, h: number, selected: boolean): void {
        if (btn.getComponent(Sprite)) {
            let hl = btn.getChildByName('hl');
            if (!hl) {
                hl = new Node('hl');
                hl.layer = btn.layer;
                hl.addComponent(UITransform);
                btn.addChild(hl);
            }
            const g = hl.getComponent(Graphics) ?? hl.addComponent(Graphics);
            g.clear();
            if (!selected) return;
            g.lineWidth = 3;
            g.strokeColor = new Color(255, 230, 120, 255);
            g.roundRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 6);
            g.stroke();
            g.fillColor = new Color(255, 230, 120, 255);
            g.moveTo(-w / 2 + 8, 3);
            g.lineTo(-w / 2 + 14, 0);
            g.lineTo(-w / 2 + 8, -3);
            g.close();
            g.fill();
        } else {
            const g = btn.getComponent(Graphics) ?? btn.addComponent(Graphics);
            UIFactory.paintButton(g, w, h, selected);
        }
    }
}