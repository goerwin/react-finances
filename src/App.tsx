import Calculator from './components/Calculator';
import { initGapi } from './components/GoogleApi';

function App() {
  return (
    <div>
      <Calculator />
      <button>Gasto</button>
      <button>Ingreso</button>
      <button onClick={() => initGapi()}>Load Google Api</button>
      <div className="popup">
        <h2>Gasto</h2>
        <input type="text" />
        <div className="select-container">
          {new Array(5).fill('').map((el, idx) => (
            <div key={idx}>{idx}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
