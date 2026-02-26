/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<Point>(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  };

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(prev - 2, 60)); // Gradually increase speed
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
    lastDirectionRef.current = direction;
  }, [direction, food, isGameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (lastDirectionRef.current.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (lastDirectionRef.current.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (lastDirectionRef.current.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (lastDirectionRef.current.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          if (!isGameOver) setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (!isPaused && !isGameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPaused, isGameOver, moveSnake, speed]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans text-white overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-500 italic">NEON SNAKE</h1>
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Version 1.0.0</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-neutral-400 mb-1">
            <Trophy size={14} />
            <span className="text-xs font-mono uppercase">Best</span>
            <span className="text-sm font-mono font-bold text-white">{highScore}</span>
          </div>
          <div className="text-3xl font-mono font-black text-white leading-none">{score}</div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div 
          className="relative bg-neutral-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
          style={{ 
            width: 'min(90vw, 400px)', 
            height: 'min(90vw, 400px)',
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
          }}
        >
          {/* Grid Lines (Subtle) */}
          <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 pointer-events-none opacity-[0.03]">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white"></div>
            ))}
          </div>

          {/* Food */}
          <motion.div
            layoutId="food"
            className="bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)]"
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />

          {/* Snake */}
          {snake.map((segment, i) => (
            <motion.div
              key={`${i}-${segment.x}-${segment.y}`}
              className={`rounded-sm ${i === 0 ? 'bg-emerald-400 z-10' : 'bg-emerald-600/80'}`}
              style={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
                boxShadow: i === 0 ? '0 0 15px rgba(52,211,153,0.6)' : 'none'
              }}
              initial={false}
              animate={{ scale: 0.95 }}
            />
          ))}

          {/* Overlays */}
          <AnimatePresence>
            {(isPaused || isGameOver) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                {isGameOver ? (
                  <>
                    <h2 className="text-4xl font-black text-rose-500 mb-2 italic">GAME OVER</h2>
                    <p className="text-neutral-400 mb-8 font-mono text-sm">FINAL SCORE: {score}</p>
                    <button 
                      onClick={resetGame}
                      className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-emerald-400 transition-colors"
                    >
                      <RotateCcw size={20} />
                      TRY AGAIN
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-emerald-500 mb-8 italic">PAUSED</h2>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-emerald-400 transition-colors"
                    >
                      <Play size={20} fill="currentColor" />
                      RESUME
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls (Mobile Friendly) */}
      <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-[240px]">
        <div />
        <ControlButton icon={<ChevronUp />} onClick={() => lastDirectionRef.current.y === 0 && setDirection({ x: 0, y: -1 })} />
        <div />
        <ControlButton icon={<ChevronLeft />} onClick={() => lastDirectionRef.current.x === 0 && setDirection({ x: -1, y: 0 })} />
        <ControlButton 
          icon={isPaused ? <Play fill="currentColor" size={20} /> : <Pause fill="currentColor" size={20} />} 
          onClick={() => !isGameOver && setIsPaused(p => !p)}
          className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        />
        <ControlButton icon={<ChevronRight />} onClick={() => lastDirectionRef.current.x === 0 && setDirection({ x: 1, y: 0 })} />
        <div />
        <ControlButton icon={<ChevronDown />} onClick={() => lastDirectionRef.current.y === 0 && setDirection({ x: 0, y: 1 })} />
        <div />
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-neutral-600 text-[10px] font-mono uppercase tracking-[0.2em]">
        Use Arrow Keys or Buttons to Move • Space to Pause
      </div>
    </div>
  );
}

function ControlButton({ icon, onClick, className = "" }: { icon: React.ReactNode, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-16 h-16 flex items-center justify-center rounded-2xl bg-neutral-900 border border-white/5 active:scale-95 transition-transform text-neutral-400 hover:text-white hover:bg-neutral-800 ${className}`}
    >
      {icon}
    </button>
  );
}
