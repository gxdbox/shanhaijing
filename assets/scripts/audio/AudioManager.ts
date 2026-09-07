import { AudioClip, AudioSource, Node, resources } from 'cc';

/**
 * 背景音乐管理器(单例)
 * 7 首 AI BGM: title/town/field/cave/battle/boss/victory
 * 场景映射: 家中/青丘村→town, 野外→field, 雾隐洞→cave, 普通战→battle, BOSS战→boss, 胜利→victory
 */
export class AudioManager {
    private static _inst: AudioManager | null = null;
    static get instance(): AudioManager {
        if (!this._inst) this._inst = new AudioManager();
        return this._inst;
    }

    private bgmSource: AudioSource | null = null;
    private clips = new Map<string, AudioClip>();
    private currentKey = '';
    private loaded = 0;
    private total = 7;
    private loadingStarted = false;

    private static TRACKS = ['title', 'town', 'field', 'cave', 'battle', 'boss', 'victory'];

    /** 创建 BGM AudioSource 并预加载全部曲目 */
    init(parent: Node): void {
        if (this.bgmSource || !parent) return;
        const node = new Node('BGM');
        node.layer = parent.layer;
        parent.addChild(node);
        this.bgmSource = node.addComponent(AudioSource);
        this.bgmSource.loop = true;
        this.bgmSource.volume = 0.5;
        this.preload();
    }

    private preload(): void {
        if (this.loadingStarted) return;
        this.loadingStarted = true;
        for (const key of AudioManager.TRACKS) {
            resources.load(`audio/${key}`, AudioClip, (err, clip) => {
                if (!err && clip) {
                    this.clips.set(key, clip);
                    this.loaded++;
                } else {
                    console.warn(`[AudioManager] 加载音频失败 audio/${key}:`, err);
                    this.loaded++;
                }
            });
        }
    }

    /** 按地图播放对应 BGM */
    playMapBgm(mapId: string): void {
        const key = AudioManager.mapToTrack(mapId);
        this.playBgm(key, true);
    }

    /** 战斗 BGM:boss 用 boss 曲,否则 battle 曲 */
    playBattleBgm(isBoss: boolean): void {
        this.playBgm(isBoss ? 'boss' : 'battle', true);
    }

    /** 胜利旋律:播一次,不循环 */
    playVictory(): void {
        this.playBgm('victory', false);
    }

    /** 恢复当前地图 BGM(战斗结束后) */
    resumeMapBgm(mapId: string): void {
        this.playMapBgm(mapId);
    }

    stop(): void {
        if (this.bgmSource) this.bgmSource.stop();
        this.currentKey = '';
    }

    /** 核心:切换 BGM。同一首不打断;不同首先停后播 */
    playBgm(key: string, loop = true): void {
        if (!this.bgmSource) return;
        if (key === this.currentKey && this.bgmSource.playing) {
            // 已在该曲播放中
            return;
        }
        const clip = this.clips.get(key);
        if (!clip) {
            // 还没加载完:记录目标,加载完成后自动续播
            this.bgmSource.stop();
            this.currentKey = key;
            this.waitAndPlay(key, loop);
            return;
        }
        this.bgmSource.stop();
        this.bgmSource.clip = clip;
        this.bgmSource.loop = loop;
        this.bgmSource.volume = key === 'victory' ? 0.55 : 0.5;
        this.bgmSource.play();
        this.currentKey = key;
    }

    private waitAndPlay(key: string, loop: boolean): void {
        const tryPlay = () => {
            const clip = this.clips.get(key);
            if (clip && this.bgmSource) {
                this.bgmSource.stop();
                this.bgmSource.clip = clip;
                this.bgmSource.loop = loop;
                this.bgmSource.volume = key === 'victory' ? 0.55 : 0.5;
                this.bgmSource.play();
                this.currentKey = key;
                return true;
            }
            return false;
        };
        // 轮询等待加载完成(最多 ~3s)
        let tries = 0;
        const timer = setInterval(() => {
            tries++;
            if (tryPlay() || tries > 15) clearInterval(timer);
        }, 200);
    }

    /** 地图 → 曲目 key */
    static mapToTrack(mapId: string): string {
        switch (mapId) {
            case 'home':
            case 'qingqiu': return 'town';
            case 'wild': return 'field';
            case 'cave': return 'cave';
            default: return 'town';
        }
    }
}
