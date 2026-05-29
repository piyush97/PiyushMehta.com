import React, { useReducer } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "A Bloom filter says an item 'definitely exists'. What can you conclude?",
    options: [
      'The item is 100% guaranteed to exist',
      'The item might exist, or it might be a false positive',
      "The item definitely doesn't exist",
      'The filter is broken',
    ],
    correct: 1,
    explanation:
      "Bloom filters can have false positives! When they say 'yes', it means 'maybe' - the item might exist, or it could be a false positive due to hash collisions.",
  },
  {
    id: 2,
    question: "A Bloom filter says an item 'definitely doesn't exist'. What can you conclude?",
    options: [
      'The item might not exist',
      "There's a 99% chance it doesn't exist",
      'The item is 100% guaranteed NOT to exist',
      'You need to check the database to be sure',
    ],
    correct: 2,
    explanation:
      "This is the magic of Bloom filters! When they say 'no', they're always right. No false negatives means 100% accuracy for 'definitely not there'.",
  },
  {
    id: 3,
    question:
      'Why would Netflix use a Bloom filter for movie searches instead of just searching the database directly?',
    options: [
      'Databases are unreliable',
      'Bloom filters are more accurate',
      "It's much faster and uses less resources",
      "They're required by law",
    ],
    correct: 2,
    explanation:
      "Speed and efficiency! Bloom filters can eliminate most unnecessary database queries. If the filter says 'not there', you skip the expensive database lookup entirely.",
  },
  {
    id: 4,
    question: 'What happens to false positive rate as a Bloom filter fills up?',
    options: [
      'It stays the same',
      'It decreases',
      'It increases exponentially',
      'It becomes unpredictable',
    ],
    correct: 2,
    explanation:
      "As more items are added, more bits get set to 1. This increases the chance of hash collisions, leading to more false positives. That's why proper sizing is crucial!",
  },
  {
    id: 5,
    question: 'Which scenario is most problematic for a system?',
    options: [
      "False positive: 'username might be taken' when it's actually available",
      "False negative: 'username available' when it's actually taken",
      'Both are equally problematic',
      'Neither is problematic',
    ],
    correct: 1,
    explanation:
      "False negatives are catastrophic! If you tell someone a username is available when it's taken, you'll have duplicate accounts and system failures. False positives just make users try another username - annoying but not breaking.",
  },
];

type QuizState = {
  currentQuestion: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  score: number;
  quizCompleted: boolean;
};

type QuizAction =
  | { type: 'SELECT_ANSWER'; index: number; isCorrect: boolean }
  | { type: 'NEXT_QUESTION'; isLast: boolean }
  | { type: 'RESET' };

const initialState: QuizState = {
  currentQuestion: 0,
  selectedAnswer: null,
  showExplanation: false,
  score: 0,
  quizCompleted: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswer: action.index,
        showExplanation: true,
        score: action.isCorrect ? state.score + 1 : state.score,
      };
    case 'NEXT_QUESTION':
      if (action.isLast) return { ...state, quizCompleted: true };
      return {
        ...state,
        currentQuestion: state.currentQuestion + 1,
        selectedAnswer: null,
        showExplanation: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const InteractiveQuiz: React.FC = () => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { currentQuestion, selectedAnswer, showExplanation, score, quizCompleted } = state;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    dispatch({
      type: 'SELECT_ANSWER',
      index: answerIndex,
      isCorrect: answerIndex === questions[currentQuestion].correct,
    });
  };

  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION', isLast: currentQuestion >= questions.length - 1 });
  };

  const resetQuiz = () => {
    dispatch({ type: 'RESET' });
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "🎉 Perfect! You're a Bloom Filter expert!";
    if (percentage >= 80) return '🚀 Excellent! You understand Bloom Filters well!';
    if (percentage >= 60) return "👍 Good job! You've got the basics down!";
    if (percentage >= 40) return '📚 Not bad! Review the article for better understanding.';
    return '🤔 Give the article another read - Bloom Filters are tricky!';
  };

  if (quizCompleted) {
    return (
      <div className="bg-gradient-card border border-card-border p-6 rounded-lg my-8 shadow-card text-center">
        <h3 className="text-2xl font-bold mb-4 text-text-primary">🎯 Quiz Complete!</h3>
        <div className="text-4xl mb-4">
          {score}/{questions.length}
        </div>
        <p className="text-lg mb-4 text-text-secondary">{getScoreMessage()}</p>
        <div className="bg-light-800 border border-card-border p-4 rounded-lg mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-accent h-4 rounded-full transition-all duration-500"
              style={{ width: `${(score / questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            {Math.round((score / questions.length) * 100)}% Correct
          </p>
        </div>
        <button type="button" onClick={resetQuiz} className="btn-primary px-6 py-3">
          Take Quiz Again
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="bg-gradient-card border border-card-border p-6 rounded-lg my-8 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text-primary">🧠 Test Your Understanding</h3>
        <div className="text-sm text-text-secondary">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      <div className="w-full bg-light-700 rounded-full h-2 mb-6">
        <div
          className="bg-accent h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-text-primary mb-4">{question.question}</h4>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = 'w-full p-4 text-left rounded-lg border transition-all ';

            if (!showExplanation) {
              buttonClass += 'hover:bg-light-700 cursor-pointer ';
            }

            if (selectedAnswer === index) {
              if (index === question.correct) {
                buttonClass += 'bg-accent/20 border-accent text-accent ';
              } else {
                buttonClass += 'bg-red-500/20 border-red-500 text-red-600 ';
              }
            } else if (showExplanation && index === question.correct) {
              buttonClass += 'bg-accent/20 border-accent text-accent ';
            } else {
              buttonClass += 'bg-light-800 border-card-border text-text-primary ';
            }

            return (
              <button
                key={`option-${currentQuestion}-${option}`}
                type="button"
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="mr-3 font-semibold">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                  {showExplanation && index === question.correct && (
                    <span className="ml-auto text-accent">✓</span>
                  )}
                  {showExplanation && selectedAnswer === index && index !== question.correct && (
                    <span className="ml-auto text-red-600">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="mb-6 p-4 bg-light-700 border border-card-border rounded-lg">
          <h5 className="font-semibold text-accent mb-2">💡 Explanation:</h5>
          <p className="text-text-secondary">{question.explanation}</p>
        </div>
      )}

      {showExplanation && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-text-secondary">
            Score: {score}/{currentQuestion + 1}
          </div>
          <button type="button" onClick={nextQuestion} className="btn-primary px-6 py-2">
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
};
