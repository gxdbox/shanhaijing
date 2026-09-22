# shanhaijing 逻辑单测

运行:
```bash
bash tests/run_tests.sh
```

说明:编译纯逻辑模块(EventBus/GameData/BeastsData/MapsData/SkillsData/WeaponsData/SaveManager/GameManager)为 JS,
mock cc.sys.localStorage,在 node 中验证核心玩法逻辑(升级/加点/武器/旅店/存档)。
