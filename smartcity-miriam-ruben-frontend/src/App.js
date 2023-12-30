import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from './components/Main';
import Navbar from "./components/navbar/Navbar";
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div>
          <Navbar />
          <Routes>
              <Route path="/" element={<Main/>} />
          </Routes>
          <footer className="footer-container"><p>
            Desarrollado por Miriam Fernández Osuna y Rubén Gómez Villegas<br/>
            UCLM Talavera de la Reina - Grado en Ingeniería Informática<br/>
            Sistemas de Información Ubicuos 23/24
          </p></footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
