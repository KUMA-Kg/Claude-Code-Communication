import React from 'react';
import ReactDOM from 'react-dom/client';
import { SubsidyAssistantAI } from './components/SubsidyAssistantAI';

const App = () => {
  return <SubsidyAssistantAI />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);