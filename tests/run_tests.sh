#!/bin/bash
# 编译 + 运行 shanhaijing 核心逻辑单测
cd "$(dirname "$0")/.."
rm -rf /tmp/shj_test
mkdir -p /tmp/shj_test
TSC=/Users/pony/.hermes/hermes-agent/node_modules/.bin/tsc
node "$TSC" --ignoreConfig --outDir /tmp/shj_test --module commonjs --target es2017 --experimentalDecorators --skipLibCheck --ignoreDeprecations 6.0 \
  assets/scripts/core/EventBus.ts \
  assets/scripts/core/GameData.ts \
  assets/scripts/data/BeastsData.ts \
  assets/scripts/data/MapsData.ts \
  assets/scripts/data/SkillsData.ts \
  assets/scripts/data/WeaponsData.ts \
  assets/scripts/data/ArmorsData.ts \
  assets/scripts/data/ItemsData.ts \
  assets/scripts/data/QuestsData.ts \
  assets/scripts/data/EvolutionsData.ts \
  assets/scripts/core/SaveManager.ts \
  assets/scripts/core/GameManager.ts 2>/dev/null
node tests/run_logic_tests.js
