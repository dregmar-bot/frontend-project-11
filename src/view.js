import onChange from 'on-change';

export default (state, instance, elements) => {
  const renderModal = () => {
    const getPost = (postTd) => {
      const [result] = state.posts.filter((post) => post.id === postTd);
      return result;
    };
    const currentPost = getPost(state.modal.postId);
    elements.modal.title.textContent = currentPost.title;
    elements.modal.body.textContent = currentPost.description;
    elements.modal.link.href = currentPost.link;
  };
  const renderForm = () => {
    const btn = document.querySelector('button[type=submit]');
    switch (state.formState) {
      case ('empty'):
        break;
      case ('sending'):
        btn.disabled = true;
        break;
      case ('invalid'):
        btn.disabled = false;
        const errorMessage = instance.t(state.error);
        elements.feedbackDiv.classList.replace('text-success', 'text-danger');
        elements.input.classList.add('is-invalid');
        elements.feedbackDiv.textContent = errorMessage;
        break;
      case ('valid'):
        btn.disabled = false;
        elements.input.classList.remove('is-invalid');
        const form = document.querySelector('.rss-form');
        form.reset();
        elements.input.focus();
        elements.feedbackDiv.textContent = instance.t('complete');
        elements.feedbackDiv.classList.replace('text-danger', 'text-success');
        break;
      default:
        throw new Error(`Unexpected form state ${state.formState}`);
    }
  };
  const renderPosts = () => {
    if (!elements.postsDiv.querySelector('.card-title')) {
      const card = document.createElement('div');
      card.classList.add('card', 'border-0');
      const cardBody = document.createElement('div');
      cardBody.classList.add('card-body');
      const cardTitle = document.createElement('h2');
      cardTitle.classList.add('card-title', 'h4');
      cardBody.append(cardTitle);
      const listGroup = document.createElement('ul');
      listGroup.classList.add('list-group', 'border-0', 'rounded-0');
      card.append(cardBody, listGroup);
      elements.postsDiv.append(card);
      elements.postsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.posts');
    }
    const posts = state.posts
      .map((post) => {
        const listGroupItem = document.createElement('li');
        listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0', 'd-flex', 'justify-content-between', 'align-items-start');
        const a = document.createElement('a');
        if (state.uiState.viewedPosts.includes(post.id)) {
          a.classList.add('fw-normal', 'link-secondary');
        } else {
          a.classList.add('fw-bold');
        }
        a.setAttribute('data-id', `${post.id}`);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        a.href = post.link;
        a.textContent = post.title;
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
        btn.setAttribute('data-id', `${post.id}`);
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#modal');
        btn.type = 'button';
        btn.textContent = instance.t('buttonText');
        listGroupItem.append(a, btn);
        return listGroupItem;
      });
    const sortedPosts = posts.sort((a, b) => {
      const idA = a.firstChild.getAttribute('data-id');
      const idB = b.firstChild.getAttribute('data-id');
      return Number(idA) > Number(idB) ? -1 : 1;
    });
    elements.postsDiv.querySelector('.list-group').replaceChildren(...sortedPosts);
  };
  const renderFeeds = () => {
    if (!elements.feedsDiv.querySelector('.card-title')) {
      const card = document.createElement('div');
      card.classList.add('card', 'border-0');
      const cardBody = document.createElement('div');
      cardBody.classList.add('card-body');
      const cardTitle = document.createElement('h2');
      cardTitle.classList.add('card-title', 'h4');
      cardBody.append(cardTitle);
      const listGroup = document.createElement('ul');
      listGroup.classList.add('list-group', 'border-0', 'rounded-0');
      card.append(cardBody, listGroup);
      elements.feedsDiv.append(card.cloneNode(true));
      elements.feedsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.feeds');
    }
    const prepareFeedHtml = (feed) => {
      const listGroupItem = document.createElement('li');
      listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0');
      const h = document.createElement('h3');
      h.classList.add('h6', 'm-0');
      h.textContent = feed.title;
      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = feed.description;
      listGroupItem.append(h, p);
      return listGroupItem;
    };
    const feeds = state.feeds.map(prepareFeedHtml);
    elements.feedsDiv.querySelector('.list-group').replaceChildren(...feeds);
  };

  const render = (path) => {
    switch (path) {
      case 'error':
        break;
      case 'formState':
        renderForm();
        break;
      case 'modal.postId':
        renderModal();
        break;
      case 'feeds':
        renderFeeds();
        break;
      case 'posts':
        renderPosts();
        break;
      case 'uiState.viewedPosts':
        renderPosts();
        break;
      default:
        throw new Error(`Unexpectable path ${path}`);
    }
  };
  return onChange(state, render);
};
