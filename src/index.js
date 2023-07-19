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
  getFeed: (id) => {
    const [result] = state.feeds.filter((feed) => feed.id === id);
    return result
  },
  getPost: (id) => {
    const feedId = id.split('-')[0];
    const feed = state.getFeed(feedId);
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

const updateFeed = (feed) => {
  window.setTimeout(() => {
    takeFeed(feed.link);
  }, 5000);
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
      const feedId = String(state.feeds.length + 1);
      const posts = [...items].map((item) => ({
        viewed: false,
        id: `${feedId}-${state.maxPostId++}`,
        title: item.querySelector('title').textContent,
        description: item.querySelector('description').textContent,
        link: item.querySelector('link').textContent,
      }))
      if (!state.feeds.map((feed) => feed.link).includes(url)) {
        const newFeed = {
          id: feedId,
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
        state.displayed = false;
      }
      state.feeds.forEach((feed) => updateFeed(feed));
    } catch (e) {
      watchedState.error = 'errors.undefinedError';
    }
  }).catch((e) => {
    console.log(e)
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
    })
    .catch((error) => {
      watchedState.error = error.message;
    })
});

