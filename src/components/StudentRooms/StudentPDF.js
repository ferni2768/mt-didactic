import React, { useEffect, useRef } from 'react';
import Background from '../../visualComponents/Background';
import { useTranslation } from 'react-i18next';
import { getFromSessionStorage } from '../../utils/storageUtils';

const TeacherPDF = () => {

    const { t } = useTranslation();

    // Example JSON data
    const jsonData = {
        "iteration1": {
            "results": {
                "diphthong": 68,
                "hiatus": 45,
                "general": 94
            },
            "errors": {
                "apple": ["H", "D"],
                "banana": ["G", "H"],
                "cherry": ["D", "G"],
                "date": ["H", "G"],
                "elderberry": ["D", "H"],
                "fig": ["G", "D"],
                "grape": ["H", "G"],
                "honeydew": ["D", "H"],
                "kiwi": ["G", "D"],
                "lemon": ["H", "D"]
            }
        },
        "iteration2": {
            "results": {
                "diphthong": 75,
                "hiatus": 55,
                "general": 85
            },
            "errors": {
                "mango": ["D", "H"],
                "nectarine": ["G", "D"],
                "orange": ["H", "G"],
                "papaya": ["D", "H"],
                "quince": ["G", "D"],
                "raspberry": ["H", "G"],
                "strawberry": ["D", "H"],
                "tangerine": ["G", "D"],
                "ugli": ["H", "G"],
                "vanilla": ["D", "H"]
            }
        },
        "iteration3": {
            "results": {
                "diphthong": 80,
                "hiatus": 60,
                "general": 90
            },
            "errors": {
                "watermelon": ["G", "H"],
                "xigua": ["D", "G"],
                "yam": ["H", "D"],
                "zucchini": ["G", "H"],
                "apricot": ["D", "G"],
                "blackberry": ["H", "D"],
                "cantaloupe": ["G", "H"],
                "dragonfruit": ["D", "G"],
                "elderflower": ["H", "D"],
                "fig": ["G", "H"]
            }
        },
        "iteration4": {
            "results": {
                "diphthong": 85,
                "hiatus": 65,
                "general": 95
            },
            "errors": {
                "grapefruit": ["D", "H"],
                "huckleberry": ["G", "D"],
                "jackfruit": ["H", "G"],
                "kiwano": ["D", "H"],
                "lime": ["G", "D"],
                "mulberry": ["H", "G"],
                "nectarine": ["D", "H"],
                "olive": ["G", "D"],
                "peach": ["H", "G"],
                "quince": ["D", "H"]
            }
        },
        "iteration5": {
            "results": {
                "diphthong": 90,
                "hiatus": 70,
                "general": 100
            },
            "errors": {
                "raspberry": ["G", "H"],
                "strawberry": ["D", "G"],
                "tamarind": ["H", "D"],
                "ugli": ["G", "H"],
                "vanilla": ["D", "G"],
                "watermelon": ["H", "D"],
                "xigua": ["G", "H"],
                "yam": ["D", "G"],
                "zucchini": ["H", "D"],
                "apple": ["G", "H"]
            }
        },
        "iteration6": {
            "results": {
                "diphthong": 95,
                "hiatus": 75,
                "general": 45
            },
            "errors": {
                "banana": ["D", "H"],
                "cherry": ["G", "D"],
                "date": ["H", "G"],
                "elderberry": ["D", "H"],
                "fig": ["G", "D"],
                "grape": ["H", "G"],
                "honeydew": ["D", "H"],
                "kiwi": ["G", "D"],
                "lemon": ["H", "G"],
                "mango": ["D", "H"]
            }
        }
    };

    const history = JSON.parse(getFromSessionStorage('iterationData')) || jsonData;
    const student = JSON.parse(getFromSessionStorage('loggedInStudent')) || '';
    const classCode = getFromSessionStorage('loggedInClassCode') || '';

    // Function to retrieve specific values from history
    const getValue = (iteration, key, subKey = null, subIndex = null) => {
        if (!history || !history[`iteration${iteration}`]) return null;

        let value = history[`iteration${iteration}`][key];
        if (subKey !== null && typeof value === 'object' && value[subKey] !== undefined) {
            value = value[subKey];
        }
        if (subIndex !== null && Array.isArray(value)) {
            value = value[subIndex];
        }

        return value;
    };

    const initialPrecision = ((getValue(1, 'results', 'diphthong') + getValue(1, 'results', 'hiatus')
        + getValue(1, 'results', 'general')) / 3 + (Math.random() * 0.68 - 0.34)).toFixed(2) || 0;

    // Function to map labels to inline styles
    const getStyleForLabel = (label) => {
        switch (label) {
            case 'D':
                return { color: '#cfb838', fontWeight: 500 };
            case 'H':
                return { color: '#127edd', fontWeight: 500 };
            case 'G':
                return { color: '#ee1212', fontWeight: 500 };
            default:
                return { color: '#1c1c1c', fontWeight: 500 };
        }
    };

    // Generate graph containers
    const graphContainers = [];
    for (let i = 1; i <= 6; i++) {
        const diphthongValue = getValue(i, 'results', 'diphthong');
        const hiatusValue = getValue(i, 'results', 'hiatus');
        const generalValue = getValue(i, 'results', 'general');

        // Calculate the total error count
        let totalErrors = 0;
        for (let i = 1; i <= 5; i++) {
            const errors = getValue(i, 'errors');
            if (errors) {
                totalErrors += Object.keys(errors).length;
            }
        }

        let errorDisplayContent;
        if (i === 6) {
            errorDisplayContent = <div>
                <div> <a className='font-bold'>{t('initialPrecision')}: </a>{initialPrecision}% </div>
                <div> <a className='font-bold'>{t('finalPrecision')}: </a> {getFromSessionStorage('loggedInScore')}% </div>
                <div> <a className='font-bold'>{t('totalErrors')}: </a>{totalErrors}</div>

            </div>;
        } else {
            const errors = getValue(i, 'errors');
            const errorList = [];
            if (errors) {
                const errorKeys = Object.keys(errors);
                for (let j = 0; j < Math.min(10, errorKeys.length); j++) {
                    const word = errorKeys[j];
                    const characters = errors[word];

                    const div = document.createElement('div');

                    const wordElement = document.createElement('a');
                    wordElement.textContent = `${word}: `;
                    div.appendChild(wordElement);

                    const correctLabelElement = document.createElement('a');
                    Object.assign(correctLabelElement.style, getStyleForLabel(characters[1]));
                    correctLabelElement.textContent = characters[1];
                    div.appendChild(correctLabelElement);

                    const noElement = document.createElement('a');
                    noElement.textContent = `${t('no')} `;
                    div.appendChild(noElement);

                    const mistakenLabelElement = document.createElement('a');
                    Object.assign(mistakenLabelElement.style, getStyleForLabel(characters[0]));
                    mistakenLabelElement.textContent = characters[0];
                    div.appendChild(mistakenLabelElement);

                    errorList.push(div);
                }
            }
            errorDisplayContent = errorList.map((error, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: error.outerHTML }} />
            ));
        }

        graphContainers.push(
            <div className='graph-container-pdf' key={i}>
                <div className='graph-title-pdf move-down-pdf'>
                    {i === 6 ? `${t('finalIteration')}` : `${t('iteration')} ${i}`}
                </div>

                <div className='graph-base-pdf'>
                    <div>
                        <div className="flex justify-center">
                            <div className="graph-bar-container-pdf light diphthong">
                                <div className="graph-bar-pdf diphthong" style={{ height: `${diphthongValue * 0.8}%` }}>
                                    <div className='graph-bar-text-pdf' style={{ left: diphthongValue === 100 ? '0' : '0.55rem' }}>
                                        {diphthongValue}
                                    </div>
                                </div>
                            </div>

                            <div className="graph-bar-container-pdf light hiatus">
                                <div className="graph-bar-pdf hiatus" style={{ height: `${hiatusValue * 0.8}%` }}>
                                    <div className='graph-bar-text-pdf' style={{ left: hiatusValue === 100 ? '0' : '0.55rem' }}>
                                        {hiatusValue}
                                    </div>
                                </div>
                            </div>

                            <div className="graph-bar-container-pdf light general">
                                <div className="graph-bar-pdf general" style={{ height: `${generalValue * 0.8}%` }}>
                                    <div className='graph-bar-text-pdf' style={{ left: generalValue === 100 ? '0' : '0.55rem' }}>
                                        {generalValue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='graph-footer-pdf justify-center'>
                        <div className='move-up-pdf'>
                            {t('d')}&nbsp;&nbsp;&nbsp;{t('h')}&nbsp;&nbsp;&nbsp;{t('g')}
                        </div>
                    </div>

                </div>

                <div className='graph-error-list-pdf'>
                    {errorDisplayContent}
                </div>
            </div>
        );
    }


    // Generate percentage indicators
    const percentageIndicatorsVW = [];
    const percentageIndicatorsVH = [];

    for (let i = 0; i <= 100; i += 1) {
        percentageIndicatorsVW.push(
            <div key={`vw-${i}`} style={{ position: 'absolute', top: '0', left: `${i}%`, transform: 'translateX(-50%)' }}>
                {`${i}%`}
            </div>
        );

        percentageIndicatorsVH.push(
            <div key={`vh-${i}`} style={{ position: 'absolute', top: `${i}%`, left: '0', transform: 'translateY(-50%)' }}>
                {`${i}%`}
            </div>
        );
    }


    return (
        <Background>
            <div>
                <div className="inside-card-pdf">
                    <h1 className='pb-2'>{t('results')} {student.name} {classCode}</h1>

                    <div className='flex'>
                        {graphContainers}
                    </div>
                </div>
            </div>
            {/* <div className="percentage-indicator-container" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                {percentageIndicatorsVW}
                {percentageIndicatorsVH}
            </div> */}
        </Background>
    );
};

export default TeacherPDF;
