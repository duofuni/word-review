import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Word, Lesson } from '../types'
import { parseWordsToLessons } from '../utils/wordParser'
import { getProgress } from '../utils/storage'

export default function LessonList() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/word.json')
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

  const handleCardClick = (lessonId: number) => {
    navigate(`/lesson/${lessonId}/match`)
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
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-dashed border-gray-300 mb-6 sm:mb-8"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => handleCardClick(lesson.id)}
              className="bg-blue-100 rounded-lg p-4 sm:p-5 cursor-pointer 
                         hover:bg-blue-200 active:bg-blue-300 transition-colors duration-200
                         active:scale-[0.98] transform touch-manipulation
                         shadow-sm hover:shadow-md"
            >
              <div className="text-blue-600 font-semibold text-base sm:text-lg md:text-xl mb-2">
                第{lesson.id}课
              </div>
              <div className="text-blue-500 text-sm sm:text-base mb-3">
                {lesson.words.length}个单词
              </div>
              <div className="border-t border-gray-300 pt-3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
