import onChange from 'on-change';

export default (state, instance, elements) => {
  const render = (path) => {
    if (path === 'modal.postId') {
      const getPost = (postTd) => {
        const [feed] = state.feeds.filter((f) => f.posts.map((post) => post.id).includes(postTd));
        const [result] = feed.posts.filter((post) => post.id === postTd);
        return result;
      };
      const currentPost = getPost(state.modal.postId);
      elements.modal.title.textContent = currentPost.title;
      elements.modal.body.textContent = currentPost.description;
      elements.modal.link.href = currentPost.link;
    }
    if (state.formState === 'invalid') {
      const errorMessage = instance.t(state.error);
      elements.feedbackDiv.classList.replace('text-success', 'text-danger');
      elements.input.classList.add('is-invalid');
      elements.feedbackDiv.textContent = errorMessage;
      return;
    }
    if (state.formState === 'valid') {
      elements.input.classList.remove('is-invalid');
      const form = document.querySelector('.rss-form');
      form.reset();
      elements.input.focus();
      elements.feedbackDiv.textContent = instance.t('complete');
      elements.feedbackDiv.classList.replace('text-danger', 'text-success');
    }
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
      elements.postsDiv.append(card);
      elements.feedsDiv.append(card.cloneNode(true));
      elements.feedsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.feeds');
      elements.postsDiv.querySelector('.card-title').textContent = instance.t('cardTitles.posts');
    }
    const listGroupItem = document.createElement('li');
    listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0');
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
    const preparePostsHtml = (feed) => feed.posts
      .map((post) => {
        const listItem = listGroupItem.cloneNode();
        listItem.classList.add('d-flex', 'justify-content-between', 'align-items-start');
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
        listItem.append(a, btn);
        return listItem;
      });
    let feeds = [];
    let posts = [];
    state.feeds.forEach((feed) => {
      const postsHtml = preparePostsHtml(feed);
      const feedHtml = prepareFeedHtml(feed);
      feeds = [...feeds, feedHtml];
      posts = [...posts, ...postsHtml];
    });
    const sortedPosts = posts.sort((a, b) => {
      const idA = a.firstChild.getAttribute('data-id');
      const idB = b.firstChild.getAttribute('data-id');
      return Number(idA) > Number(idB) ? -1 : 1;
    });
    elements.feedsDiv.querySelector('.list-group').replaceChildren(...feeds);
    elements.postsDiv.querySelector('.list-group').replaceChildren(...sortedPosts);
  };
  return onChange(state, render);
};
