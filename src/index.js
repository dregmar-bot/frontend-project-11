import  './styles.scss';
import  'bootstrap';
import { string } from 'yup';
import watch from './view.js';
import i18n from 'i18next';
import ru from './locales/ru.js';
import axios from 'axios';
import parseRss from './parser.js';


const i18nInstance = i18n.createInstance();
i18nInstance.init({
  lng: 'ru',
  resources: {
    ru,
  },
})

const state = {
  validState: '',
  feeds: [],
}
const watchedState = watch(state, i18nInstance);
const urlSchema = string().url('errors.notValidUrl').test(
  'already not',
  'errors.alreadyHave',
  (value) => !state.feeds.includes(value),
);



const rssForm = document.querySelector('.rss-form');
rssForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { url } = Object.fromEntries(new FormData(e.target));
  urlSchema.validate(url)
    .then((url) => {
      state.feeds = [...state.feeds, url];
      state.validState = '';
      watchedState.validState = 'valid';
      axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
      .then((response) => {
        const parsedRss = parseRss(response.data.contents);
        if (parsedRss.querySelector('parsererror')){
          watchedState.error = 'errors.parserError';
        }
        const items = parsedRss.querySelectorAll('item');
        const posts = [...items].map((item) => ({
          title: item.querySelector('title').textContent,
          link: item.querySelector('link'),
        }))
        const newFeed = {
          title: parsedRss.querySelector('title').textContent,
          description: parsedRss.querySelector('description').textContent,
          posts
        }
        watchedState.feeds = [...state.feeds, newFeed];
      })
      .catch((_e) => {
        watchedState.error = 'errors.networkError';
      })
    })
    .catch((error) => {
      state.error = error;
      state.validState = '';
      watchedState.validState = 'invalid';
    });
})
