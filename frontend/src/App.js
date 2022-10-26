import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import HoneScreen from './screens/HoneScreen';
import ProductScreen from './screens/ProductScreen';

function App() {
  return (
    <BrowserRouter>
      <div>
        <header>
          <Link to="/">Amazon</Link>
        </header>
        <main>
          <Routes>
            <Route path="/product/:slug" element={<ProductScreen />} />
            <Route path="/" element={<HoneScreen />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
