import uniqueId from 'lodash/uniqueId.js';
import onChange from 'on-change';
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';

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
                    duplicate: 'RSS уже существует',
                    noRss: 'Ресурс не содержит валидный RSS'
                },
            }
          }
        }
      });

const schema = yup.object({
    link: yup.string().trim()
    .url()
    .required()
});

const handleProcessState = (submitButton, processState) => {
    
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

    const elements = {
        form: document.querySelector('.rss-form'),
        statusMassage: document.querySelector('.feedback'),
        input: document.querySelector('#url-input'),
        submitButton: document.querySelector('.btn-primary'),
        postsContainer: document.querySelector('.posts'),
        feedsContainer: document.querySelector('.feeds'),
        modalContent: document.querySelector('.modal-content'),
    };

    const postsData = {
        posts: [],
        feeds: [],
    }
    const initialState = {
        form: {
            processState: 'filling',
            data: [],
            validRSS: true,
            dataState: 'neutral',
            field: ''
        }
    };

    const validation = (field) => {
            schema.validate({link: field}, {abortEarly: true})
            .then(() => {
                initialState.form.data.push(elements.input.value);
                watchedState.form.dataState = 'valid';
                initialState.form.processState = 'sent';
                handleProcessState(elements.submitButton, initialState.form.processState);
            })
            .catch(e => {
                initialState.form.processState = 'error';
                watchedState.form.dataState = 'invalid';
                handleProcessState(elements.submitButton, initialState.form.processState);  
            }) 
    };

    const renderForm = (status) => (path, value) =>  {
        
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
            case 'noRss':
                status.classList.remove('text-sucess', 'text-danger');
                status.classList.add('text-danger');
                status.textContent = i18nextInstance.t('statusMessage.noRss');
                elements.input.value = '';
                elements.input.focus() 
            default:
                throw new Error(`Unknown data state: ${value}`);
        }
    };
    const buildList = () => {
        const cardBorder = document.createElement('div');
        cardBorder.classList.add('card', 'border-0');
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        const cardTitle = document.createElement('h2');
        cardTitle.classList.add('card-title', 'h4');
        const listGroup = document.createElement('ul');
        listGroup.classList.add('list-group', 'border-0', 'rounded-0');
        cardBody.append(cardTitle);
        cardBorder.append(cardBody, listGroup);
        return cardBorder;
    };

    const renderFeeds = () => (path, values) => {
        const feedsContainer = elements.feedsContainer;
        feedsContainer.innerHTML = '';
        const feedContainer = buildList();
        const fUl = feedContainer.querySelector('ul');
        const feedtitle = feedContainer.querySelector('h2');
        feedtitle.textContent = 'Фиды';
        values.forEach(value => {
            const feedList = document.createElement('li');
            feedList.classList.add('list-group-item', 'border-0', 'border-end-0')
            const feedMinititle = document.createElement('h3');
            const feedDescription = document.createElement('p');
            feedList.append(feedMinititle, feedDescription);
            feedMinititle.classList.add('h6', 'm-0');
            feedMinititle.textContent = value.feedTitle;
            feedDescription.textContent = value.feedSubtitle;
            feedDescription.classList.add('small', 'm-0', 'text-black-50');
            fUl.append(feedList);
            feedsContainer.append(feedContainer);
        })
    };

    const renderPosts = () => (path, values) => {
        
        const postsContainer = elements.postsContainer;
        postsContainer.innerHTML = '';
        const postContainer = buildList(); 
        const pUl = postContainer.querySelector('ul');
        const postTitle = postContainer.querySelector('h2');
        postTitle.textContent = 'Посты';

        values.forEach(value => {
            const postList = document.createElement('li');
            postList.classList.add('list-group-item', 'border-0', 'border-end-0', 'justify-content-between', 'align-items-start', 'd-flex')
            const postLink = document.createElement('a');
            const button = document.createElement('button'); 
            postList.append(postLink, button)
            postLink.outerHTML = `<a href= ${value.link} class='fw-bold' data-id="${value.id}" target="_blank" rel="noopener noreferrer">${value.title}</a>`;
            button.outerHTML = `<button type="button" data-id="${value.id}" data-bs-toggle="modal" class="btn btn-outline-primary btn-sm" data-bs-target="#modal">Просмотр</button>`;
            button.addEventListener('click', () => {
                console.log('BU')
                const modalContent = elements.modalContent;
                const modalTitle = modalContent.querySelector('.modal-title');
                console.log(modalTitle)
                const modalBody = modalContent.querySelector('.modal-body');
                modalTitle.textContent = value.title;
                modalBody.textContent = value.description;
            });
            pUl.append(postList);
            postsContainer.append(postContainer);
        })  
        
    };
    const watchedfeedsData = onChange(postsData, renderFeeds());
    const watchedpostsData = onChange(postsData, renderPosts());

    const watchedState = onChange(initialState, renderForm(elements.statusMassage));

    const buildTree = (doc) => {

        const feedsTitle = doc.querySelector('channel > title');
        const feedsSubtitle = doc.querySelector('channel > description'); 
        const items = doc.querySelectorAll('item');
        const id = uniqueId();
        watchedfeedsData.feeds.push({id: id, feedTitle: feedsTitle.textContent, feedSubtitle: feedsSubtitle.textContent});
        items.forEach(item => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const description = item.querySelector('description').textContent;
            watchedpostsData.posts.push({
                feedId: id,
                id: uniqueId(),
                title, 
                link,
                description,
            });
        });
    };

    const domParser = (rssText) => {
        const doc = new DOMParser().parseFromString(rssText, "application/xml");
        const error = doc.querySelector('parsererror');
        console.log(doc)
        !error ? buildTree(doc) : watchedState.form.dataState = 'noRss'
        
    };

    const getRSS = (url) => {
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
      .then(response => response.data)
      .then(data => domParser(data.contents));
    };
    
    const form = elements.form;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        initialState.form.processState = 'sending';

        handleProcessState(elements.submitButton, initialState.form.processState);

            if (initialState.form.data.includes(elements.input.value)) {
                watchedState.form.dataState = 'duplicate';
                initialState.form.processState = 'error';
                handleProcessState(elements.submitButton, initialState.form.processState);
            } else {
                validation(elements.input.value);
                getRSS(elements.input.value);
            };  
    });

};

export default app