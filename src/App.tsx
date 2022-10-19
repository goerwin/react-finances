import { useState } from 'react';
import './App.css';
import { initGapi } from './components/GoogleApi';

function App() {
  return (
    <>
      <h1>Hello world</h1>
      <input type="file" id="fileinput" />
      <button onClick={() => initGapi()}>Load Google Api</button>
    </>
  );
}

export default App;
