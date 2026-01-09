import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Word, Lesson } from '../types'
import { parseWordsToLessons, shuffleArray } from '../utils/wordParser'

interface MatchItem {
  word: Word;
  index: number;
  selected: boolean;
  matched: boolean;
}

const WORDS_PER_GROUP = 5;

export default function MatchGame() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [allWords, setAllWords] = useState<Word[]>([])
  const [currentGroup, setCurrentGroup] = useState(0)
  const [leftItems, setLeftItems] = useState<MatchItem[]>([])
  const [rightItems, setRightItems] = useState<MatchItem[]>([])
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [connections, setConnections] = useState<Map<number, number>>(new Map())
  const [showAnswer, setShowAnswer] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load all words for the lesson
  useEffect(() => {
    fetch('/word.json')
      .then(res => res.json())
      .then((data: Word[]) => {
        const lessons = parseWordsToLessons(data)
        const lesson = lessons.find(l => l.id === parseInt(lessonId || '1'))
        if (lesson) {
          setAllWords(lesson.words)
        }
      })
      .catch(err => console.error('Failed to load words:', err))
  }, [lessonId])

  // Load current group words
  useEffect(() => {
    if (allWords.length === 0) return

    const startIndex = currentGroup * WORDS_PER_GROUP
    const endIndex = Math.min(startIndex + WORDS_PER_GROUP, allWords.length)
    const groupWords = allWords.slice(startIndex, endIndex)

    if (groupWords.length === 0) return

    const shuffledWords = shuffleArray([...groupWords])
    const shuffledMeanings = shuffleArray([...groupWords])
    
    setLeftItems(shuffledWords.map((w, i) => ({
      word: w,
      index: i,
      selected: false,
      matched: false
    })))
    
    setRightItems(shuffledMeanings.map((w, i) => ({
      word: w,
      index: i,
      selected: false,
      matched: false
    })))

    // Reset state for new group
    setSelectedLeft(null)
    setSelectedRight(null)
    setConnections(new Map())
    setShowAnswer(false)
  }, [allWords, currentGroup])

  // Update line positions on resize or connection change
  useEffect(() => {
    const updateLines = () => {
      if (svgRef.current && connections.size > 0) {
        // Force re-render by updating a dummy state or using requestAnimationFrame
        requestAnimationFrame(() => {
          // This will trigger a re-render and recalculate positions
        })
      }
    }

    window.addEventListener('resize', updateLines)
    return () => window.removeEventListener('resize', updateLines)
  }, [connections])

  const handleLeftClick = (index: number) => {
    if (leftItems[index].matched) return
    
    if (selectedLeft === index) {
      setSelectedLeft(null)
      setLeftItems(prev => prev.map((item, i) => 
        i === index ? { ...item, selected: false } : item
      ))
    } else {
      setSelectedLeft(index)
      setLeftItems(prev => prev.map((item, i) => 
        i === index ? { ...item, selected: true } : 
        item.selected ? { ...item, selected: false } : item
      ))
      setRightItems(prev => prev.map(item => ({ ...item, selected: false })))
      setSelectedRight(null)
    }
  }

  const handleRightClick = (index: number) => {
    if (rightItems[index].matched) return
    
    if (selectedLeft === null) return
    
    const leftWord = leftItems[selectedLeft].word
    const rightWord = rightItems[index].word
    
    if (leftWord.no === rightWord.no) {
      // Correct match
      setLeftItems(prev => prev.map((item, i) => 
        i === selectedLeft ? { ...item, matched: true, selected: false } : item
      ))
      setRightItems(prev => prev.map((item, i) => 
        i === index ? { ...item, matched: true, selected: false } : item
      ))
      setConnections(prev => new Map(prev).set(selectedLeft, index))
      setSelectedLeft(null)
      setSelectedRight(null)
    } else {
      // Wrong match - show feedback
      setRightItems(prev => prev.map((item, i) => 
        i === index ? { ...item, selected: true } : item
      ))
      setSelectedRight(index)
      setTimeout(() => {
        setLeftItems(prev => prev.map(item => ({ ...item, selected: false })))
        setRightItems(prev => prev.map(item => ({ ...item, selected: false })))
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 500)
    }
  }

  const handleShowAnswer = () => {
    if (!showAnswer) {
      setShowAnswer(true)
      const correctConnections = new Map<number, number>()
      leftItems.forEach((leftItem, leftIdx) => {
        const rightIdx = rightItems.findIndex(
          rightItem => rightItem.word.no === leftItem.word.no
        )
        if (rightIdx >= 0) {
          correctConnections.set(leftIdx, rightIdx)
          // Mark all as matched when showing answer
          setLeftItems(prev => prev.map((item, i) => 
            i === leftIdx ? { ...item, matched: true } : item
          ))
          setRightItems(prev => prev.map((item, i) => 
            i === rightIdx ? { ...item, matched: true } : item
          ))
        }
      })
      setConnections(correctConnections)
    } else {
      // If already showing answer, go to next group or review
      handleNextGroup()
    }
  }

  const handleNextGroup = () => {
    const totalGroups = Math.ceil(allWords.length / WORDS_PER_GROUP)
    if (currentGroup < totalGroups - 1) {
      setCurrentGroup(currentGroup + 1)
    } else {
      // All groups completed, navigate to review
      navigate(`/lesson/${lessonId}/review`)
    }
  }

  const getButtonPosition = (index: number, isLeft: boolean) => {
    if (!containerRef.current || !svgRef.current) return { x: 0, y: 0 }
    
    const button = containerRef.current.querySelector(
      `[data-index="${index}"][data-side="${isLeft ? 'left' : 'right'}"]`
    ) as HTMLElement
    
    if (!button) return { x: 0, y: 0 }
    
    const rect = button.getBoundingClientRect()
    const svgRect = svgRef.current.getBoundingClientRect()
    
    return {
      x: isLeft ? rect.right - svgRect.left : rect.left - svgRect.left,
      y: rect.top + rect.height / 2 - svgRect.top
    }
  }

  const allMatched = leftItems.every(item => item.matched) && leftItems.length > 0
  const totalGroups = Math.ceil(allWords.length / WORDS_PER_GROUP)

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8 px-4">
      <div className="w-full md:max-w-[750px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleShowAnswer}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 
                       rounded-lg text-sm sm:text-base text-gray-700 transition-colors
                       active:scale-95 transform min-w-[100px] touch-manipulation"
            >
              {showAnswer 
                ? (currentGroup < totalGroups - 1 ? '下一组' : '进入复习')
                : '下一题'
              }
            </button>
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm sm:text-base">正确答案</span>
            </div>
          </div>
          <div className="text-sm sm:text-base text-gray-500">
            {currentGroup + 1}/{totalGroups}
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={containerRef}
          className="relative min-h-[400px] sm:min-h-[500px]"
        >
          {/* SVG for connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            {Array.from(connections.entries()).map(([leftIdx, rightIdx]) => {
              const leftPos = getButtonPosition(leftIdx, true)
              const rightPos = getButtonPosition(rightIdx, false)
              
              // Use bezier curve for better visual on mobile
              const midX = (leftPos.x + rightPos.x) / 2
              const controlY = Math.abs(rightPos.y - leftPos.y) > 50 
                ? (leftPos.y + rightPos.y) / 2 
                : leftPos.y
              
              return (
                <path
                  key={`${leftIdx}-${rightIdx}`}
                  d={`M ${leftPos.x} ${leftPos.y} Q ${midX} ${controlY} ${rightPos.x} ${rightPos.y}`}
                  stroke={showAnswer ? "#10b981" : "#10b981"}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={showAnswer ? "0" : "5,5"}
                />
              )
            })}
          </svg>

          {/* Content */}
          <div className="flex flex-row justify-between items-start relative z-20 overflow-x-auto px-4 md:px-[150px]">
            {/* Left Column - Words */}
            <div className="flex flex-col items-start space-y-3 sm:space-y-4 flex-shrink-0">
              {leftItems.map((item, index) => (
                <button
                  key={index}
                  data-index={index}
                  data-side="left"
                  onClick={() => handleLeftClick(index)}
                  disabled={item.matched}
                  className={`w-[140px] text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                    transition-all duration-200 touch-manipulation
                    ${item.matched 
                      ? 'bg-green-100 text-gray-600 cursor-not-allowed' 
                      : item.selected
                      ? 'bg-blue-300 text-blue-900'
                      : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800'
                    }
                    ${item.matched ? 'opacity-60' : ''}
                    active:scale-[0.98] transform`}
                >
                  <div className="flex items-start gap-2">
                    {item.matched && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-xs sm:text-sm break-words">{item.word.word}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Column - Meanings */}
            <div className="flex flex-col items-end space-y-3 sm:space-y-4 flex-shrink-0">
              {rightItems.map((item, index) => (
                <button
                  key={index}
                  data-index={index}
                  data-side="right"
                  onClick={() => handleRightClick(index)}
                  disabled={item.matched}
                  className={`w-[140px] text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg 
                    transition-all duration-200 touch-manipulation
                    ${item.matched 
                      ? 'bg-green-100 text-gray-600 cursor-not-allowed' 
                      : item.selected
                      ? 'bg-blue-300 text-blue-900'
                      : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800'
                    }
                    ${item.matched ? 'opacity-60' : ''}
                    active:scale-[0.98] transform`}
                >
                  <span className="text-xs sm:text-sm break-words">{item.word.meaning}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
