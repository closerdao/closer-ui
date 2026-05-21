const React = require('react');

const ReactMarkdown = ({ children }) =>
  React.createElement('div', { 'data-testid': 'react-markdown' }, children);

module.exports = {
  __esModule: true,
  default: ReactMarkdown,
  uriTransformer: (uri) => uri,
};
