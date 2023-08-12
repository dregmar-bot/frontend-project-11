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
      formState: '',
      inputDisabled: false,
      error: '',
      feeds: [],
      posts: [],
      modal: {
        postId: 0,
      },
      uiState: {
        viewedPosts: [],
      },
    };

    const elements = {
      modal: {
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        link: document.querySelector('.full-article'),
      },
      input: document.querySelector('#url-input'),
      feedbackDiv: document.querySelector('.feedback'),
      postsDiv: document.querySelector('.posts'),
      feedsDiv: document.querySelector('.feeds'),
    };

    const watchedState = watch(state, i18nInstance, elements);
    const urlSchema = string().url('errors.notValidUrl').test(
      'already not',
      'errors.alreadyHave',
      (value) => !state.feeds.map((feed) => feed.link).includes(value),
    );

    const updateFeeds = () => {
      const promises = state.feeds.map((feed) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feed.link)}`)
        .then((response) => {
          try {
            const { posts } = parseRss(response.data.contents);
            const currentPosts = state.posts.filter((p) => p.feedId === feed.id);
            const currentPostsTitles = currentPosts.map((p) => p.title);
            const newPosts = posts.filter((p) => !currentPostsTitles.includes(p.title));
            if (newPosts.length === 0) {
              return;
            }
            const setPostIds = (post) => {
              post.feedId = feed.id;
              post.id = _.uniqueId();
              return post;
            };
            newPosts.forEach(setPostIds);
            watchedState.posts = [...state.posts, ...newPosts];
          } catch (e) {
            state.error = e.message === 'parsing error' ? 'errors.parserError' : 'errors.undefinedError';
            watchedState.formState = 'invalid';
          }
        })
        .catch(() => {
          state.error = 'errors.networkError';
          watchedState.formState = 'invalid';
        }));
      Promise.all(promises).then(() => {
        window.setTimeout(updateFeeds, 5000);
      });
    };

    const takeFeed = (url) => {
      axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
        .then((response) => {
          try {
            const { feed, posts } = parseRss(response.data.contents);
            feed.id = _.uniqueId();
            feed.link = url;
            const setPostIds = (post) => {
              post.feedId = feed.id;
              post.id = _.uniqueId();
              return post;
            };
            posts.forEach(setPostIds);
            watchedState.formState = 'valid';
            state.error = '';
            watchedState.feeds = [...state.feeds, feed];
            watchedState.posts = [...state.posts, ...posts];
            updateFeeds();
          } catch (e) {
            state.error = e.message === 'parsing error' ? 'errors.parserError' : 'errors.undefinedError';
            watchedState.formState = 'invalid';
          }
        })
        .catch(() => {
          state.error = 'errors.networkError';
          watchedState.formState = 'invalid';
        })
        .then(() => {
          watchedState.inputDisabled = false;
        });
    };

    const rssForm = document.querySelector('.rss-form');
    rssForm.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.inputDisabled = true;
      const url = new FormData(e.target).get('url');
      urlSchema.validate(url)
        .then((link) => {
          takeFeed(link);
        })
        .catch((error) => {
          state.error = error.message;
          watchedState.formState = 'invalid';
        });
    });

    const postsDiv = document.querySelector('.posts');
    postsDiv.addEventListener('click', (e) => {
      if (e.target.dataset.id) {
        const { id } = e.target.dataset;
        state.uiState.viewedPosts = [...state.uiState.viewedPosts, id];
        watchedState.modal.postId = id;
      }
    });
  });
};
