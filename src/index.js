import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import watch from './view.js';
import ru from './locales/ru.js';
import parseRss from './parser.js';

const app = () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

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
    uiState: {
      viewedPosts: [],
    },
    getPost: (id) => {
      const [feed] = state.feeds.filter((f) => f.posts.map((post) => post.id).includes(id));
      const [result] = feed.posts.filter((post) => post.id === id);
      return result;
    },
  };
  const watchedState = watch(state, i18nInstance);
  const urlSchema = string().url('errors.notValidUrl').test(
    'already not',
    'errors.alreadyHave',
    (value) => !state.feeds.map((feed) => feed.link).includes(value),
  );

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
          const posts = [...items].map((item) => {
            const result = {
              viewed: false,
              id: state.maxPostId += 1,
              title: item.querySelector('title').textContent,
              description: item.querySelector('description').textContent,
              link: item.querySelector('link').textContent,
            };
            return result;
          });
          if (!state.feeds.map((feed) => feed.link).includes(url)) {
            const newFeed = {
              link: url,
              title: parsedRss.querySelector('title').textContent,
              description: parsedRss.querySelector('description').textContent,
              posts,
            };
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
  };
  const updateFeeds = () => {
    state.feeds.forEach((feed) => {
      takeFeed(feed.link);
    });
    window.setTimeout(updateFeeds, 5000);
  };

  const rssForm = document.querySelector('.rss-form');
  rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { url } = Object.fromEntries(new FormData(e.target));
    urlSchema.validate(url)
      .then((link) => {
        takeFeed(link);
      })
      .catch((error) => {
        watchedState.error = error.message;
      });
  });
  updateFeeds();
};

app();
