import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Word, Lesson } from '../types'
import { parseWordsToLessons } from '../utils/wordParser'
import { getProgress, Progress } from '../utils/storage'

export default function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Progress[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Load progress from localStorage on initial mount
    setProgress(getProgress())
    
    fetch(`${import.meta.env.BASE_URL}word.json`)
      .then(res => res.json())
      .then((data: Word[]) => {
        const parsedLessons = parseWordsToLessons(data)
        setLessons(parsedLessons)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load words:', err)
        setLoading(false)
      })
  }, [])

  // Refresh progress when returning to the lesson list
  useEffect(() => {
    if (location.pathname === '/') {
      setProgress(getProgress())
    }
  }, [location.pathname])

  const handleCardClick = (lessonId: number) => {
    navigate(`/lesson/${lessonId}/review`)
  }

  const isLessonCompleted = (lessonId: number): boolean => {
    const lessonProgress = progress.find(p => p.lessonId === lessonId)
    return lessonProgress?.completed || false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full md:max-w-[750px] mx-auto">
        <div className="border-b border-dashed border-gray-300 mb-6 sm:mb-8"></div>
        
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          {lessons.map((lesson) => {
            const completed = isLessonCompleted(lesson.id)
            return (
              <div
                key={lesson.id}
                onClick={() => handleCardClick(lesson.id)}
                className={`rounded-lg p-4 sm:p-5 cursor-pointer 
                           transition-all duration-200
                           active:scale-[0.98] transform touch-manipulation
                           shadow-sm hover:shadow-md relative
                           border-2
                           ${completed 
                             ? 'bg-green-50 hover:bg-green-100 active:bg-green-200 border-green-400' 
                             : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-blue-300'
                           }`}
              >
                {completed ? (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 bg-gray-300 rounded-full p-1">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div className={`font-semibold text-base sm:text-lg md:text-xl mb-2
                  ${completed ? 'text-green-800' : 'text-blue-700'}`}>
                  第{lesson.id}课
                </div>
                <div className={`text-sm sm:text-base mb-2
                  ${completed ? 'text-green-700' : 'text-blue-600'}`}>
                  {lesson.words.length}个单词
                </div>
                <div className={`text-xs sm:text-sm font-medium
                  ${completed ? 'text-green-600' : 'text-blue-500'}`}>
                  {completed ? '✓ 已完成' : '○ 未完成'}
                </div>
                <div className={`border-t mt-3 pt-3
                  ${completed ? 'border-green-300' : 'border-blue-200'}`}></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
