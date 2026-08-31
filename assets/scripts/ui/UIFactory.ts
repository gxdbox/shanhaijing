import { Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';

/**
 * UI 工厂:红白机风格的窗口面板 / 文字
 * 设计分辨率 960x600,原点在屏幕中心
 */
export class UIFactory {
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

    /** 创建 DQ 风格窗口面板(半透明黑底 + 双层白描边) */
    static panel(
        parent: Node,
        x: number, y: number,
        w: number, h: number,
        opts: { fill?: Color; border?: Color; radius?: number } = {},
    ): Node {
        const node = new Node('panel');
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(w, h);
        const g = node.addComponent(Graphics);
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
        node.setPosition(x, y, 0);
        parent.addChild(node);
        return node;
    }

    /** 创建按钮节点(返回 node,内含 label 与 Graphics 底板) */
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
        const g = node.addComponent(Graphics);
        this.paintButton(g, w, h, false);
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