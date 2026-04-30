import { YongShenEngineV2Step2, } from '../src/games/bazi/yongshen-v2/index.js';
const TEST_CASES = [
    {
        name: 'case-1',
        input: ['戊', '寅', '乙', '卯', '乙', '亥', '壬', '午'],
        expectedScores: {
            金: 0,
            木: 75,
            水: 10,
            火: 7,
            土: 8,
        },
        expectedTotal: 100,
        expectedStemCombinationCount: 0,
        expectedBranchMutationLabels: ['寅亥六合木'],
    },
    {
        name: 'case-2',
        input: ['丁', '丑', '庚', '戌', '壬', '子', '甲', '辰'],
        expectedScores: {
            金: 22,
            木: 13,
            水: 1,
            火: 9,
            土: 64,
        },
        expectedTotal: 109,
        expectedStemCombinationCount: 0,
        expectedBranchMutationLabels: ['子丑六合土', '辰戌同类冲'],
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
function assertMutationLabels(actual, expectedLabels, label) {
    const actualLabels = actual.map((item) => item.label);
    if (actualLabels.length !== expectedLabels.length) {
        throw new Error(`${label} 规则条数不匹配: expected=${expectedLabels.length} actual=${actualLabels.length}`);
    }
    expectedLabels.forEach((expectedValue, index) => {
        if (actualLabels[index] !== expectedValue) {
            throw new Error(`${label} 规则标签不匹配: index=${index} expected=${expectedValue} actual=${actualLabels[index]}`);
        }
    });
}
function main() {
    const engine = new YongShenEngineV2Step2();
    TEST_CASES.forEach((testCase) => {
        const result = engine.analyzeStep1To5(testCase.input);
        const normalizedScores = normalizeScores(result.finalScores);
        assertScores(normalizedScores, testCase.expectedScores, `${testCase.name} final`);
        assertMutationLabels(result.branchMutations.applications, testCase.expectedBranchMutationLabels, `${testCase.name} branch`);
        if (result.totalScore !== testCase.expectedTotal) {
            throw new Error(`${testCase.name} total 不匹配: expected=${testCase.expectedTotal} actual=${result.totalScore}`);
        }
        if (result.stemCombinations.applications.length !== testCase.expectedStemCombinationCount) {
            throw new Error(`${testCase.name} 天干五合条数不匹配: expected=${testCase.expectedStemCombinationCount} actual=${result.stemCombinations.applications.length}`);
        }
        console.log(`\n[PASS] ${testCase.name}`);
        console.log(JSON.stringify({
            input: testCase.input,
            finalScores: normalizedScores,
            totalScore: result.totalScore,
            stemCombinations: result.stemCombinations.applications,
            branchMutations: result.branchMutations.applications,
        }, null, 2));
    });
}
main();
