import React from 'react';
import { createRoot } from 'react-dom/client'
import HyperparamComponent from './HyperparamComponent'

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <h1>Race Car Reinforment Learning Agent in a Track Environment</h1>
    <HyperparamComponent/>
  </React.StrictMode>
);