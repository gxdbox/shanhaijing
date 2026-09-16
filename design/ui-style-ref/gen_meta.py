#!/usr/bin/env python3
"""为 ui/ 下的 3 张素材生成 Cocos .meta（复制 beasts 格式 + 新 uuid）"""
import json, uuid, os

files = ['panel.png', 'button.png', 'bg_landscape.png']
base = 'assets/resources/textures/ui'

for f in files:
    meta_path = os.path.join(base, f + '.meta')
    new_uuid = str(uuid.uuid4())
    meta = {
        "ver": "0.0.1",
        "importer": "*",
        "imported": True,
        "uuid": new_uuid,
        "files": [".png"],
        "subMetas": {},
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": False,
            "hasAlpha": True,
            "redirect": f"{new_uuid}@6c48a"
        }
    }
    with open(meta_path, 'w') as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)
    print(f"{f}.meta 生成: uuid={new_uuid}")
