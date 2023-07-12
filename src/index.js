import  './styles.scss';
import  'bootstrap';
import { string } from 'yup';
import watch from './view.js';


const state = {
  validState: '',
  feeds: [],
}
const watchedState = watch(state);
const urlSchema = string().url().test(
  'already not',
  'feeds already have this RSS',
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
    })
    .catch((error) => {
      state.error = error;
      state.validState = '';
      watchedState.validState = 'invalid';
    });
})
