import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LessonList from './pages/LessonList'
import MatchGame from './pages/MatchGame'
import WordReview from './pages/WordReview'

function App() {
  return (
    <BrowserRouter basename="/word-review">
      <Routes>
        <Route path="/" element={<LessonList />} />
        <Route path="/lesson/:lessonId/match" element={<MatchGame />} />
        <Route path="/lesson/:lessonId/review" element={<WordReview />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
