import { Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Editor from './pages/Editor/Editor'

function App() {
  return (
    <Routes>
      <Route path = "/" element ={<Dashboard/>}/>
      <Route path = "/documents/:id" element ={<Editor/>}/>
      
    </Routes>
  )
}

export default App
