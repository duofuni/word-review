import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Word } from '../types'
import { parseWordsToLessons } from '../utils/wordParser'

export default function WordReview() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/word.json')
      .then(res => res.json())
      .then((data: Word[]) => {
        const lessons = parseWordsToLessons(data)
        const lesson = lessons.find(l => l.id === parseInt(lessonId || '1'))
        if (lesson) {
          setWords(lesson.words)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load words:', err)
        setLoading(false)
      })
  }, [lessonId])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  const handleGoToMatch = () => {
    navigate(`/lesson/${lessonId}/match`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">未找到单词数据</div>
      </div>
    )
  }

  const currentWord = words[currentIndex]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 px-4">
      <div className="w-full md:max-w-[750px]">
        {/* Page Indicator */}
        <div className="text-right text-sm sm:text-base text-gray-500 mb-6">
          {currentIndex + 1}/{words.length}
        </div>

        {/* Word Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-12 relative">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 
              w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
              rounded-full transition-all touch-manipulation
              ${currentIndex === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600'
              }
              active:scale-95 transform`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 
              w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
              rounded-full transition-all touch-manipulation
              ${currentIndex === words.length - 1 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600'
              }
              active:scale-95 transform`}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Word Content */}
          <div className="text-center px-8 sm:px-12 md:px-16">
            <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-blue-600 mb-4 sm:mb-6">
              {currentWord.word}
            </div>
            <div className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed">
              {currentWord.meaning}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button
            onClick={handleGoToMatch}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 
                     rounded-lg text-sm sm:text-base text-white transition-colors
                     active:scale-95 transform touch-manipulation font-medium"
          >
            去测验
          </button>
          <button
            onClick={handleBack}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 
                     rounded-lg text-sm sm:text-base text-gray-700 transition-colors
                     active:scale-95 transform touch-manipulation"
          >
            返回课程列表
          </button>
        </div>
      </div>
    </div>
  )
}
