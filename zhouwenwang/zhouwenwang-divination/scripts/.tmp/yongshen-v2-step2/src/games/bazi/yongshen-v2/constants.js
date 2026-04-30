export const FIVE_ELEMENTS = {
    generates: {
        木: '火',
        火: '土',
        土: '金',
        金: '水',
        水: '木',
    },
    destroys: {
        木: '土',
        土: '水',
        水: '火',
        火: '金',
        金: '木',
    },
};
export const STEMS = {
    甲: '木',
    乙: '木',
    丙: '火',
    丁: '火',
    戊: '土',
    己: '土',
    庚: '金',
    辛: '金',
    壬: '水',
    癸: '水',
};
export const HIDDEN_STEMS = {
    子: { 水: 1.0 },
    丑: { 土: 0.6, 水: 0.3, 金: 0.1 },
    寅: { 木: 0.6, 火: 0.3, 土: 0.1 },
    卯: { 木: 1.0 },
    辰: { 土: 0.6, 木: 0.3, 水: 0.1 },
    巳: { 火: 0.6, 金: 0.3, 土: 0.1 },
    午: { 火: 0.7, 土: 0.3 },
    未: { 土: 0.6, 火: 0.3, 木: 0.1 },
    申: { 金: 0.6, 水: 0.3, 土: 0.1 },
    酉: { 金: 1.0 },
    戌: { 土: 0.6, 金: 0.3, 火: 0.1 },
    亥: { 水: 0.7, 木: 0.3 },
};
export const ELEMENT_KEYS = ['金', '木', '水', '火', '土'];
export const POSITION_WEIGHTS = {
    0: 5,
    1: 10,
    2: 10,
    3: 40,
    4: 0,
    5: 15,
    6: 10,
    7: 10,
};
export const POSITION_LABELS = {
    0: '年干',
    1: '年支',
    2: '月干',
    3: '月支',
    4: '日干',
    5: '日支',
    6: '时干',
    7: '时支',
};
export const STEM_SCORE_INDEXES = [0, 2, 4, 6];
export const ROOT_CHECK_STEM_INDEXES = [0, 2, 6];
export const BRANCH_SCORE_INDEXES = [1, 3, 5, 7];
export const ADJACENT_STEM_PAIRS = [
    [0, 2],
    [2, 4],
    [4, 6],
];
export const STEM_COMBINATION_RULES = [
    { stems: ['甲', '己'], targetElement: '土' },
    { stems: ['乙', '庚'], targetElement: '金' },
    { stems: ['丙', '辛'], targetElement: '水' },
    { stems: ['丁', '壬'], targetElement: '木' },
    { stems: ['戊', '癸'], targetElement: '火' },
];
export const THREE_MEETING_RULES = [
    { priority: 'P1', mutationType: 'three-meeting', label: '寅卯辰三会木局', branches: ['寅', '卯', '辰'], targetElement: '木', transferRatio: 1, bonusRatio: 0.2 },
    { priority: 'P1', mutationType: 'three-meeting', label: '巳午未三会火局', branches: ['巳', '午', '未'], targetElement: '火', transferRatio: 1, bonusRatio: 0.2 },
    { priority: 'P1', mutationType: 'three-meeting', label: '申酉戌三会金局', branches: ['申', '酉', '戌'], targetElement: '金', transferRatio: 1, bonusRatio: 0.2 },
    { priority: 'P1', mutationType: 'three-meeting', label: '亥子丑三会水局', branches: ['亥', '子', '丑'], targetElement: '水', transferRatio: 1, bonusRatio: 0.2 },
];
export const THREE_HARMONY_RULES = [
    { priority: 'P2', mutationType: 'three-harmony', label: '亥卯未三合木局', branches: ['亥', '卯', '未'], targetElement: '木', transferRatio: 1 },
    { priority: 'P2', mutationType: 'three-harmony', label: '寅午戌三合火局', branches: ['寅', '午', '戌'], targetElement: '火', transferRatio: 1 },
    { priority: 'P2', mutationType: 'three-harmony', label: '巳酉丑三合金局', branches: ['巳', '酉', '丑'], targetElement: '金', transferRatio: 1 },
    { priority: 'P2', mutationType: 'three-harmony', label: '申子辰三合水局', branches: ['申', '子', '辰'], targetElement: '水', transferRatio: 1 },
];
export const HALF_HARMONY_RULES = [
    { priority: 'P4', mutationType: 'half-harmony', label: '亥卯半合木局', branches: ['亥', '卯'], targetElement: '木', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '卯未半合木局', branches: ['卯', '未'], targetElement: '木', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '寅午半合火局', branches: ['寅', '午'], targetElement: '火', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '午戌半合火局', branches: ['午', '戌'], targetElement: '火', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '巳酉半合金局', branches: ['巳', '酉'], targetElement: '金', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '酉丑半合金局', branches: ['酉', '丑'], targetElement: '金', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '申子半合水局', branches: ['申', '子'], targetElement: '水', transferRatio: 0.8 },
    { priority: 'P4', mutationType: 'half-harmony', label: '子辰半合水局', branches: ['子', '辰'], targetElement: '水', transferRatio: 0.8 },
];
export const SIX_COMBINATION_RULES = [
    { priority: 'P3', mutationType: 'six-combination', label: '子丑六合土', branches: ['子', '丑'], targetElement: '土', transferRatio: 1 },
    { priority: 'P3', mutationType: 'six-combination', label: '寅亥六合木', branches: ['寅', '亥'], targetElement: '木', transferRatio: 1 },
    { priority: 'P3', mutationType: 'six-combination', label: '卯戌六合火', branches: ['卯', '戌'], targetElement: '火', transferRatio: 1 },
    { priority: 'P3', mutationType: 'six-combination', label: '辰酉六合金', branches: ['辰', '酉'], targetElement: '金', transferRatio: 1 },
    { priority: 'P3', mutationType: 'six-combination', label: '巳申六合水', branches: ['巳', '申'], targetElement: '水', transferRatio: 1 },
    { priority: 'P3', mutationType: 'six-combination', label: '午未六合火', branches: ['午', '未'], targetElement: '火', transferRatio: 1 },
];
export const SAME_CLASH_RULES = [
    { priority: 'P5', mutationType: 'same-clash', label: '辰戌同类冲', branches: ['辰', '戌'], targetElement: '土', bonusRatio: 0.3 },
    { priority: 'P5', mutationType: 'same-clash', label: '丑未同类冲', branches: ['丑', '未'], targetElement: '土', bonusRatio: 0.3 },
];
export const OPPOSING_CLASH_RULES = [
    { priority: 'P5', mutationType: 'opposing-clash', label: '子午异类冲', branches: ['子', '午'], penaltyRatio: 0.3 },
    { priority: 'P5', mutationType: 'opposing-clash', label: '寅申异类冲', branches: ['寅', '申'], penaltyRatio: 0.3 },
    { priority: 'P5', mutationType: 'opposing-clash', label: '卯酉异类冲', branches: ['卯', '酉'], penaltyRatio: 0.3 },
    { priority: 'P5', mutationType: 'opposing-clash', label: '巳亥异类冲', branches: ['巳', '亥'], penaltyRatio: 0.3 },
];
export const THREE_PUNISHMENT_RULES = [
    { priority: 'P6', mutationType: 'three-punishment', label: '寅巳申三刑', branches: ['寅', '巳', '申'], penaltyRatio: 0.15 },
    { priority: 'P6', mutationType: 'three-punishment', label: '丑戌未三刑', branches: ['丑', '戌', '未'], penaltyRatio: 0.15 },
];
export const SIX_HARM_RULES = [
    { priority: 'P6', mutationType: 'six-harm', label: '子未六害', branches: ['子', '未'], penaltyRatio: 0.1 },
    { priority: 'P6', mutationType: 'six-harm', label: '丑午六害', branches: ['丑', '午'], penaltyRatio: 0.1 },
    { priority: 'P6', mutationType: 'six-harm', label: '寅巳六害', branches: ['寅', '巳'], penaltyRatio: 0.1 },
    { priority: 'P6', mutationType: 'six-harm', label: '卯辰六害', branches: ['卯', '辰'], penaltyRatio: 0.1 },
    { priority: 'P6', mutationType: 'six-harm', label: '申亥六害', branches: ['申', '亥'], penaltyRatio: 0.1 },
    { priority: 'P6', mutationType: 'six-harm', label: '酉戌六害', branches: ['酉', '戌'], penaltyRatio: 0.1 },
];
export function getBranchDominantElement(branch) {
    const hidden = HIDDEN_STEMS[branch];
    return ELEMENT_KEYS.reduce((currentBest, candidate) => {
        const bestRatio = hidden[currentBest] || 0;
        const candidateRatio = hidden[candidate] || 0;
        return candidateRatio > bestRatio ? candidate : currentBest;
    }, '土');
}
export function getGeneratedElement(element) {
    return FIVE_ELEMENTS.generates[element];
}
export function getGeneratorElement(targetElement) {
    return ELEMENT_KEYS.find((element) => FIVE_ELEMENTS.generates[element] === targetElement) || '土';
}
export function getDestroyedElement(element) {
    return FIVE_ELEMENTS.destroys[element];
}
export function getDestroyerElement(targetElement) {
    return ELEMENT_KEYS.find((element) => FIVE_ELEMENTS.destroys[element] === targetElement) || '土';
}
