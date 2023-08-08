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
      error: '',
      feeds: [],
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
    const takeFeed = (url, cb) => {
      const promise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
        .then((response) => {
          let feed;
          try {
            feed = cb(url, response);
          } catch (e) {
            state.formState = 'invalid';
            watchedState.error = e.message === 'parsing error' ? 'errors.parserError' : 'errors.undefinedError';
          }
          return feed;
        })
        .catch(() => {
          state.formState = 'invalid';
          watchedState.error = 'errors.networkError';
        });
      return promise;
    };
    const takeNewFeed = (url, response) => {
      const feed = parseRss(response.data.contents);
      feed.link = url;
      const setPostId = (post) => {
        post.id = _.uniqueId();
        return post;
      };
      feed.posts.forEach(setPostId);
      state.formState = 'valid';
      state.error = '';
      watchedState.feeds = [...state.feeds, feed];
      return feed;
    };
    const updateFeed = (url, response) => {
      const feed = parseRss(response.data.contents);
      feed.link = url;
      const setPostId = (post) => {
        post.id = _.uniqueId();
        return post;
      };
      const [currentFeed] = watchedState.feeds.filter((f) => f.link === feed.link);
      const currentPostsTitles = currentFeed.posts.map((p) => p.title);
      const newPosts = feed.posts.filter((p) => !currentPostsTitles.includes(p.title));
      newPosts.forEach(setPostId);
      currentFeed.posts = [...currentFeed.posts, ...newPosts];
      return feed;
    };

    const updateFeeds = () => {
      const promises = state.feeds.map((feed) => takeFeed(feed.link, updateFeed));
      Promise.all(promises).then(() => {
        window.setTimeout(updateFeeds, 5000);
      });
    };

    const rssForm = document.querySelector('.rss-form');
    rssForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = new FormData(e.target).get('url');
      urlSchema.validate(url)
        .then((link) => {
          takeFeed(link, takeNewFeed);
        })
        .catch((error) => {
          state.formState = 'invalid';
          watchedState.error = error.message;
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
    updateFeeds();
  });
};
