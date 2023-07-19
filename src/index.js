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
  displayed: false,
  maxPostId: 1,
  error: '',
  feeds: [],
  modal: {
    title: '',
    description: '',
    link: '',
  },
  uiState:  {
    viewedPosts: [],
  },
  getPost: (id) => {
    const [feed] = state.feeds.filter((feed) => feed.posts.map((post) => post.id).includes(id));
    const [result] = feed.posts.filter((post) => post.id === id);
    return result;
  },
}
const watchedState = watch(state, i18nInstance);
const urlSchema = string().url('errors.notValidUrl').test(
  'already not',
  'errors.alreadyHave',
  (value) => !state.feeds.map((feed) => feed.link).includes(value),
);

const updateFeeds = () => {
  state.feeds.forEach((feed) => {
    takeFeed(feed.link);
  });
  window.setTimeout(updateFeeds, 5000)
};

const takeFeed = (url) => {
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => {
    try {
      const parsedRss = parseRss(response.data.contents);
      if (parsedRss.querySelector('parsererror')) {
        watchedState.error = 'errors.parserError';
        return;
      }
      const items = parsedRss.querySelectorAll('item');
      const posts = [...items].map((item) => ({
        viewed: false,
        id: state.maxPostId++,
        title: item.querySelector('title').textContent,
        description: item.querySelector('description').textContent,
        link: item.querySelector('link').textContent,
      }))
      if (!state.feeds.map((feed) => feed.link).includes(url)) {
        const newFeed = {
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
        watchedState.displayed = true;
        state.displayed = false;
      }
    } catch {
      watchedState.error = 'errors.undefinedError';
    }
  }).catch(() => {
    watchedState.error = 'errors.networkError';
  });
}

const rssForm = document.querySelector('.rss-form');
rssForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const { url } = Object.fromEntries(new FormData(e.target));
  urlSchema.validate(url)
    .then((url) => {
      takeFeed(url);
      updateFeeds();
    })
    .catch((error) => {
      watchedState.error = error.message;
    })
});

