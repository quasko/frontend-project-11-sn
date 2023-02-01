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
        newPosts: [],
        feeds: []
    };

    const initialState = {
        form: {
            processState: 'filling',
            data: [],
            validRSS: true,
            dataState: 'neutral',
            field: ''
        }
    };

    elements.postsContainer.addEventListener('click', (e) => {
        switch(e.target.nodeName) {
            case('A'):
            e.target.className = 'fw-normal link-secondary';
                break;
            case('BUTTON'):
            const link = e.target.previousElementSibling;
            link.className = 'fw-normal link-secondary';
            const popUp = elements.modalContent;
            const header = popUp.querySelector('.modal-title');
            const block = popUp.querySelector('.modal-body');
            const modalLink = popUp.querySelector('.full-article');
            const title = postsData.posts.find(post => post.id === e.target.dataset.id).title
            const description = postsData.posts.find(post => post.id === e.target.dataset.id).description
            modalLink.href = link.href;
            header.textContent = title;
            block.textContent = description;
                break;
            default:
                break;
        }
    });

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

    const checkUpdates = (urls) => {
        urls.forEach( url => {
            prepareDataForUpdate(url)
        })
        setTimeout(() => checkUpdates(urls), 5000)
    };

    const prepareDataForUpdate = (url) => {
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
        .then(response => response.data)
        .then(data => {
           const doc = new DOMParser().parseFromString(data.contents, "application/xml");
           const items = doc.querySelectorAll('item');
           const feedTitle = doc.querySelector('channel > title');
           const dataTitle = postsData.feeds.filter(feed => feed.feedTitle === feedTitle.textContent)[0];
           const id = dataTitle.id;
           items.forEach(item => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const description = item.querySelector('description').textContent;
            if (postsData.posts.filter(post => post.link === link).length === 0) {
                watchedUpdatesData.newPosts.push({
                    feedId: id,
                    id: uniqueId(),
                    title, 
                    link,
                    description,
                });
            };
        });
     });        
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

    const renderUpdates = () => (path, values) => {
        console.log(values)
        values.forEach(value => {
                console.log(value);
                postsData.posts.push(value)
                const pUl = elements.postsContainer.querySelector('ul');
                const postList = document.createElement('li');
                postList.classList.add('list-group-item', 'border-0', 'border-end-0', 'justify-content-between', 'align-items-start', 'd-flex')
                const postLink = document.createElement('a');
                const button = document.createElement('button'); 
                postList.append(postLink, button)
                postLink.outerHTML = `<a href= ${value.link} class='fw-bold' data-id="${value.id}" target="_blank" rel="noopener noreferrer">${value.title}</a>`;
                button.outerHTML = `<button type="button" data-id="${value.id}" data-bs-toggle="modal" class="btn btn-outline-primary btn-sm" data-bs-target="#modal">Просмотр</button>`;
                pUl.append(postList);
        });
        postsData.newPosts = [];
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
        });
        setTimeout(() => checkUpdates(initialState.form.data), 5000);
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
            pUl.append(postList);
            postsContainer.append(postContainer);
        });  
    };
    const watchedUpdatesData = onChange(postsData, renderUpdates());
    const watchedfeedsData = onChange(postsData, renderFeeds());
    const watchedpostsData = onChange(postsData, renderPosts());
    const watchedState = onChange(initialState, renderForm(elements.statusMassage));

    const buildTree = (doc) => {
        const feedsTitle = doc.querySelector('channel > title');
        const feedsSubtitle = doc.querySelector('channel > description'); 
        const items = doc.querySelectorAll('item');
        const id = uniqueId();

        if (postsData.feeds.filter(feed => feed.feedTitle === feedsTitle.textContent).length === 0) {
            watchedfeedsData.feeds.push({id: id, feedTitle: feedsTitle.textContent, feedSubtitle: feedsSubtitle.textContent});
        };

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
    if (initialState.form.data.length > 0) {
        setTimeout(() => checkUpdates(initialState.form.data), 5000);
    };

};

export default app