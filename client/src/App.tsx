import { Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard/Dashboard'
import Editor from './pages/Editor/Editor'
import { useParams } from "react-router-dom";

function App() {
  const { id } = useParams();

  return (
    <Routes>
      <Route path = "/" element ={<Dashboard/>}/>
      <Route path = "/documents/:id" element ={<Editor />}/>
      
    </Routes>
  )
}

export default App
