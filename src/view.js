import onChange from 'on-change';

export default (state, instance) => {
  const render = (_path, value) => {
    const input = document.querySelector('#url-input');
    input.classList.remove('is-invalid')
    const feedbackDiv = document.querySelector('.invalid-feedback');
    if(feedbackDiv) {
      input.parentNode.removeChild(feedbackDiv);
    }
    if (value === 'invalid') {
      input.classList.add('is-invalid');
      const errorDiv = document.createElement('div');
      errorDiv.textContent = instance.t(state.error.message);
      errorDiv.classList.add('invalid-feedback');
      input.parentNode.append(errorDiv);
      return;
    }
    if (value === 'valid') {
      const form = document.querySelector('.rss-form');
      form.reset();
      input.focus();
    }
  }
  return onChange(state, render);
}
