export default (string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(string, 'application/xml');
  return doc;
};
