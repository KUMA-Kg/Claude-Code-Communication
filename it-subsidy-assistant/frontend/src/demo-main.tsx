import React from 'react';
import ReactDOM from 'react-dom/client';
import DemoApp from './DemoApp';

const rootElement = document.getElementById('demo-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <DemoApp />
    </React.StrictMode>
  );
}