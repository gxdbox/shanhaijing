#!/usr/bin/env python3
"""
生成 Cocos Creator 3.8 项目所需的 .meta 文件与 Main.scene 场景文件。

- 为 assets/ 下所有 .ts / .png 生成带固定 UUID 的 meta(确定性哈希)
- 生成最小化 Main.scene:Scene + GameRoot 节点(挂 GameRoot.ts 组件)+ SceneGlobals
- GameRoot 组件在场景中以「压缩 UUID」引用(与编辑器生成的格式一致)

Cocos 编辑器打开项目时会自动补全其余资源 meta。
"""
import os
import json
import hashlib

BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')


def uuid_for(relpath: str) -> str:
    """由相对路径确定性生成 UUID"""
    h = hashlib.md5(('shanhaijing:' + relpath).encode('utf-8')).hexdigest()
    return f'{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}'


def compress_uuid(u: str) -> str:
    """Cocos 压缩 UUID:前 5 位十六进制保留,其余每 3 位十六进制 → 2 位 base64"""
    h = u.replace('-', '')
    assert len(h) == 32
    out = h[:5]
    rest = h[5:]
    for i in range(0, len(rest), 3):
        v = int(rest[i:i + 3], 16)
        out += BASE64[(v >> 6) & 63] + BASE64[v & 63]
    assert len(out) == 23
    return out


TYPESCRIPT_META = {
    'ver': '4.0.24',
    'importer': 'typescript',
    'imported': True,
    'files': [],
    'subMetas': {},
    'userData': {},
}

IMAGE_META = {
    'ver': '1.0.7',
    'importer': 'image',
    'imported': True,
    'files': ['.json'],
    'subMetas': {},
    'userData': {},
}

SCENE_META = {
    'ver': '1.1.50',
    'importer': 'scene',
    'imported': True,
    'files': ['.json'],
    'subMetas': {},
    'userData': {},
}


def write_meta(path: str, importer_meta: dict, relpath: str):
    meta = dict(importer_meta)
    meta['uuid'] = uuid_for(relpath)
    with open(path + '.meta', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    return meta['uuid']


def gen_script_meta():
    scripts_dir = os.path.join(ASSETS, 'scripts')
    count = 0
    for root, _dirs, files in os.walk(scripts_dir):
        for fn in files:
            if not fn.endswith('.ts'):
                continue
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, ASSETS)
            write_meta(full, TYPESCRIPT_META, rel)
            count += 1
    print(f'[meta] scripts: {count} .ts meta 已生成')
    return count


def gen_image_meta():
    base = os.path.join(ASSETS, 'resources', 'textures')
    count = 0
    if os.path.isdir(base):
        for root, _dirs, files in os.walk(base):
            for fn in files:
                if not fn.lower().endswith('.png'):
                    continue
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, ASSETS)
                write_meta(full, IMAGE_META, rel)
                count += 1
    print(f'[meta] textures: {count} .png meta 已生成')
    return count


def gen_scene():
    game_root_rel = os.path.join('scripts', 'core', 'GameRoot.ts')
    game_root_uuid = uuid_for(game_root_rel)
    comp_type = compress_uuid(game_root_uuid)
    print(f'[scene] GameRoot uuid = {game_root_uuid} -> {comp_type}')

    v3_0 = {'__type__': 'cc.Vec3', 'x': 0, 'y': 0, 'z': 0}
    quat = {'__type__': 'cc.Quat', 'x': 0, 'y': 0, 'z': 0, 'w': 1}
    v3_1 = {'__type__': 'cc.Vec3', 'x': 1, 'y': 1, 'z': 1}

    scene = [
        # 0: SceneAsset
        {
            '__type__': 'cc.SceneAsset',
            '_name': 'main',
            '_objFlags': 0,
            '_native': '',
            'scene': {'__id__': 1},
        },
        # 1: Scene
        {
            '__type__': 'cc.Scene',
            '_objFlags': 0,
            '_parent': None,
            '_children': [{'__id__': 2}],
            '_active': True,
            '_components': [],
            '_prefab': None,
            '_lpos': v3_0,
            '_lrot': quat,
            '_lscale': v3_1,
            '_mobility': 0,
            '_layer': 1073741824,
            '_euler': v3_0,
            'autoReleaseAssets': False,
            '_globals': {'__id__': 4},
            '_id': 'shj-main-scene',
        },
        # 2: GameRoot 节点
        {
            '__type__': 'cc.Node',
            '_name': 'GameRoot',
            '_objFlags': 0,
            '_parent': {'__id__': 1},
            '_children': [],
            '_active': True,
            '_components': [{'__id__': 3}],
            '_prefab': None,
            '_lpos': v3_0,
            '_lrot': quat,
            '_lscale': v3_1,
            '_mobility': 0,
            '_layer': 1073741824,
            '_euler': v3_0,
            '_id': 'shj-game-root-node',
        },
        # 3: GameRoot 组件(以压缩 UUID 引用脚本)
        {
            '__type__': comp_type,
            '_name': '',
            '_objFlags': 0,
            'node': {'__id__': 2},
            '_enabled': True,
            '__prefab': None,
            '_id': 'shj-game-root-comp',
        },
        # 4: SceneGlobals
        {
            '__type__': 'cc.SceneGlobals',
            'ambient': {'__id__': 5},
            'shadows': {'__id__': 6},
            '_skybox': {'__id__': 7},
            'fog': {'__id__': 8},
            'octree': {'__id__': 9},
            'skin': {'__id__': 10},
            'lightProbeInfo': {'__id__': 11},
            'postSettings': {'__id__': 12},
            'bakedWithStationaryMainLight': False,
            'bakedWithHighpLightmap': False,
        },
        {'__type__': 'cc.AmbientInfo'},
        {'__type__': 'cc.ShadowsInfo'},
        {'__type__': 'cc.SkyboxInfo'},
        {'__type__': 'cc.FogInfo'},
        {'__type__': 'cc.OctreeInfo'},
        {'__type__': 'cc.SkinInfo'},
        {'__type__': 'cc.LightProbeInfo'},
        {'__type__': 'cc.PostSettingsInfo'},
    ]

    scenes_dir = os.path.join(ASSETS, 'scenes')
    os.makedirs(scenes_dir, exist_ok=True)
    scene_path = os.path.join(scenes_dir, 'main.scene')
    with open(scene_path, 'w', encoding='utf-8') as f:
        json.dump(scene, f, ensure_ascii=False, indent=2)
    write_meta(scene_path, SCENE_META, 'scenes/main.scene')
    print('[scene] main.scene 已生成')


def self_test_compress():
    """压缩算法自检:随机 UUID 往返"""
    for i in range(2000):
        h = hashlib.md5(('test' + str(i)).encode('utf-8')).hexdigest()
        u = f'{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}'
        c = compress_uuid(u)
        head = c[:5]
        rest = c[5:]
        expanded = ''
        for j in range(0, len(rest), 2):
            v = BASE64.index(rest[j]) * 64 + BASE64.index(rest[j + 1])
            expanded += '%03x' % v
        assert (head + expanded) == u.replace('-', ''), f'fail {u} {c}'
    print('[test] UUID 压缩算法自检通过(2000 组)')


if __name__ == '__main__':
    self_test_compress()
    gen_script_meta()
    gen_image_meta()
    gen_scene()
    print('[done] 全部 meta / 场景文件生成完成')