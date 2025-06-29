import React, { useState, useEffect } from 'react'

import AppRouter from './routes/AppRouter'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop';

function App() {
  // const [theme, setTheme] = useState('');
  // setTheme('dark');

  // const toggleTheme = () => {
  //   const newTheme = theme === 'dark' ? 'light' : 'dark';
  //   setTheme(newTheme);
  //   localStorage.setItem('theme', newTheme);
  // };

  // useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add('light');
  // }, []);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <AppRouter />
      <Footer />
    </>
  )
}

export default App
