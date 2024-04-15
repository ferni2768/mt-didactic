import React from 'react';
import PropTypes from 'prop-types';

function PlayWordSelector({ answerCombos, handleComboChange, addNewWord }) {
    const renderCheckbox = (index, label) => (
        <label htmlFor={`checkbox${label}_${index}`} key={`checkbox_${label}_${index}`}>
            <input
                id={`checkbox${label}_${index}`}
                type="checkbox"
                className={`custom-checkbox custom-checkbox-${label.toLowerCase()}`}
                value={label}
                checked={answerCombos[index].label === label}
                onChange={() => handleComboChange(index, 'label', label)}
            />
            {label}
        </label>
    );

    return (
        <div className="word-combos-container">
            {answerCombos.map((combo, index) => (
                <div className="word-input blurred-input" key={`wordCombo_${index}`}>
                    <label className="word-input-label" htmlFor={`wordInput_${index}`}></label>
                    <input
                        id={`wordInput_${index}`}
                        className="blurred-input"
                        type="text"
                        value={combo.word}
                        onChange={(event) => handleComboChange(index, 'word', event.target.value)}
                        placeholder="Palabra"
                    />
                    {['D', 'H', 'N'].map(label => renderCheckbox(index, label))}
                </div>
            ))}
            <button onClick={addNewWord}>+ Add Word</button>
        </div>
    );
}

PlayWordSelector.propTypes = {
    answerCombos: PropTypes.arrayOf(
        PropTypes.shape({
            word: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
    handleComboChange: PropTypes.func.isRequired,
};

export default PlayWordSelector;
