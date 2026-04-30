import { YongShenEngineV2Step3, } from '../src/games/bazi/yongshen-v2/index.js';
const TEST_CASES = [
    {
        name: 'case-1',
        input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'],
        expectedScores: {
            金: 0,
            木: 112.5,
            水: 9,
            火: 8.4,
            土: 4,
        },
        expectedTotal: 133.9,
        expectedMonthElement: '木',
        expectedStates: {
            金: '囚',
            木: '旺',
            水: '休',
            火: '相',
            土: '死',
        },
    },
    {
        name: 'case-2',
        input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'],
        expectedScores: {
            金: 26.4,
            木: 10.4,
            水: 0.5,
            火: 8.1,
            土: 96,
        },
        expectedTotal: 141.4,
        expectedMonthElement: '土',
        expectedStates: {
            金: '相',
            木: '囚',
            水: '死',
            火: '休',
            土: '旺',
        },
    },
];
function normalizeScores(scores) {
    return {
        金: Number(scores.金.toFixed(4)),
        木: Number(scores.木.toFixed(4)),
        水: Number(scores.水.toFixed(4)),
        火: Number(scores.火.toFixed(4)),
        土: Number(scores.土.toFixed(4)),
    };
}
function assertScores(actual, expected, label) {
    Object.keys(expected).forEach((element) => {
        if (actual[element] !== expected[element]) {
            throw new Error(`${label} 分数不匹配: ${element} expected=${expected[element]} actual=${actual[element]}`);
        }
    });
}
function assertStates(actual, expected, label) {
    Object.keys(expected).forEach((element) => {
        if (actual[element] !== expected[element]) {
            throw new Error(`${label} 状态不匹配: ${element} expected=${expected[element]} actual=${actual[element]}`);
        }
    });
}
function main() {
    const engine = new YongShenEngineV2Step3();
    TEST_CASES.forEach((testCase) => {
        const result = engine.analyzeStep1To6(testCase.input);
        const normalizedScores = normalizeScores(result.finalScores);
        const actualStates = result.seasonalAdjustment.adjustments.reduce((accumulator, item) => {
            accumulator[item.element] = item.state;
            return accumulator;
        }, { 金: '囚', 木: '囚', 水: '囚', 火: '囚', 土: '囚' });
        assertScores(normalizedScores, testCase.expectedScores, `${testCase.name} final`);
        assertStates(actualStates, testCase.expectedStates, `${testCase.name} seasonal`);
        if (result.totalScore !== testCase.expectedTotal) {
            throw new Error(`${testCase.name} total 不匹配: expected=${testCase.expectedTotal} actual=${result.totalScore}`);
        }
        if (result.seasonalAdjustment.monthBranchDominantElement !== testCase.expectedMonthElement) {
            throw new Error(`${testCase.name} 月支主气不匹配: expected=${testCase.expectedMonthElement} actual=${result.seasonalAdjustment.monthBranchDominantElement}`);
        }
        console.log(`\n[PASS] ${testCase.name}`);
        console.log(JSON.stringify({
            input: testCase.input,
            monthBranchDominantElement: result.seasonalAdjustment.monthBranchDominantElement,
            finalScores: normalizedScores,
            totalScore: result.totalScore,
            seasonalAdjustment: result.seasonalAdjustment.adjustments,
        }, null, 2));
    });
}
main();
