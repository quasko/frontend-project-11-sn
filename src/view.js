import onChange from 'on-change';
import i18next from 'i18next';
import * as yup from 'yup';

const i18nextInstance = i18next.createInstance();

i18nextInstance.init({
    lng: 'ru', 
    debug: true,
    resources: {
        ru: {
            translation: {
                statusMessage: {
                    neutral: '',
                    valid: 'RSS успешно загружен',
                    invalid: 'Ссылка должна быть валидным URL',
                    duplicate: 'RSS уже существует'
                },
            }
          }
        }
      });

const schema = yup.object({
    link: yup.string()
    .url()
    .required()
});

const handleProcessState = (submitButton, processState) => {
    console.log(processState)
    switch(processState) {
        case 'sent':
            submitButton.disabled = false;
            break;
        case 'sending':
            submitButton.disabled = true;
            break;
        case 'error':
            submitButton.disabled = false;
        case 'filling':
            submitButton.disabled = false;
            break;
        default:
            throw new Error(`Unknown process state: ${processState}`);
    }
};
const app = () => {

    const validation = (field) => {
            schema.validate({link: field}, {abortEarly: true})
            .then(() => {
                state.form.data.push(elements.input.value);
                watchedState.form.dataState = 'valid';
                state.form.processState = 'sent';
                handleProcessState(elements.submitButton, state.form.processState);
            })
            .catch(e => {
                state.form.processState = 'error';
                watchedState.form.dataState = 'invalid';
                handleProcessState(elements.submitButton, state.form.processState);
                
            }) 
    };

    const elements = {
        form: document.querySelector('.rss-form'),
        statusMassage: document.querySelector('.feedback'),
        input: document.querySelector('#url-input'),
        submitButton: document.querySelector('.btn-primary'),
    };

    const state = {
        form: {
            processState: 'filling',
            data: [],
            valid: true,
            dataState: 'neutral',
            field: ''
        }
    };

    const render = (status) => (path, value) =>  {
        switch(value) {
            case 'neutral':
                status.classList.remove('text-sucess', 'text-danger');
                status.textContent = i18nextInstance.t('statusMessage.neutral');
                break;
            case 'invalid':
                status.classList.remove('text-sucess', 'text-danger');
                status.classList.add('text-danger');
                status.textContent = i18nextInstance.t('statusMessage.invalid');
                elements.input.value = '';
                elements.input.focus()

                break;
            case 'valid':
                status.classList.remove('text-sucess', 'text-danger');
                status.classList.add('text-sucess');
                status.textContent = i18nextInstance.t('statusMessage.valid');
                elements.input.value = '';
                elements.input.focus() 
                break;
            case 'duplicate':
                status.classList.remove('text-sucess', 'text-danger');
                status.classList.add('text-danger');
                status.textContent = i18nextInstance.t('statusMessage.duplicate');
                elements.input.value = '';
                elements.input.focus() 
                break;
            default:
                throw new Error(`Unknown data state: ${value}`);
        }
    };

    const watchedState = onChange(state, render(elements.statusMassage));

    const form = elements.form;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.form.processState = 'sending';

        handleProcessState(elements.submitButton, state.form.processState);

            if (state.form.data.includes(elements.input.value)) {
                watchedState.form.dataState = 'duplicate';
                state.form.processState = 'error';
                handleProcessState(elements.submitButton, state.form.processState);
            } else {
                validation(elements.input.value);
            };  
    });

};

export default app