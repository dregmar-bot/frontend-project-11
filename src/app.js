import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import watch from './view.js';
import ru from './locales/ru.js';
import parseRss from './parser.js';

const proxify = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

const updateFeeds = (state) => {
  const promises = state.feeds.map((feed) => axios.get(proxify(feed.link))
    .then((response) => {
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
      state.posts = [...state.posts, ...newPosts];
    })
    .catch((e) => {
      console.log(e.message);
    }));
  Promise.all(promises).then(() => {
    window.setTimeout(() => updateFeeds(state), 5000);
  });
};

const takeFeed = (url, state) => {
  axios.get(proxify(url))
    .then((response) => {
      const { feed, posts } = parseRss(response.data.contents);
      feed.id = _.uniqueId();
      feed.link = url;
      const setPostIds = (post) => {
        post.feedId = feed.id;
        post.id = _.uniqueId();
        return post;
      };
      posts.forEach(setPostIds);
      state.formState = 'valid';
      state.error = null;
      state.feeds = [...state.feeds, feed];
      state.posts = [...state.posts, ...posts];
    })
    .catch((e) => {
      if (e.isParsingError) {
        state.error = 'errors.parserError';
      } else if (e.isAxiosError) {
        state.error = 'errors.networkError';
      } else {
        state.errors = 'errors.undefinedError';
      }
      state.formState = 'invalid';
    });
};

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  }).then(() => {
    const initialState = {
      formState: 'empty',
      error: null,
      feeds: [],
      posts: [],
      modal: {
        postId: null,
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

    const watchedState = watch(initialState, i18nInstance, elements);
    const urlSchema = string().url('errors.notValidUrl').test(
      'already not',
      'errors.alreadyHave',
      (value) => !watchedState.feeds.map((feed) => feed.link).includes(value),
    );

    const rssForm = document.querySelector('.rss-form');
    rssForm.addEventListener('submit', (e) => {
      e.preventDefault();
      watchedState.formState = 'sending';
      const url = new FormData(e.target).get('url');
      urlSchema.validate(url)
        .then((link) => {
          takeFeed(link, watchedState);
        })
        .catch((error) => {
          watchedState.error = error.message;
          watchedState.formState = 'invalid';
        });
    });

    updateFeeds(watchedState);

    const postsDiv = document.querySelector('.posts');
    postsDiv.addEventListener('click', (e) => {
      if (e.target.dataset.id) {
        const { id } = e.target.dataset;
        if (!watchedState.uiState.viewedPosts.includes(id)) {
          watchedState.uiState.viewedPosts = [...watchedState.uiState.viewedPosts, id];
        }
        watchedState.modal.postId = id;
      }
    });
  });
};
