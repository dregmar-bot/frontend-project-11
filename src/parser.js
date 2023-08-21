export default (string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(string, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    const error = new Error(errorNode.textContent);
    error.isParsingError = true;
    throw error;
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
