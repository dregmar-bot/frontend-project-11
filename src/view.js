import onChange from 'on-change';

export default (state, instance) => {
  const render = (path, value) => {
    const input = document.querySelector('#url-input');
    input.classList.remove('is-invalid')
    const feedbackDiv = document.querySelector('.invalid-feedback');
    if(feedbackDiv) {
      input.parentNode.removeChild(feedbackDiv);
    }
    if (path === 'error') {
      const errorMessage = instance.t(value);
      input.classList.add('is-invalid');
      const errorDiv = document.createElement('div');
      errorDiv.textContent = errorMessage;
      errorDiv.classList.add('invalid-feedback');
      input.parentNode.append(errorDiv);
      return;
    }
    if (path === 'feeds') {
      const postsDiv = document.querySelector('.posts');
      const feedsDiv = document.querySelector('.feeds');
      const card = document.createElement('div');
      card.classList.add('card', 'border-0')
      const cardBody = document.createElement('div');
      cardBody.classList.add('card-body');
      const cardTitle = document.createElement('h2');
      cardTitle.classList.add('card-title', 'h4');
      cardBody.append(cardTitle);
      const listGroup = document.createElement('ul');
      listGroup.classList.add('list-group', 'border-0', 'rounded-0');
      card.append(cardBody, listGroup);
      postsDiv.append(card);
      feedsDiv.append(card.cloneNode(true));
      feedsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.feeds');
      postsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.posts');
      const newFeedId = Math.max(...state.feeds.map((feed) => feed.id));
      const [newFeed] = state.feeds.filter((feed) => feed.id === newFeedId);
      const listGroupItem = document.createElement('li');
      listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0')
      const prepareFeedHtml = (feed) => {
        const h = document.createElement('h3');
        h.classList.add('h6', 'm-0');
        h.textContent = feed.title;
        const p = document.createElement('p');
        p.classList.add('m-0', 'small', 'text-black-50');
        p.textContent = feed.description;
        listGroupItem.append(h, p);
        return listGroupItem;
      };
      const preparePostsHtml = (feed) => {
         return feed.posts.map((post) => {
          const listItem = listGroupItem.cloneNode();
          listItem.classList.add('d-flex', 'justify-content-between', 'align-items-start');
          const a = document.createElement('a');
          a.classList.add('fw-bold');
          a.setAttribute('data-id', '2')
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
          a.href = post.link;
          a.textContent = post.title;
          const btn = document.createElement('button');
          btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
          btn.setAttribute('data-id', '2')
          btn.setAttribute('data-bs-toggle', 'modal')
          btn.setAttribute('data-bs-target', '#modal');
          btn.type = 'button';
          btn.textContent = instance.t('buttonText');
          listItem.append(a, btn);
          return listItem;
        });
      }
      const feedHtml = prepareFeedHtml(newFeed);
      const postsHtml = preparePostsHtml(newFeed);
      feedsDiv.querySelector('.list-group').append(feedHtml);
      postsDiv.querySelector('.list-group').append(...postsHtml);
      const form = document.querySelector('.rss-form');
      form.reset();
      input.focus();
    }
  }
  return onChange(state, render);
}
