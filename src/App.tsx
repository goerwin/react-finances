import Calculator from './components/Calculator';
import { initGapi } from './components/GoogleApi';

function App() {
  return (
    <div>
      <Calculator />
      <button onClick={() => initGapi()}>Load Google Api</button>
    </div>
  );
}

export default App;
