import React, { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface SelfAssessmentQuizProps {
  title: string;
  questions: QuizQuestion[];
  className?: string;
}

const SelfAssessmentQuiz: React.FC<SelfAssessmentQuizProps> = ({
  title,
  questions,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setCorrectAnswers(0);
    setQuizCompleted(false);
  };
  
  const handleOptionSelect = (index: number) => {
    if (showAnswer) return;
    setSelectedOption(index);
  };
  
  const checkAnswer = () => {
    if (selectedOption === null) return;
    
    setShowAnswer(true);
    if (selectedOption === questions[currentQuestionIndex].correctIndex) {
      setCorrectAnswers(correctAnswers + 1);
    }
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div 
        className="flex justify-between items-center p-4 cursor-pointer bg-green-50 rounded-t-lg border-b border-green-200"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-semibold text-green-800">
          {title}
        </h3>
        <span className="text-green-600">
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && !quizCompleted && (
        <div className="p-4">
          <div className="mb-2 text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length} • 
            Difficulty: {questions[currentQuestionIndex].difficulty}
          </div>
          
          <div className="mb-4 text-lg font-medium">
            {questions[currentQuestionIndex].question}
          </div>
          
          <div className="mb-4 space-y-2">
            {questions[currentQuestionIndex].options.map((option, index) => (
              <div 
                key={index}
                className={`p-3 border rounded cursor-pointer ${
                  selectedOption === index 
                    ? showAnswer 
                      ? index === questions[currentQuestionIndex].correctIndex 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleOptionSelect(index)}
              >
                {option}
              </div>
            ))}
          </div>
          
          {showAnswer && (
            <div className={`p-3 rounded mb-4 ${
              selectedOption === questions[currentQuestionIndex].correctIndex 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              <div className="font-medium mb-1">
                {selectedOption === questions[currentQuestionIndex].correctIndex 
                  ? 'Correct!' 
                  : 'Incorrect!'}
              </div>
              <div>{questions[currentQuestionIndex].explanation}</div>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              onClick={resetQuiz}
            >
              Reset Quiz
            </button>
            
            {!showAnswer ? (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                onClick={checkAnswer}
                disabled={selectedOption === null}
              >
                Check Answer
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={nextQuestion}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {expanded && quizCompleted && (
        <div className="p-4 text-center">
          <h4 className="text-xl font-bold mb-2">Quiz Results</h4>
          <div className="text-3xl font-bold mb-4 text-green-700">
            {correctAnswers} / {questions.length}
          </div>
          <div className="mb-6">
            {(correctAnswers / questions.length) >= 0.8 ? (
              <div className="text-green-600">Great job! You have a solid understanding of the concepts.</div>
            ) : (correctAnswers / questions.length) >= 0.6 ? (
              <div className="text-yellow-600">Good work! Review the areas you missed to improve your understanding.</div>
            ) : (
              <div className="text-red-600">You might need more review. Try revisiting the educational content.</div>
            )}
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={resetQuiz}
          >
            Restart Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default SelfAssessmentQuiz; 