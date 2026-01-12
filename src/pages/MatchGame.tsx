import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Word } from '../types'
import { parseWordsToLessons, shuffleArray } from '../utils/wordParser'
import { updateLessonProgress } from '../utils/storage'

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
    fetch(`${import.meta.env.BASE_URL}word.json`)
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
    // If clicking on a matched left item, cancel the connection
    if (leftItems[index].matched) {
      // Find the corresponding right item index
      const rightIdx = connections.get(index)
      if (rightIdx !== undefined) {
        // Cancel the connection
        setConnections(prev => {
          const newConnections = new Map(prev)
          newConnections.delete(index)
          return newConnections
        })
        // Unmatch both items
        setLeftItems(prev => prev.map((item, i) => 
          i === index ? { ...item, matched: false } : item
        ))
        setRightItems(prev => prev.map((item, i) => 
          i === rightIdx ? { ...item, matched: false } : item
        ))
        // Clear selections
        setSelectedLeft(null)
        setSelectedRight(null)
      }
      return
    }
    
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
    // If clicking on a matched right item, cancel the connection
    if (rightItems[index].matched) {
      // Find the corresponding left item index
      const leftIdx = Array.from(connections.entries()).find(([_, rightIdx]) => rightIdx === index)?.[0]
      if (leftIdx !== undefined) {
        // Cancel the connection
        setConnections(prev => {
          const newConnections = new Map(prev)
          newConnections.delete(leftIdx)
          return newConnections
        })
        // Unmatch both items
        setLeftItems(prev => prev.map((item, i) => 
          i === leftIdx ? { ...item, matched: false } : item
        ))
        setRightItems(prev => prev.map((item, i) => 
          i === index ? { ...item, matched: false } : item
        ))
        // Clear selections
        setSelectedLeft(null)
        setSelectedRight(null)
      }
      return
    }
    
    // If clicking on already selected right item, cancel selection
    if (selectedRight === index) {
      setSelectedRight(null)
      setRightItems(prev => prev.map((item, i) => 
        i === index ? { ...item, selected: false } : item
      ))
      return
    }
    
    // If no left item is selected, don't do anything
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
    // Check if all items are already matched
    const allMatched = leftItems.every(item => item.matched) && leftItems.length > 0
    
    // If all matched, go directly to next group
    if (allMatched) {
      handleNextGroup()
      return
    }
    
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
      // All groups completed, mark lesson as completed and navigate to review
      if (lessonId) {
        updateLessonProgress(parseInt(lessonId), true)
      }
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

  const handleBack = () => {
    navigate(`/lesson/${lessonId}/review`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-6 px-4">
      <div className="w-full md:max-w-[750px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors active:scale-95 transform"
                aria-label="返回"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                第{lessonId}课 - 单词匹配
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-xs sm:text-sm font-medium text-gray-600">进度</span>
              <span className="text-sm sm:text-base font-bold text-blue-600">
                {currentGroup + 1}/{totalGroups}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={handleShowAnswer}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 
                       rounded-xl text-sm sm:text-base text-white font-medium transition-all
                       active:scale-95 transform shadow-md hover:shadow-lg touch-manipulation
                       min-w-[100px]"
            >
              {allMatched
                ? (currentGroup < totalGroups - 1 ? '下一组' : '返回复习')
                : showAnswer 
                  ? (currentGroup < totalGroups - 1 ? '下一组' : '返回复习')
                  : '查看答案'
              }
            </button>
            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-700">已匹配</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={containerRef}
          className="relative bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 md:p-8
                     min-h-[450px] sm:min-h-[550px] border border-white/20"
        >
          {/* SVG for connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-2xl"
            style={{ overflow: 'visible' }}
          >
            {Array.from(connections.entries()).map(([leftIdx, rightIdx]) => {
              const leftPos = getButtonPosition(leftIdx, true)
              const rightPos = getButtonPosition(rightIdx, false)
              
              // Use bezier curve for better visual
              const midX = (leftPos.x + rightPos.x) / 2
              const controlY = Math.abs(rightPos.y - leftPos.y) > 50 
                ? (leftPos.y + rightPos.y) / 2 
                : leftPos.y
              
              return (
                <path
                  key={`${leftIdx}-${rightIdx}`}
                  d={`M ${leftPos.x} ${leftPos.y} Q ${midX} ${controlY} ${rightPos.x} ${rightPos.y}`}
                  stroke={showAnswer ? "#10b981" : "#3b82f6"}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={showAnswer ? "0" : "8,4"}
                  strokeLinecap="round"
                  className="drop-shadow-sm"
                />
              )
            })}
          </svg>

          {/* Content */}
          <div className="flex flex-row justify-center items-start relative z-20 gap-8 sm:gap-12 md:gap-16 lg:gap-24">
            {/* Left Column - Words */}
            <div className="flex flex-col items-start space-y-3 sm:space-y-4 flex-shrink-0">
              <div className="mb-2 px-2">
                <span className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide">单词</span>
              </div>
              {leftItems.map((item, index) => (
                <button
                  key={index}
                  data-index={index}
                  data-side="left"
                  onClick={() => handleLeftClick(index)}
                  className={`min-w-[150px] sm:min-w-[160px] text-left px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl 
                    transition-all duration-200 touch-manipulation shadow-md hover:shadow-lg
                    ${item.matched 
                      ? 'bg-gradient-to-r from-green-100 to-green-50 hover:from-green-200 hover:to-green-100 text-gray-800 border-2 border-green-300' 
                      : item.selected
                      ? 'bg-gradient-to-r from-blue-400 to-blue-300 text-white border-2 border-blue-500 shadow-lg scale-105'
                      : 'bg-white hover:bg-blue-50 text-gray-800 border-2 border-gray-200 hover:border-blue-300'
                    }
                    active:scale-[0.97] transform`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.matched && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.selected && !item.matched && (
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                    )}
                    <span className="text-sm sm:text-base font-medium break-words leading-relaxed">
                      {item.word.word}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Column - Meanings */}
            <div className="flex flex-col items-end space-y-3 sm:space-y-4 flex-shrink-0">
              <div className="mb-2 px-2">
                <span className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wide">释义</span>
              </div>
              {rightItems.map((item, index) => (
                <button
                  key={index}
                  data-index={index}
                  data-side="right"
                  onClick={() => handleRightClick(index)}
                  className={`min-w-[150px] sm:min-w-[160px] text-left px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl 
                    transition-all duration-200 touch-manipulation shadow-md hover:shadow-lg
                    ${item.matched 
                      ? 'bg-gradient-to-r from-green-100 to-green-50 hover:from-green-200 hover:to-green-100 text-gray-800 border-2 border-green-300' 
                      : item.selected
                      ? 'bg-gradient-to-r from-purple-400 to-purple-300 text-white border-2 border-purple-500 shadow-lg scale-105'
                      : 'bg-white hover:bg-purple-50 text-gray-800 border-2 border-gray-200 hover:border-purple-300'
                    }
                    active:scale-[0.97] transform`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.selected && !item.matched && (
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                    )}
                    <span className="text-sm sm:text-base font-medium break-words leading-relaxed">
                      {item.word.meaning}
                    </span>
                    {item.matched && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
