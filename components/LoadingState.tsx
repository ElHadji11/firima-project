import React from 'react'
import { motion } from 'framer-motion';

const LoadingState = () => {
    return (
        <div>
            <div className="flex justify-start">
                <div className="bg-muted border border-border rounded-2xl rounded-tl-none p-4 flex items-center justify-center min-w-[60px] min-h-[60px] shadow-sm">

                    <svg
                        width="26"
                        height="26"
                        viewBox="0 0 100 100"
                        fill="none"
                        strokeWidth="16" // Very bold font weight
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="overflow-visible"
                    >
                        <defs>
                            {/* Optional: A premium gradient for the F */}
                            <linearGradient id="firima-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
                                <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
                            </linearGradient>

                            {/* Optional: Soft glow effect */}
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* The Magic Path:
                                        1. M 25 85 (Start bottom)
                                        2. L 25 50 (Draw up to middle)
                                        3. L 60 50 (Shoot out the middle bar)
                                        4. L 25 50 (Retrace back to the stem)
                                        5. L 25 15 (Draw up to the top)
                                        6. L 70 15 (Shoot out the top bar)
                                    */}

                        {/* Faded background track */}
                        <path
                            d="M 25 85 L 25 50 L 60 50 L 25 50 L 25 15 L 70 15"
                            className="stroke-muted-foreground/15"
                        />

                        {/* The animated drawing line */}
                        <motion.path
                            d="M 25 85 L 25 50 L 60 50 L 25 50 L 25 15 L 70 15"
                            stroke="url(#firima-gradient)"
                            filter="url(#glow)"
                            initial={{ pathLength: 0, opacity: 0.5 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                pathLength: {
                                    duration: 1.4,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatType: "reverse", // Draws it, then smoothly un-draws it
                                    repeatDelay: 0.3
                                },
                                opacity: {
                                    duration: 0.4,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    repeatDelay: 1.3
                                }
                            }}
                        />
                    </svg>

                </div>
            </div>
        </div>
    )
}

export default LoadingState