import onChange from 'on-change';

export default (state, instance) => {
  const render = (path, value) => {
    document.querySelector('.modal-title').textContent = state.modal.title;
    document.querySelector('.modal-body').textContent = state.modal.description;
    document.querySelector('.full-article').href = state.modal.link;
    const input = document.querySelector('#url-input');
    input.classList.remove('is-invalid')
    const feedbackDiv = document.querySelector('.feedback');
    if (path === 'error') {
      const errorMessage = instance.t(value);
      feedbackDiv.classList.replace('text-success','text-danger');
      input.classList.add('is-invalid');
      feedbackDiv.textContent = errorMessage;
      return;
    }
    if (path === 'feeds') {
      const form = document.querySelector('.rss-form');
      form.reset();
      input.focus();
      feedbackDiv.textContent = instance.t('complete');
      feedbackDiv.classList.replace('text-danger','text-success');
    }
    const postsDiv = document.querySelector('.posts');
    const feedsDiv = document.querySelector('.feeds');
    if (!feedsDiv.querySelector('.card-title')) {
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
    }
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
      return feed.posts
      .map((post) => {
        const listItem = listGroupItem.cloneNode();
        listItem.classList.add('d-flex', 'justify-content-between', 'align-items-start');
        const a = document.createElement('a');
        if (state.uiState.viewedPosts.includes(post.id)) {
          a.classList.add('fw-normal', 'link-secondary');
        } else {
          a.classList.add('fw-bold');
        }
        a.setAttribute('data-id', `${post.id}`)
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
        a.href = post.link;
        a.textContent = post.title;
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
        btn.setAttribute('data-id', `${post.id}`);
        btn.setAttribute('data-bs-toggle', 'modal')
        btn.setAttribute('data-bs-target', '#modal');
        btn.type = 'button';
        btn.textContent = instance.t('buttonText');
        listItem.append(a, btn);
        return listItem;
      });
    }
    let feeds = [];
    let posts = [];
    state.feeds.forEach((feed) => {
      const postsHtml = preparePostsHtml(feed);
      const feedHtml = prepareFeedHtml(feed);
      feeds = [...feeds, feedHtml];
      posts = [...posts, ...postsHtml];
    });
    const sortedPosts = posts.sort((a, b) => a.id > b.id ? 1 : -1);
    feedsDiv.querySelector('.list-group').replaceChildren(...feeds);
    postsDiv.querySelector('.list-group').replaceChildren(...sortedPosts);
    const handler = (e) => {
      const id = Number(e.target.dataset.id);
      const {title, description, link} = state.getPost(id)
      state.uiState.viewedPosts = [...state.uiState.viewedPosts, id];
      state.modal = {title, description, link};
      render();
    }
    const buttons = document.querySelectorAll('.btn-sm');
    const links = document.querySelectorAll('[rel="noopener noreferrer"]');
    buttons.forEach((btn) => btn.addEventListener('click', handler))
    links.forEach((link) => link.addEventListener('click', handler))
  }
  return onChange(state, render, { isShallow: true });
}
