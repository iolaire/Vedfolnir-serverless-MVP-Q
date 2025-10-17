import { BrowserRouter } from 'react-router-dom'
import Router from './components/Router'
import './styles/ved.css'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Router />
    </BrowserRouter>
  )
}

export default App
