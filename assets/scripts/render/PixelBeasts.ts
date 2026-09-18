import { Color, Graphics } from 'cc';

/**
 * 程序化像素风立绘:16-bit 风格块状绘制山海经异兽与战斗背景
 * (美术替代方案:也可将 AI 生成的同风格 PNG 放入 resources/textures/ 同名路径,代码会自动改用贴图)
 *
 * 坐标说明:绘制区域以 (0,0) 为中心,u 为基础格边长
 */
export class PixelBeasts {
    static draw(g: Graphics, beastId: string, size: number): void {
        const u = size / 24;
        g.clear();
        switch (beastId) {
            case 'zhi': this.drawZhi(g, u); break;
            case 'xuangui': this.drawXuangui(g, u); break;
            case 'huanshu': this.drawHuanshu(g, u); break;
            case 'jiuwei': this.drawJiuwei(g, u); break;
            case 'yinglong': this.drawYinglong(g, u); break;
            case 'qiongqi': this.drawQiongqi(g, u); break;
            default: this.drawGeneric(g, u); break;   // 新异兽立绘加载完成前的通用剪影,避免"隐身"
        }
        g.fill();
    }

    /** 通用异兽剪影(无专属画法时的占位) */
    private static drawGeneric(g: Graphics, u: number): void {
        // 身体
        g.fillColor = new Color(96, 76, 60, 255);
        g.rect(-9 * u, -12 * u, 18 * u, 16 * u);
        g.fill();
        // 头
        g.fillColor = new Color(120, 96, 74, 255);
        g.rect(-6 * u, 2 * u, 13 * u, 10 * u);
        g.fill();
        // 眼
        g.fillColor = new Color(255, 230, 120, 255);
        g.rect(-3 * u, 6 * u, 3 * u, 3 * u);
        g.rect(3 * u, 6 * u, 3 * u, 3 * u);
        g.fill();
        // 脚
        g.fillColor = new Color(70, 56, 44, 255);
        g.rect(-8 * u, -15 * u, 5 * u, 3 * u);
        g.rect(3 * u, -15 * u, 5 * u, 3 * u);
        g.fill();
    }

    private static r(g: Graphics, x: number, y: number, w: number, h: number, c: number, u: number): void {
        g.fillColor = new Color(c >> 16 & 255, c >> 8 & 255, c & 255, 255);
        g.rect(x * u, y * u, w * u, h * u);
    }

    // —— 彘:虎身牛尾,獠牙 ——
    private static drawZhi(g: Graphics, u: number): void {
        const o = 0xd8762a, l = 0xf0a050, s = 0x7a3b12, r = 0xd83830, w = 0xf0e8e0;
        this.r(g, -9, -8, 18, 16, o, u);                 // 头
        this.r(g, -9, 5, 18, 4, 0xb06020, u);            // 下颚阴影
        this.r(g, -11, -6, 3, 7, s, u);                  // 左耳
        this.r(g, 8, -6, 3, 7, s, u);                    // 右耳
        this.r(g, -5, -8, 2, 4, s, u); this.r(g, -1, -8, 2, 4, s, u); this.r(g, 3, -8, 2, 4, s, u); // 虎纹
        this.r(g, -7, -3, 4, 4, w, u); this.r(g, 3, -3, 4, 4, w, u);  // 眼白
        this.r(g, -6, -2, 2, 2, r, u); this.r(g, 4, -2, 2, 2, r, u);  // 瞳
        this.r(g, -4, 0, 8, 6, l, u);                    // 吻部
        this.r(g, -4, 0, 2, 3, s, u); this.r(g, 2, 0, 2, 3, s, u);    // 鼻纹
        this.r(g, -3, 4, 2, 3, w, u); this.r(g, 1, 4, 2, 3, w, u);    // 獠牙
        this.r(g, 9, 6, 8, 2, s, u); this.r(g, 13, 2, 2, 5, s, u);    // 牛尾卷
        this.r(g, 15, 4, 3, 2, 0x8a5a2a, u);
    }

    // —— 旋龟:龟身鸟首蛇尾 ——
    private static drawXuangui(g: Graphics, u: number): void {
        const sh = 0x2f6f4f, shl = 0x3f8f64, yl = 0xb0a048, hd = 0x7a93a8, rd = 0x8a3a30;
        this.r(g, -9, -4, 18, 12, sh, u);                 // 壳
        this.r(g, -7, -6, 3, 3, sh, u); this.r(g, 4, -6, 3, 3, sh, u);  // 壳缘
        this.r(g, -6, -2, 12, 8, shl, u);                 // 壳面
        this.r(g, -6, 2, 12, 2, yl, u); this.r(g, -2, -5, 2, 12, yl, u); // 壳纹
        this.r(g, -6, -14, 8, 8, hd, u);                  // 鸟首
        this.r(g, -9, -16, 4, 3, 0x8fadc4, u); this.r(g, -12, -14, 3, 3, 0x6a8096, u);  // 尖喙
        this.r(g, -4, -12, 2, 2, 0x10141a, u); this.r(g, 1, -12, 2, 2, 0x10141a, u);    // 眼
        this.r(g, 9, 8, 10, 2, rd, u); this.r(g, 15, 4, 2, 5, rd, u); this.r(g, 17, 6, 3, 3, 0x5a2418, u); // 蛇尾
        this.r(g, -12, 4, 2, 2, 0x5aaada, u); this.r(g, 10, 8, 2, 2, 0x5aaada, u);       // 水珠
    }

    // —— 䑏疏:独角马 ——
    private static drawHuanshu(g: Graphics, u: number): void {
        const f = 0xe8d8b8, m = 0x8a5a36, gd = 0xd8b832;
        this.r(g, -7, -10, 14, 16, f, u);                 // 脸
        this.r(g, -7, 3, 14, 4, 0xd0b898, u);             // 吻部
        this.r(g, -9, -12, 3, 7, m, u); this.r(g, 6, -12, 3, 7, m, u);  // 耳
        this.r(g, -5, -6, 3, 3, 0x181418, u); this.r(g, 2, -6, 3, 3, 0x181418, u);      // 眼
        this.r(g, -2, -14, 4, 8, gd, u); this.r(g, -3, -18, 2, 5, gd, u); // 独(金)角
        this.r(g, -5, -2, 2, 3, 0xa06a3a, u); this.r(g, 3, -2, 2, 3, 0xa06a3a, u);      // 鼻孔
        this.r(g, -7, 6, 14, 3, 0xb8905a, u);             // 鬃毛(颈)
        this.r(g, -6, -12, 1, 3, f, u); this.r(g, 5, -12, 1, 3, f, u);                  // 耳内
    }

    // —— 九尾狐:青丘灵气 ——
    private static drawJiuwei(g: Graphics, u: number): void {
        const f = 0xf4f4ec, e = 0x48c8e8, fr = 0x78b8e8;
        // 九尾(扇形,9 条)
        const tails = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
        for (const tx of tails) {
            this.r(g, tx - 1, -3, 2, 16, f, u);
        }
        this.r(g, -11, 2, 22, 6, f, u);                   // 尾根横羽
        this.r(g, -11, 2, 3, 5, fr, u); this.r(g, 8, 2, 3, 5, fr, u); // 尾尖狐火(蓝)
        this.r(g, -6, 6, 12, 2, fr, u);
        // 头
        this.r(g, -4, -8, 8, 14, f, u);
        this.r(g, -6, -10, 4, 7, f, u); this.r(g, 2, -10, 4, 7, f, u);   // 耳
        this.r(g, -5, -9, 2, 4, 0xe8a8a8, u); this.r(g, 3, -9, 2, 4, 0xe8a8a8, u);      // 耳内
        this.r(g, -3, -4, 2, 3, e, u); this.r(g, 1, -4, 2, 3, e, u);     // 青蓝眼
        this.r(g, -1, 2, 2, 2, 0x20242a, u);                               // 鼻
    }

    // —— 应龙:有翼神龙 ——
    private static drawYinglong(g: Graphics, u: number): void {
        const gd = 0xd8a832, dk = 0x9a7020, wg = 0xf0e8d0, gr = 0x48b058;
        // 双翼
        this.r(g, -18, -10, 10, 5, wg, u); this.r(g, -20, -8, 4, 4, wg, u);
        this.r(g, 8, -10, 10, 5, wg, u); this.r(g, 16, -8, 4, 4, wg, u);
        this.r(g, -18, -4, 7, 4, dk, u); this.r(g, 11, -4, 7, 4, dk, u);
        // 龙首
        this.r(g, -6, -8, 12, 13, gd, u);
        this.r(g, -8, -12, 4, 5, gd, u); this.r(g, 4, -12, 4, 5, gd, u);   // 角座
        this.r(g, -9, -15, 2, 4, wg, u); this.r(g, 7, -15, 2, 4, wg, u);   // 角
        this.r(g, -6, -12, 12, 3, 0x8a5a18, u);                            // 眉鳞
        this.r(g, -4, -5, 3, 3, gr, u); this.r(g, 1, -5, 3, 3, gr, u);     // 眼
        this.r(g, -4, 3, 8, 2, 0x8a5a18, u);                               // 口线
        this.r(g, -2, 5, 2, 5, 0xf0e8d0, u); this.r(g, 1, 5, 2, 5, 0xf0e8d0, u);        // 须
        this.r(g, -6, -6, 1, 5, wg, u); this.r(g, 5, -6, 1, 5, wg, u);     // 首侧光
    }

    // —— 穷奇:BOSS,虎身有翼猬毛 ——
    private static drawQiongqi(g: Graphics, u: number): void {
        const f = 0x5a7a7e, l = 0x7a9a9e, sp = 0x93a8a0, rd = 0xd02028, w = 0xe8e4d8;
        this.r(g, -9, -9, 18, 18, f, u);                  // 头
        this.r(g, -9, -9, 18, 4, l, u);                   // 顶光
        // 背刺(猬毛)
        for (let i = 0; i < 6; i++) {
            this.r(g, -7 + i * 3, -13, 2, 5, sp, u);
        }
        // 翼
        this.r(g, -19, -8, 10, 6, 0x2a3438, u); this.r(g, -21, -11, 5, 6, 0x2a3438, u);
        this.r(g, 9, -8, 10, 6, 0x2a3438, u); this.r(g, 16, -11, 5, 6, 0x2a3438, u);
        // 面
        this.r(g, -6, -4, 4, 4, w, u); this.r(g, 2, -4, 4, 4, w, u);       // 眼白
        this.r(g, -5, -3, 2, 2, rd, u); this.r(g, 3, -3, 2, 2, rd, u);     // 红瞳
        this.r(g, -5, 1, 10, 4, l, u);                                      // 吻
        this.r(g, -4, 2, 2, 4, w, u); this.r(g, 2, 2, 2, 4, w, u);          // 獠牙
        this.r(g, -5, -8, 3, 2, 0x3a4a50, u); this.r(g, 2, -8, 3, 2, 0x3a4a50, u);   // 眉
        this.r(g, -12, 8, 3, 3, 0x6a4a8a, u); this.r(g, 9, 6, 3, 3, 0x6a4a8a, u);     // 妖气
    }
}

/**
 * 程序化战斗背景
 */
export class BattleBgRenderer {
    static draw(g: Graphics, bgTex: string): void {
        g.clear();
        if (bgTex.includes('cave')) this.drawCave(g);
        else if (bgTex.includes('home')) this.drawHome(g);
        else this.drawField(g);
        g.fill();
    }

    private static band(g: Graphics, x: number, y: number, w: number, h: number, c: number): void {
        g.fillColor = new Color(c >> 16 & 255, c >> 8 & 255, c & 255, 255);
        g.rect(x, y, w, h);
    }

    /** 野外:夜空 + 远山与草丘 */
    private static drawField(g: Graphics): void {
        this.band(g, -480, -300, 960, 600, 0x0c1230);
        this.band(g, -480, 40, 960, 260, 0x111a3c);
        this.band(g, -480, -300, 960, 60, 0x1a2450);
        // 星
        const stars = [[-400, 220], [-300, 120], [-200, 240], [-120, 90], [40, 200], [160, 260], [260, 130], [380, 230], [420, 80], [-450, 60], [-260, -40], [60, -20], [320, -60]];
        for (const [sx, sy] of stars) this.band(g, sx, sy, 3, 3, 0xe8e8d8);
        // 远山
        this.band(g, -480, -100, 200, 140, 0x272c50);
        this.band(g, -280, -160, 160, 200, 0x1f2444);
        this.band(g, -120, -120, 220, 160, 0x272c50);
        this.band(g, 100, -200, 180, 240, 0x1f2444);
        this.band(g, 280, -100, 200, 140, 0x272c50);
        // 草地
        this.band(g, -480, -300, 960, 60, 0x24381e);
        this.band(g, -480, -280, 960, 12, 0x2e4826);
        this.band(g, -480, -240, 960, 8, 0x335026);
    }

    /** 洞窟:石笋与雾 */
    private static drawCave(g: Graphics): void {
        this.band(g, -480, -300, 960, 600, 0x1c1612);
        this.band(g, -480, -300, 960, 140, 0x241c16);
        // 后景石笋
        this.band(g, -480, -300, 70, 220, 0x2e2620);
        this.band(g, -380, -300, 48, 150, 0x2e2620);
        this.band(g, -260, -300, 90, 260, 0x332a24);
        this.band(g, -120, -300, 44, 120, 0x2e2620);
        this.band(g, 40, -300, 110, 230, 0x332a24);
        this.band(g, 220, -300, 50, 140, 0x2e2620);
        this.band(g, 330, -300, 90, 250, 0x332a24);
        // 雾
        this.band(g, -480, -80, 960, 30, 0x41383c);
        this.band(g, -480, -10, 960, 22, 0x4a4044);
        // 地面
        this.band(g, -480, -300, 960, 40, 0x221a16);
        this.band(g, -460, -262, 40, 16, 0x3a3128);
        this.band(g, 60, -256, 30, 12, 0x3a3128);
        this.band(g, -200, -270, 26, 10, 0x3a3128);
    }

    /** 家中(备用的战斗背景) */
    private static drawHome(g: Graphics): void {
        this.band(g, -480, -300, 960, 600, 0x3a2a1c);
        this.band(g, -480, -300, 960, 90, 0x2c2014);
        for (let i = 0; i < 8; i++) {
            this.band(g, -480 + i * 120, -300, 6, 600, 0x54402a);
            this.band(g, -480 + i * 120 + 50, -300, 7, 600, 0x2e2418);
        }
        this.band(g, -480, 150, 300, 8, 0x6a5036);
        this.band(g, -480, -300, 960, 6, 0x6a5036);
        this.band(g, -60, 200, 120, 7, 0x6a5036);
    }
}