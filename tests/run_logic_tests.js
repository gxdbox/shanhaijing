#!/usr/bin/env node
/**
 * shanhaijing 核心逻辑单测（运行编译后的 JS，mock cc.sys）
 * 验证：升级给点 / 加点 / 买武器 / 旅店休息 / 存档兼容
 */
const Module = require('module');
const path = require('path');

// ---- mock cc 模块（SaveManager 只用了 sys.localStorage） ----
const storage = {};
const mockCC = {
    sys: {
        localStorage: {
            getItem: (k) => (k in storage ? storage[k] : null),
            setItem: (k, v) => { storage[k] = String(v); },
            removeItem: (k) => { delete storage[k]; },
        },
    },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === 'cc') return mockCC;
    return origLoad.apply(this, arguments);
};

const T = '/tmp/shj_test';
const { GameManager } = require(path.join(T, 'core/GameManager.js'));

let pass = 0, fail = 0;
function ok(name, cond) {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else { fail++; console.log(`  ✗ ${name}`); }
}

// ===== 测试1：初始状态 =====
const gm = new GameManager();
gm.newGame();
ok('新档初始 0 属性点', gm.attrPoints === 0);
ok('新档初始武器木剑', gm.weaponId === 'wooden_sword');
ok('新档初始金币 50', gm.gold === 50);
ok('新档玩家 Lv1 atk8', gm.player.level === 1 && gm.player.atk === 8);

// ===== 测试2：升级给 3 点 =====
const lvl0 = gm.player.level;
gm.gainExp(1000);
ok('升级后 level 提升', gm.player.level > lvl0);
ok(`升级获得属性点(每级3点): ${gm.attrPoints} = ${(gm.player.level - 1) * 3}`, gm.attrPoints === (gm.player.level - 1) * 3);

// ===== 测试3：加点 =====
const atk0 = gm.player.atk, def0 = gm.player.def, spd0 = gm.player.spd, hp0 = gm.player.maxHp;
const pts0 = gm.attrPoints;
ok('加攻击成功', gm.spendAttrPoint('atk') === true);
ok('攻击 +2', gm.player.atk === atk0 + 2);
ok('加防御成功', gm.spendAttrPoint('def') === true);
ok('防御 +2', gm.player.def === def0 + 2);
ok('加速度成功', gm.spendAttrPoint('spd') === true);
ok('速度 +1', gm.player.spd === spd0 + 1);
ok('加生命成功', gm.spendAttrPoint('maxHp') === true);
ok('生命 +10', gm.player.maxHp === hp0 + 10);
ok(`消耗 4 点 (${pts0}->${gm.attrPoints})`, gm.attrPoints === pts0 - 4);
// 清空点数后测试失败分支
gm.attrPoints = 0;
ok('点数不足返回 false', gm.spendAttrPoint('atk') === false);

// ===== 测试4：买武器 =====
gm.gold = 500;
let r = gm.buyWeapon('bronze_sword');
ok('青铜剑购买成功', r.ok === true);
ok('购买后金币扣减 (500->' + gm.gold + ')', gm.gold === 420);
ok('武器已更换', gm.weaponId === 'bronze_sword');
ok('武器加成生效 +4', gm.getWeaponBonus() === 4);
gm.gold = 10;
r = gm.buyWeapon('ganjiang_sword');
ok('金币不足拒绝购买', r.ok === false && gm.weaponId === 'bronze_sword');

// ===== 测试5：旅店休息 =====
gm.gold = 100;
gm.player.hp = 1;
gm.player.mp = 0;
r = gm.restAtInn(20);
ok('旅店休息成功', r.ok === true);
ok('生命回满', gm.player.hp === gm.player.maxHp);
ok('魔法回满', gm.player.mp === gm.player.maxMp);
ok('金币扣 20 (100->' + gm.gold + ')', gm.gold === 80);
gm.player.hp = 1;
gm.gold = 10;
r = gm.restAtInn(20);
ok('没钱不能休息', r.ok === false && gm.player.hp === 1);

// ===== 测试6：存档（新档含 attrPoints） =====
gm.gold = 100;
gm.attrPoints = 7;
gm.save();
const saved = JSON.parse(storage['shj_save_v1']);
ok('存档含 attrPoints=7', saved.attrPoints === 7);
ok('存档含 weaponId', typeof saved.weaponId === 'string');

// ===== 测试7：读档（旧档无 attrPoints → 默认 0） =====
const legacy = { player: gm.player, beast: null, dex: [], gold: 100, flags: [], mapId: 'home', x: 1, y: 1, playTime: 0 };
storage['shj_save_v1'] = JSON.stringify(legacy);
const gm2 = new GameManager();
gm2.start();
ok('旧档读档 attrPoints 默认 0', gm2.attrPoints === 0);
ok('旧档读档 weaponId 默认木剑', gm2.weaponId === 'wooden_sword');


// ===== 测试8：羁绊系统 =====
const gm3 = new GameManager();
gm3.newGame();
gm3.catchBeast('jiuwei');   // 收服九尾狐(羁绊Lv1)
ok('收服后羁绊Lv1', gm3.beast.bond === 1);
ok('羁绊初始经验0', gm3.beast.bondExp === 0);
// 刷经验到 Lv2 (需要20)，解锁 bondSkill
const r3 = gm3.gainBeastBond(25);
ok('羁绊升级到Lv2', gm3.beast.bond === 2);
ok('羁绊升级flag', r3.leveled === true);
ok('Lv2解锁专属技能(狐火连珠)', r3.newSkill === 'huhuo' && gm3.beast.skills.includes('huhuo'));
// 继续升到更高(从Lv2到Lv5需 50+80+110=240 经验,给300)
gm3.gainBeastBond(300);
ok('羁绊可升到Lv5上限', gm3.beast.bond === 5);
// 无伙伴时返回 false
const gm4 = new GameManager();
gm4.newGame();
const r2 = gm4.gainBeastBond(10);
ok('无伙伴时升级返回 leveled=false', r2.leveled === false);

// ===== 测试9：五行克制 =====
// 通过 BeastsData 验证元素赋值
const bd = require(path.join(T, 'data/BeastsData.js'));
const zhi = bd.BeastsData.get('zhi');
const xuangui = bd.BeastsData.get('xuangui');
ok('彘元素=金', zhi.element === '金');
ok('旋龟元素=水', xuangui.element === '水');
ok('文鳐鱼元素=水', bd.BeastsData.get('wenyao').element === '水');
// 武器元素
const wd = require(path.join(T, 'data/WeaponsData.js'));
ok('青铜剑元素=金', wd.WeaponsData.get('bronze_sword').element === '金');
ok('碧水剑元素=水', wd.WeaponsData.get('water_sword').element === '水');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
