import React from 'react'

import AppRouter from './routes/AppRouter'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {

  return (
    <>
      <Navbar />
      <AppRouter />
      <Footer />
    </>
  )
}

export default App
