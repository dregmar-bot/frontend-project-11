export default (string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(string, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('parsing error');
  }
  const items = doc.querySelectorAll('item');
  const posts = [...items].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));
  return {
    feed: {
      title: doc.querySelector('title').textContent,
      description: doc.querySelector('description').textContent,
    },
    posts,
  };
};
