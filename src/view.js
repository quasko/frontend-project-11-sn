import onChange from 'on-change';
import * as yup from 'yup';
const schema = yup.object({
    link: yup.string()
    .url()
    .required()
});
const handleProcessState = (submitButton, processState) => {
    switch(processState) {
        case 'sent':
            submitButton.disabled = true;
            break;
        case 'sending':
            submitButton.disabled = false;
            break;
        case 'error':
            submitButton.disabled = true;
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
                watchedState.form.dataState = 'valid';
                console.log('Congrats!')
                console.log(watchedState.form.dataState)
            })
            .catch (e => {
                watchedState.form.dataState = 'invalid'
                console.log(watchedState.form.dataState)
                console.log(e)
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
    const render = (statusMassage, state) => {
        console.log(statusMassage)
        console.log(state)
        const alertMassage = statusMassage;
        console.log(elements.form)
        switch(state) {
            case 'neutral':
                alertMassage.classList.remove('text-sucess', 'text-danger')
                alertMassage.innerHTML = '';
                break;
            case 'invalid':
                alertMassage.classList.remove('text-sucess', 'text-danger');
                alertMassage.classList.add('text-danger');
                alertMassage.innerHTML = 'Ссылка должна быть валидным URL';
                break;
            case 'valid':
                alertMassage.classList.remove('text-sucess', 'text-danger');
                alertMassage.classList.add('text-sucess');
                alertMassage.innerHTML = 'RSS успешно загружен';
                break;
            case 'dublicate':
                alertMassage.classList.remove('text-sucess', 'text-danger');
                alertMassage.classList.add('text-danger');
                alertMassage.innerHTML = 'RSS уже существует';
                break;
        }
    };
    const watchedState = onChange(state, render(elements.statusMassage, state.form.dataState));
    const form = elements.form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.form.processState = 'sending';

        handleProcessState(elements.submitButton, state.form.processState);

            if (state.form.data.includes(elements.input.value)) {
                watchedState.form.dataState = 'dublicate';
            } else {
                state.form.data.push(elements.input.value)
                validation(elements.input.value)
            } 
    });

};

export default app