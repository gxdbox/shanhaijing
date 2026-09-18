#!/usr/bin/env python3
"""
生成像素素材:可平铺瓦片贴图(64x64)+ NPC 像素立绘(64x64 透明底)
风格基调沿用 MapView.COLORS 的 FC 复古色板;若后续有 AI 立绘可同名覆盖。
用法: python3 tools/gen_pixels.py
"""
import os
import random
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'resources', 'textures')
S = 64  # 输出尺寸


def new_img():
    return Image.new('RGBA', (S, S), (0, 0, 0, 0))


def px(img, x, y, c):
    """带越界环绕(保证平铺无缝)"""
    img.putpixel((x % S, y % S), c)


def gen_tile(name, base3, deco):
    """3 色抖动底色瓦片 + deco(img, h) 装饰回调"""
    rnd = random.Random(hash(name) & 0xFFFF)
    img = new_img()
    for y in range(S):
        for x in range(S):
            # 2x2 抖动块,避免单像素噪点
            bx, by = (x // 2) * 2, (y // 2) * 2
            i = (bx // 2 + by // 2 + (rnd.random() < 0.12)) % 3
            img.putpixel((x, y), base3[i])
    deco(img, rnd)
    img.save(os.path.join(ROOT, 'tiles', f'{name}.png'))
    print('tile:', name)


def tiles_dir():
    os.makedirs(os.path.join(ROOT, 'tiles'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'npcs'), exist_ok=True)


# ─────────────────────── 瓦片定义 ───────────────────────

def grass_deco(img, rnd):
    # 草叶:深绿 1x3 竖条 + 亮绿高光点
    dark, light = (44, 98, 40, 255), (96, 168, 76, 255)
    for _ in range(10):
        x, y = rnd.randrange(0, S, 4), rnd.randrange(0, S, 4)
        px(img, x, y, dark); px(img, x, y - 1, dark)
    for _ in range(8):
        x, y = rnd.randrange(0, S, 4), rnd.randrange(0, S, 4)
        px(img, x, y, light)


def path_deco(img, rnd):
    # 碎石:深褐小点 + 浅色压痕横线
    dark, light = (150, 118, 52, 255), (222, 186, 110, 255)
    for _ in range(12):
        x, y = rnd.randrange(0, S, 2), rnd.randrange(0, S, 2)
        px(img, x, y, dark); px(img, x + 1, y, dark)
    for _ in range(4):
        x, y = rnd.randrange(0, S, 8), rnd.randrange(0, S, 8)
        for i in range(6):
            px(img, x + i, y, light)


def water_deco(img, rnd):
    # 波纹:亮蓝横波 + 白高光
    light, white = (86, 148, 200, 255), (200, 228, 248, 255)
    for row in range(0, S, 8):
        off = (row // 8) % 2 * 8
        for seg in range(0, S, 32):
            x0 = (seg + off) % S
            for i in range(10):
                yy = row + (1 if i % 4 < 2 else 0)
                px(img, x0 + i, yy, light)
    for _ in range(5):
        x, y = rnd.randrange(0, S, 4), rnd.randrange(0, S, 4)
        px(img, x, y, white); px(img, x + 1, y, white)


def rock_deco(img, rnd):
    # 岩层:深色裂纹 + 顶部亮棱
    dark, light = (74, 58, 36, 255), (154, 132, 96, 255)
    for _ in range(5):
        x, y = rnd.randrange(0, S), rnd.randrange(0, S)
        for i in range(rnd.randrange(4, 10)):
            px(img, x + i, y + (1 if i % 3 == 0 else 0), dark)
    for x in range(S):
        if rnd.random() < 0.7:
            px(img, x, 0, light)


def wood_deco(img, rnd):
    # 木板:横向深缝 + 木纹短点
    dark, grain = (128, 90, 48, 255), (158, 114, 62, 255)
    for row in range(0, S, 16):
        for x in range(S):
            px(img, x, row, dark)
            px(img, x, row + 1, dark) if rnd.random() < 0.5 else None
    for _ in range(10):
        x, y = rnd.randrange(0, S, 4), rnd.randrange(2, S, 4)
        px(img, x, y, grain); px(img, x + 2, y, grain)


def wall_deco(img, rnd):
    # 砖缝:错缝深色线 + 灰浆亮线
    dark, mortar = (104, 80, 56, 255), (174, 146, 110, 255)
    for row in range(0, S, 16):
        for x in range(S):
            px(img, x, row, mortar)
        off = (row // 16) % 2 * 16
        for col in range(0, S, 32):
            for yy in range(row + 1, row + 16):
                px(img, col + off, yy, dark)


def door_deco(img, rnd):
    # 门板:竖深缝 + 门钉
    dark, stud = (88, 60, 26, 255), (226, 190, 120, 255)
    for col in range(0, S, 16):
        for y in range(S):
            px(img, col, y, dark)
    for yy in (10, 42):
        for xx in (8, 24, 40, 56):
            px(img, xx, yy, stud); px(img, xx + 1, yy, stud)
            px(img, xx, yy + 1, stud); px(img, xx + 1, yy + 1, stud)


def bridge_deco(img, rnd):
    # 桥板:横向板缝 + 两侧扶手
    dark, rail = (128, 94, 46, 255), (96, 68, 34, 255)
    for row in range(0, S, 10):
        for x in range(S):
            px(img, x, row, dark)
    for y in range(S):
        px(img, 2, y, rail); px(img, 3, y, rail)
        px(img, S - 3, y, rail); px(img, S - 4, y, rail)


def cave_deco(img, rnd):
    # 石砖:深色砖缝 + 碎石
    dark, chip = (52, 42, 32, 255), (110, 92, 72, 255)
    for row in range(0, S, 16):
        for x in range(S):
            px(img, x, row, dark)
        off = (row // 16) % 2 * 16
        for col in range(0, S, 32):
            for yy in range(row + 1, row + 16):
                px(img, col + off, yy, dark)
    for _ in range(8):
        x, y = rnd.randrange(0, S, 2), rnd.randrange(0, S, 2)
        px(img, x, y, chip); px(img, x + 1, y + 1, chip)


def shrine_deco(img, rnd):
    # 石板:大方砖浅缝 + 角点
    line, chip = (154, 126, 66, 255), (218, 188, 118, 255)
    for row in range(0, S, 32):
        for x in range(S):
            px(img, x, row, line)
    for col in range(0, S, 32):
        for y in range(S):
            px(img, col, y, line)
    for _ in range(6):
        x, y = rnd.randrange(0, S, 4), rnd.randrange(0, S, 4)
        px(img, x, y, chip)


def roof_deco(img, rnd):
    # 瓦垄:竖向波浪深线
    dark, light = (96, 42, 34, 255), (178, 100, 84, 255)
    for col in range(0, S, 16):
        for y in range(S):
            x = col + (2 if (y // 4) % 2 else 0)
            px(img, x, y, dark)
    for row in range(0, S, 32):
        for x in range(S):
            px(img, x, row, light)


# ─────────────────────── NPC 像素立绘 ───────────────────────

def draw_grid(grid, palette, scale=4, ox=0, oy=0):
    """grid: 字符串行列表, '.'=透明; palette: char->RGBA"""
    img = new_img()
    for r, row in enumerate(grid):
        for c, ch in enumerate(row):
            if ch == '.' or ch not in palette:
                continue
            col = palette[ch]
            x0, y0 = c * scale + ox, r * scale + oy
            for dy in range(scale):
                for dx in range(scale):
                    img.putpixel((x0 + dx, y0 + dy), col)
    return img


HUMAN = {
    'F': (240, 216, 178, 255),   # 脸
    'E': (40, 30, 26, 255),       # 眼
    'M': (216, 120, 100, 255),    # 嘴
    'S': (255, 255, 255, 255),
}

MOTHER = dict(HUMAN, H=(46, 36, 32, 255), C=(64, 118, 148, 255), c=(52, 96, 128, 255), A=(222, 204, 160, 255), B=(70, 56, 44, 255))
GRANDPA = dict(HUMAN, H=(226, 226, 226, 255), C=(150, 110, 66, 255), c=(126, 90, 52, 255), W=(236, 236, 236, 255), K=(120, 84, 48, 255), B=(70, 56, 44, 255))
ELDER = dict(HUMAN, H=(200, 200, 205, 255), C=(78, 70, 110, 255), c=(60, 54, 88, 255), G=(212, 178, 96, 255), W=(226, 226, 226, 255), B=(52, 44, 40, 255))


def npc_human(hair, cloth, cloth2, extra=None):
    g = [
        '................',
        '.....HHHHHH.....',
        '....HHHHHHHH....',
        '...HHFFFFFFHH...',
        '...HFEFFFFEFH...',
        '...HFFFFFFFFH...',
        '....FFFMMFFF....',
        '.....CCCCCC.....',
        '....CCCCCCCC....',
        '...CCcCCCCcCC...',
        '...CCcCCCCcCC...',
        '...CCCCCCCCCC...',
        '....CCCCCCCC....',
        '....BB....BB....',
        '................',
        '................',
    ]
    rows = [list(r) for r in g]
    if extra:
        extra(rows)
    return [''.join(r) for r in rows]


def gen_npc(name, grid, palette):
    img = draw_grid(grid, palette, scale=4)
    img.save(os.path.join(ROOT, 'npcs', f'{name}.png'))
    print('npc:', name)


def jingwei_img():
    # 精卫:花脑袋、白喙赤足的小鸟,衔树枝
    pal = {
        'B': (60, 62, 78, 255),    # 黑羽身
        'b': (84, 86, 104, 255),   # 亮羽
        'W': (238, 238, 244, 255), # 花脑袋白纹
        'R': (216, 74, 60, 255),   # 红喙红足
        'K': (120, 84, 48, 255),   # 树枝
    }
    g = [
        '................',
        '................',
        '......WWWW......',
        '.....WWBBWW.....',
        '.....WBWBBWRR...',
        '....BBBBBBRRK...',
        '...BbBBBBB..K...',
        '..BBbBBBBB......',
        '..BBbBBBBB......',
        '..BBBBBBBB......',
        '...BBB.BBB......',
        '...R.....R......',
        '..RR.....RR.....',
        '................',
        '................',
        '................',
    ]
    img = draw_grid(g, pal, scale=4)
    # 尾巴羽毛
    for x, y in [(4, 44), (2, 48), (0, 52)]:
        for dy in range(4):
            for dx in range(6):
                img.putpixel((x + dx, y + dy), (60, 62, 78, 255))
    img.save(os.path.join(ROOT, 'npcs', 'jingwei.png'))
    print('npc: jingwei')


def stone_img():
    # 石碑:青石碑身+刻纹+底座
    pal = {
        'N': (122, 128, 132, 255),  # 石身
        'n': (148, 154, 158, 255),  # 亮面
        'D': (84, 90, 96, 255),     # 深刻纹
        'L': (188, 194, 198, 255),  # 高光
        'G': (96, 130, 80, 255),    # 苔藓
    }
    g = [
        '.....NNNNNN.....',
        '....NnNNNNnN....',
        '...NNNNNNNNNN...',
        '...NNDNNNDNNN...',
        '...NNNDNNDNNN...',
        '...NNDNNNDNNN...',
        '...NNNNNNNNNN...',
        '...NDNNNNNNDN...',
        '...NNNNNNNNNN...',
        '...NNNDNNDNNN...',
        '...GNNNNNNNG....',
        '....NNNNNN......',
        '...DDDDDDDDDD...',
        '..DDDDDDDDDDDD..',
        '..NNNNNNNNNNNN..',
        '................',
    ]
    img = draw_grid(g, pal, scale=4)
    img.save(os.path.join(ROOT, 'npcs', 'stone.png'))
    print('npc: stone')


# ─────────────────────── main ───────────────────────

def main():
    tiles_dir()
    gen_tile('grass', [(74, 138, 60, 255), (66, 128, 54, 255), (58, 118, 48, 255)], grass_deco)
    gen_tile('path', [(207, 167, 90, 255), (196, 156, 80, 255), (184, 144, 70, 255)], path_deco)
    gen_tile('water', [(47, 111, 174, 255), (41, 102, 162, 255), (36, 92, 148, 255)], water_deco)
    gen_tile('rock', [(117, 96, 63, 255), (108, 88, 57, 255), (99, 80, 51, 255)], rock_deco)
    gen_tile('wood', [(176, 129, 80, 255), (166, 120, 72, 255), (156, 112, 66, 255)], wood_deco)
    gen_tile('wall', [(154, 122, 88, 255), (144, 114, 80, 255), (133, 104, 72, 255)], wall_deco)
    gen_tile('door', [(138, 90, 46, 255), (126, 82, 40, 255), (116, 74, 35, 255)], door_deco)
    gen_tile('bridge', [(176, 136, 72, 255), (164, 126, 64, 255), (152, 116, 56, 255)], bridge_deco)
    gen_tile('cave', [(90, 74, 58, 255), (82, 66, 51, 255), (74, 59, 45, 255)], cave_deco)
    gen_tile('shrine', [(194, 162, 92, 255), (182, 151, 82, 255), (170, 140, 74, 255)], shrine_deco)
    gen_tile('roof', [(138, 66, 56, 255), (126, 60, 50, 255), (114, 54, 44, 255)], roof_deco)

    gen_npc('mother', npc_human('H', 'C', 'c', extra=lambda rows: [
        # 发髻 + 围裙
        rows.__setitem__(0, list('.......HH.......')),
        rows.__setitem__(1, list('......HHHH......')),
        rows.__setitem__(9, list('...CAAACCAACCC..')),
        rows.__setitem__(10, list('...CAAACCAACCC..')),
        rows.__setitem__(11, list('...CCCCCCCCCC...')),
    ]), MOTHER)
    gen_npc('grandpa', npc_human('H', 'C', 'c', extra=lambda rows: [
        rows.__setitem__(6, list('....FWWWWWF.....')),   # 白胡
        rows.__setitem__(7, list('.....WWWWW......')),
    ]), GRANDPA)
    gen_npc('elder', npc_human('H', 'C', 'c', extra=lambda rows: [
        rows.__setitem__(7, list('.....CCCCC.G....')),
        rows.__setitem__(9, list('...CCCCCCCCGCC..')),   # 金色腰带
        rows.__setitem__(10, list('...CGCCCCCCCGC..')),
        rows.__setitem__(6, list('....FWWWWWF.....')),   # 长须
        rows.__setitem__(7, list('.....WWWWW......')),
    ]), ELDER)
    jingwei_img()
    stone_img()
    print('done.')


if __name__ == '__main__':
    main()
