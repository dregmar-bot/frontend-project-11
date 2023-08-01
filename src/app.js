import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import watch from './view.js';
import ru from './locales/ru.js';
import parseRss from './parser.js';

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  }).then(() => {
    const state = {
      addedNewFeed: false,
      displayed: false,
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
    };
    const watchedState = watch(state, i18nInstance);
    const urlSchema = string().url('errors.notValidUrl').test(
      'already not',
      'errors.alreadyHave',
      (value) => !state.feeds.map((feed) => feed.link).includes(value),
    );

    const takeFeed = (url) => {
      state.addedNewFeed = !state.feeds.map((f) => f.link).includes(url);
      state.displayed = false;
      axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
        .then((response) => {
          try {
            const feed = parseRss(response.data.contents);
            feed.link = url;
            const setPostId = (post) => {
              post.id = _.uniqueId();
              return post;
            };
            if (state.addedNewFeed) {
              feed.posts.forEach(setPostId);
              state.feeds = [...state.feeds, feed];
            } else {
              const [currentFeed] = state.feeds.filter((f) => f.link === feed.link);
              const currentPostsTitles = currentFeed.posts.map((p) => p.title);
              const newPosts = feed.posts.filter((p) => !currentPostsTitles.includes(p.title));
              newPosts.forEach(setPostId);
              currentFeed.posts = [...currentFeed.posts, ...newPosts];
            }
            state.error = '';
            watchedState.displayed = true;
          } catch (e) {
            watchedState.error = e.message === 'parsing error' ? 'errors.parserError' : 'errors.undefinedError';
          }
        })
        .catch(() => {
          watchedState.error = 'errors.networkError';
        });
    };
    const updateFeeds = () => {
      try {
        state.feeds.forEach((feed) => {
          takeFeed(feed.link);
        });
      } finally {
        window.setTimeout(updateFeeds, 5000);
      }
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
    const postsDiv = document.querySelector('.posts');
    postsDiv.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-id')) {
        const id = Number(e.target.dataset.id);
        const getPost = (postTd) => {
          const [feed] = state.feeds.filter((f) => f.posts.map((post) => post.id).includes(postTd));
          const [result] = feed.posts.filter((post) => post.id === postTd.toString());
          return result;
        };
        const { title, description, link } = getPost(id.toString());
        state.uiState.viewedPosts = [...state.uiState.viewedPosts, id.toString()];
        watchedState.modal = { title, description, link };
      }
    });
    updateFeeds();
  });
};
