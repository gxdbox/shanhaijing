#!/usr/bin/env python3
"""清新国风 UI 素材抠图：白色背景 → 透明（纯 PIL，无 numpy 依赖）"""
from PIL import Image

def cut_white_bg(src, dst, threshold=235):
    """白色(及近白)像素→透明；保留非白主体。"""
    img = Image.open(src).convert('RGBA')
    w, h = img.size
    px = img.load()
    # 双线性柔边：先整体抠，再对"边界带"做半透明处理
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > threshold and g > threshold and b > threshold and abs(r-g) < 12 and abs(g-b) < 12:
                px[x, y] = (r, g, b, 0)
            elif a > 0 and a < 128:
                px[x, y] = (r, g, b, 60)
    # 裁剪到内容包围盒
    alpha = img.getchannel('A')
    bbox = alpha.getbbox()
    if bbox:
        pad = 6
        bbox = (max(0,bbox[0]-pad), max(0,bbox[1]-pad), min(w,bbox[2]+pad), min(h,bbox[3]+pad))
        img = img.crop(bbox)
    img.save(dst)
    print(f"{src} → {dst}  尺寸={img.size}")

cut_white_bg('ui_panel_清新国风.png', 'ui_panel_clean.png')
cut_white_bg('ui_button_清新国风.png', 'ui_button_clean.png')
print("\n完成！背景图 ui_bg 不需要抠（整图铺底直接拉伸用）")
