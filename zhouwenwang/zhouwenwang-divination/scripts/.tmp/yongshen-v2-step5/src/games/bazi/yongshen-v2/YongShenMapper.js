import { ELEMENT_KEYS, getDestroyedElement, getDestroyerElement, getGeneratedElement, getGeneratorElement, } from './constants.js';
function cloneScores(scores) {
    return {
        金: scores.金,
        木: scores.木,
        水: scores.水,
        火: scores.火,
        土: scores.土,
    };
}
function uniqueOrdered(elements) {
    return elements.filter((element, index) => elements.indexOf(element) === index);
}
function moveToFront(list, element) {
    return [element, ...list.filter((item) => item !== element)];
}
export class YongShenMapper {
    mapYongShen(baseScore, patternClassification) {
        const inputScores = patternClassification.inputScores;
        const monthBranch = baseScore.baziInput[3];
        const effectiveDayMasterElement = patternClassification.effectiveDayMasterElement;
        let maxElement = null;
        let yongElements = [];
        let jiElements = [];
        const notes = [];
        switch (patternClassification.patternType) {
            case '化气格': {
                const targetElement = patternClassification.transformation.targetElement;
                yongElements = [targetElement, getGeneratorElement(targetElement)];
                jiElements = [getDestroyerElement(targetElement)];
                notes.push('按化气格快捷输出喜忌');
                break;
            }
            case '专旺格': {
                yongElements = [effectiveDayMasterElement, getGeneratedElement(effectiveDayMasterElement)];
                jiElements = [getDestroyerElement(effectiveDayMasterElement)];
                notes.push('按专旺格输出喜忌');
                break;
            }
            case '假专旺格': {
                yongElements = [effectiveDayMasterElement, getGeneratedElement(effectiveDayMasterElement)];
                jiElements = [getDestroyerElement(effectiveDayMasterElement)];
                notes.push('按假专旺格处理，喜忌映射沿用专旺格');
                break;
            }
            case '从格': {
                maxElement = this.findMaxElement(inputScores);
                yongElements = [maxElement, getGeneratorElement(maxElement)];
                jiElements = [effectiveDayMasterElement, getGeneratorElement(effectiveDayMasterElement)];
                notes.push('按从格输出喜忌');
                break;
            }
            case '假从格': {
                maxElement = this.findMaxElement(inputScores);
                yongElements = [maxElement, getGeneratorElement(maxElement)];
                jiElements = [effectiveDayMasterElement, getGeneratorElement(effectiveDayMasterElement)];
                notes.push('按假从格处理，喜忌映射沿用从格');
                break;
            }
            case '身旺格': {
                yongElements = [
                    getDestroyedElement(effectiveDayMasterElement),
                    getGeneratedElement(effectiveDayMasterElement),
                    getDestroyerElement(effectiveDayMasterElement),
                ];
                jiElements = [effectiveDayMasterElement, getGeneratorElement(effectiveDayMasterElement)];
                notes.push('按身旺格输出喜忌');
                break;
            }
            case '身弱格': {
                yongElements = [getGeneratorElement(effectiveDayMasterElement), effectiveDayMasterElement];
                jiElements = [
                    getDestroyerElement(effectiveDayMasterElement),
                    getDestroyedElement(effectiveDayMasterElement),
                    getGeneratedElement(effectiveDayMasterElement),
                ];
                notes.push('按身弱格输出喜忌');
                break;
            }
            default:
                break;
        }
        const climateAdjustment = this.applyClimateAdjustment(monthBranch, patternClassification.patternType, yongElements, jiElements);
        return {
            inputScores: cloneScores(inputScores),
            patternType: patternClassification.patternType,
            effectiveDayMasterElement,
            maxElement,
            yongElements: uniqueOrdered(yongElements),
            jiElements: uniqueOrdered(jiElements),
            climateAdjustment,
            notes,
        };
    }
    findMaxElement(scores) {
        return ELEMENT_KEYS.reduce((currentMax, candidate) => {
            return scores[candidate] > scores[currentMax] ? candidate : currentMax;
        }, '土');
    }
    applyClimateAdjustment(monthBranch, patternType, yongElements, jiElements) {
        if (patternType !== '身旺格' && patternType !== '身弱格') {
            return {
                applied: false,
                adjustmentType: null,
                insertedYongElement: null,
                forcedJiElement: null,
                reasons: ['仅对身旺格和身弱格执行调候终极修正'],
            };
        }
        if (['亥', '子', '丑'].includes(monthBranch)) {
            const insertedYongElement = '火';
            const forcedJiElement = '水';
            const nextYongElements = moveToFront(yongElements, insertedYongElement);
            yongElements.splice(0, yongElements.length, ...nextYongElements);
            jiElements.push(forcedJiElement);
            return {
                applied: true,
                adjustmentType: 'winter-fire-first',
                insertedYongElement,
                forcedJiElement,
                reasons: ['月支属于亥子丑，按调候规则强制火为先用，水入忌'],
            };
        }
        if (['巳', '午', '未'].includes(monthBranch)) {
            const insertedYongElement = '水';
            const forcedJiElement = '火';
            const nextYongElements = moveToFront(yongElements, insertedYongElement);
            yongElements.splice(0, yongElements.length, ...nextYongElements);
            jiElements.push(forcedJiElement);
            return {
                applied: true,
                adjustmentType: 'summer-water-first',
                insertedYongElement,
                forcedJiElement,
                reasons: ['月支属于巳午未，按调候规则强制水为先用，火入忌'],
            };
        }
        return {
            applied: false,
            adjustmentType: null,
            insertedYongElement: null,
            forcedJiElement: null,
            reasons: ['当前月支不触发调候终极修正'],
        };
    }
}
