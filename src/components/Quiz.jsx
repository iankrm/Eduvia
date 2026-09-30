import { useState } from 'react';
import { Button } from './Button.jsx';
import { QUIZ } from '../data/content.js';

export function Quiz() {
  const [picked, setPicked] = useState(null);

  return (
    <div className="quiz" id="classes">
      <div className="container">
        <h2 className="quiz__title mc-text-h2 mc-text-center">What brings you to EduVia today?</h2>

        <ul className="quiz__options">
          {QUIZ.map((q) => {
            const on = picked === q.id;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  className={`quiz__option ${on ? 'quiz__option--on' : ''}`}
                  aria-pressed={on}
                  onClick={() => setPicked(on ? null : q.id)}
                >
                  {q.label}
                </button>
              </li>
            );
          })}
        </ul>

        {picked && (
          <div className="quiz__confirm mc-animate-fade-in">
            <Button as="a" href="#membership" size="lg">
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
