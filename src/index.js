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
  state: false,
  error: '',
  feeds: [],
}
const watchedState = watch(state, i18nInstance);
const urlSchema = string().url('errors.notValidUrl').test(
  'already not',
  'errors.alreadyHave',
  (value) => !state.feeds.map((feed) => feed.link).includes(value),
);

const updateFeed = (feed) => {
  window.setTimeout(() => {
    takeFeed(feed.link);
  }, 5000);
};

const takeFeed = (url) => {
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => {
    const parsedRss = parseRss(response.data.contents);
    if (parsedRss.querySelector('parsererror')){
      watchedState.error = 'errors.parserError';
      return;
    }
    const items = parsedRss.querySelectorAll('item');
    const posts = [...items].map((item) => ({
      title: item.querySelector('title').textContent,
      link: item.querySelector('link'),
    }))
    if (!state.feeds.map((feed) => feed.link).includes(url)) {
      const newFeed = {
        id: state.feeds.length + 1,
        link: url,
        title: parsedRss.querySelector('title').textContent,
        description: parsedRss.querySelector('description').textContent,
        posts
      }
      watchedState.feeds = [...state.feeds, newFeed];
    } else {
      const [currentFeed] = state.feeds.filter((feed) => feed.link === url);
      const currentPostsTitles = currentFeed.posts.map((post) => post.title);
      const newPosts = posts.filter((post) => !currentPostsTitles.includes(post.title));
      currentFeed.posts = [...currentFeed.posts, ...newPosts];
      watchedState.state = true;
      state.state = false;
    }
    state.feeds.forEach((feed) => updateFeed(feed));
  })
  .catch((_e) => {
    watchedState.error = 'errors.networkError';
  })
};

const rssForm = document.querySelector('.rss-form');
rssForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { url } = Object.fromEntries(new FormData(e.target));
  urlSchema.validate(url)
    .then((url) => {
      takeFeed(url);
    })
    .catch((error) => {
      watchedState.error = error.message;
    })
});

