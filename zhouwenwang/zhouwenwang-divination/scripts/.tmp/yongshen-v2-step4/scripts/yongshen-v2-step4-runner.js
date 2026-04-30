import { YongShenEngineV2Step4, } from '../src/games/bazi/yongshen-v2/index.js';
const TEST_CASES = [
    {
        name: 'case-1',
        input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'],
        expectedPatternType: '专旺格',
        expectedEffectiveDayMasterElement: '木',
        expectedTongDangElements: ['木', '水'],
        expectedTongDangScore: 121.5,
        expectedYiDangScore: 12.4,
        expectedTongDangRatio: 0.9074,
        expectedYiDangRatio: 0.0926,
        expectedTongDangPercent: 90.7394,
        expectedYiDangPercent: 9.2606,
        expectedMaxSelfElement: '木',
        expectedMaxSelfPercent: 84.0179,
        expectedMaxOpposingElement: '火',
        expectedMaxOpposingPercent: 6.2733,
        expectedTransformationPassed: false,
    },
    {
        name: 'case-2',
        input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'],
        expectedPatternType: '假从格',
        expectedEffectiveDayMasterElement: '水',
        expectedTongDangElements: ['水', '金'],
        expectedTongDangScore: 26.9,
        expectedYiDangScore: 114.5,
        expectedTongDangRatio: 0.1902,
        expectedYiDangRatio: 0.8098,
        expectedTongDangPercent: 19.024,
        expectedYiDangPercent: 80.976,
        expectedMaxSelfElement: '金',
        expectedMaxSelfPercent: 18.6704,
        expectedMaxOpposingElement: '土',
        expectedMaxOpposingPercent: 67.8925,
        expectedTransformationPassed: false,
    },
];
function normalizeValue(value) {
    return Number(value.toFixed(4));
}
function main() {
    const engine = new YongShenEngineV2Step4();
    TEST_CASES.forEach((testCase) => {
        const result = engine.analyzeStep1To7(testCase.input);
        const pattern = result.patternClassification;
        if (pattern.patternType !== testCase.expectedPatternType) {
            throw new Error(`${testCase.name} 格局不匹配: expected=${testCase.expectedPatternType} actual=${pattern.patternType}`);
        }
        if (pattern.effectiveDayMasterElement !== testCase.expectedEffectiveDayMasterElement) {
            throw new Error(`${testCase.name} 有效日主不匹配: expected=${testCase.expectedEffectiveDayMasterElement} actual=${pattern.effectiveDayMasterElement}`);
        }
        if (pattern.tongDangElements[0] !== testCase.expectedTongDangElements[0] ||
            pattern.tongDangElements[1] !== testCase.expectedTongDangElements[1]) {
            throw new Error(`${testCase.name} 同党元素不匹配: expected=${testCase.expectedTongDangElements.join(',')} actual=${pattern.tongDangElements.join(',')}`);
        }
        if (normalizeValue(pattern.tongDangScore) !== testCase.expectedTongDangScore) {
            throw new Error(`${testCase.name} 同党分数不匹配: expected=${testCase.expectedTongDangScore} actual=${pattern.tongDangScore}`);
        }
        if (normalizeValue(pattern.yiDangScore) !== testCase.expectedYiDangScore) {
            throw new Error(`${testCase.name} 异党分数不匹配: expected=${testCase.expectedYiDangScore} actual=${pattern.yiDangScore}`);
        }
        if (normalizeValue(pattern.tongDangRatio) !== testCase.expectedTongDangRatio) {
            throw new Error(`${testCase.name} 同党占比不匹配: expected=${testCase.expectedTongDangRatio} actual=${pattern.tongDangRatio}`);
        }
        if (normalizeValue(pattern.yiDangRatio) !== testCase.expectedYiDangRatio) {
            throw new Error(`${testCase.name} 异党占比不匹配: expected=${testCase.expectedYiDangRatio} actual=${pattern.yiDangRatio}`);
        }
        if (normalizeValue(pattern.tongDangPercent) !== testCase.expectedTongDangPercent) {
            throw new Error(`${testCase.name} 同党百分比不匹配: expected=${testCase.expectedTongDangPercent} actual=${pattern.tongDangPercent}`);
        }
        if (normalizeValue(pattern.yiDangPercent) !== testCase.expectedYiDangPercent) {
            throw new Error(`${testCase.name} 异党百分比不匹配: expected=${testCase.expectedYiDangPercent} actual=${pattern.yiDangPercent}`);
        }
        if (pattern.maxSelfElement !== testCase.expectedMaxSelfElement) {
            throw new Error(`${testCase.name} 同党最高单元素不匹配: expected=${testCase.expectedMaxSelfElement} actual=${pattern.maxSelfElement}`);
        }
        if (normalizeValue(pattern.maxSelfPercent) !== testCase.expectedMaxSelfPercent) {
            throw new Error(`${testCase.name} 同党最高单元素百分比不匹配: expected=${testCase.expectedMaxSelfPercent} actual=${pattern.maxSelfPercent}`);
        }
        if (pattern.maxOpposingElement !== testCase.expectedMaxOpposingElement) {
            throw new Error(`${testCase.name} 异党最高单元素不匹配: expected=${testCase.expectedMaxOpposingElement} actual=${pattern.maxOpposingElement}`);
        }
        if (normalizeValue(pattern.maxOpposingPercent) !== testCase.expectedMaxOpposingPercent) {
            throw new Error(`${testCase.name} 异党最高单元素百分比不匹配: expected=${testCase.expectedMaxOpposingPercent} actual=${pattern.maxOpposingPercent}`);
        }
        if (pattern.transformation.passed !== testCase.expectedTransformationPassed) {
            throw new Error(`${testCase.name} 化气格判定不匹配: expected=${testCase.expectedTransformationPassed} actual=${pattern.transformation.passed}`);
        }
        console.log(`\n[PASS] ${testCase.name}`);
        console.log(JSON.stringify({
            input: testCase.input,
            patternType: pattern.patternType,
            effectiveDayMasterElement: pattern.effectiveDayMasterElement,
            tongDangElements: pattern.tongDangElements,
            tongDangScore: pattern.tongDangScore,
            yiDangScore: pattern.yiDangScore,
            tongDangRatio: pattern.tongDangRatio,
            yiDangRatio: pattern.yiDangRatio,
            tongDangPercent: pattern.tongDangPercent,
            yiDangPercent: pattern.yiDangPercent,
            maxSelfElement: pattern.maxSelfElement,
            maxSelfPercent: pattern.maxSelfPercent,
            maxOpposingElement: pattern.maxOpposingElement,
            maxOpposingPercent: pattern.maxOpposingPercent,
            transformation: pattern.transformation,
        }, null, 2));
    });
}
main();
