import { useEffect } from 'react';

function Form({ onInputFocus }) {
    useEffect(() => {
        const firstInput = document.querySelector('#first');
        const secondInput = document.querySelector('#second');
        const submitButton = document.querySelector('#submit');

        if (firstInput && secondInput && submitButton) {
            firstInput.addEventListener('focus', onInputFocus);
            secondInput.addEventListener('focus', onInputFocus);
            submitButton.addEventListener('focus', onInputFocus);
        }

        return () => {
            if (firstInput && secondInput && submitButton) {
                firstInput.removeEventListener('focus', onInputFocus);
                secondInput.removeEventListener('focus', onInputFocus);
                submitButton.removeEventListener('focus', onInputFocus);
            }
        };
    }, [onInputFocus]);
}

export default Form;