import { YongShenEngineV2Step5, } from '../src/games/bazi/yongshen-v2/index.js';
const TEST_CASES = [
    {
        name: 'case-1',
        input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'],
        expectedPatternType: '专旺格',
        expectedYongElements: ['木', '火'],
        expectedJiElements: ['金'],
        expectedClimateApplied: false,
        expectedClimateAdjustmentType: null,
    },
    {
        name: 'case-2',
        input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'],
        expectedPatternType: '假从格',
        expectedYongElements: ['土', '火'],
        expectedJiElements: ['水', '金'],
        expectedClimateApplied: false,
        expectedClimateAdjustmentType: null,
    },
];
function assertElementList(actual, expected, label) {
    if (actual.length !== expected.length) {
        throw new Error(`${label} 条数不匹配: expected=${expected.length} actual=${actual.length}`);
    }
    expected.forEach((element, index) => {
        if (actual[index] !== element) {
            throw new Error(`${label} 不匹配: index=${index} expected=${element} actual=${actual[index]}`);
        }
    });
}
function main() {
    const engine = new YongShenEngineV2Step5();
    TEST_CASES.forEach((testCase) => {
        const result = engine.analyzeStep1To8(testCase.input);
        const mapping = result.yongShenMapping;
        if (mapping.patternType !== testCase.expectedPatternType) {
            throw new Error(`${testCase.name} 格局不匹配: expected=${testCase.expectedPatternType} actual=${mapping.patternType}`);
        }
        assertElementList(mapping.yongElements, testCase.expectedYongElements, `${testCase.name} Yong`);
        assertElementList(mapping.jiElements, testCase.expectedJiElements, `${testCase.name} Ji`);
        if (mapping.climateAdjustment.applied !== testCase.expectedClimateApplied) {
            throw new Error(`${testCase.name} 调候是否生效不匹配: expected=${testCase.expectedClimateApplied} actual=${mapping.climateAdjustment.applied}`);
        }
        if (mapping.climateAdjustment.adjustmentType !== testCase.expectedClimateAdjustmentType) {
            throw new Error(`${testCase.name} 调候类型不匹配: expected=${testCase.expectedClimateAdjustmentType} actual=${mapping.climateAdjustment.adjustmentType}`);
        }
        console.log(`\n[PASS] ${testCase.name}`);
        console.log(JSON.stringify({
            input: testCase.input,
            patternType: mapping.patternType,
            effectiveDayMasterElement: mapping.effectiveDayMasterElement,
            yongElements: mapping.yongElements,
            jiElements: mapping.jiElements,
            climateAdjustment: mapping.climateAdjustment,
            notes: mapping.notes,
        }, null, 2));
    });
}
main();
