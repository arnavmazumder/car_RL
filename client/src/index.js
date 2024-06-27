import React from 'react';
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <div>
        <p>Use the arrow keys to drive the car. To generate a random track, press "Generate Track". To view the trained AI, press "Start AI (DQN)". To watch the AI train, press "Train".
          To stop a running process press "Stop".
        </p>
    </div>
  </React.StrictMode>,
);