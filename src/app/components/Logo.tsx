import React from 'react';

export const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          width="64"
          height="32"
          viewBox="0 0 64 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform transition-all duration-300 hover:scale-105"
        >
          {/* Bar with gradient */}
          <path
            d="M8 16C8 14.8954 8.89543 14 10 14H54C55.1046 14 56 14.8954 56 16C56 17.1046 55.1046 18 54 18H10C8.89543 18 8 17.1046 8 16Z"
            className="fill-orange-500"
          />
          
          {/* Inner Plates with gradient */}
          <g className="fill-orange-600">
            <path d="M12 10C12 8.89543 12.8954 8 14 8H18C19.1046 8 20 8.89543 20 10V22C20 23.1046 19.1046 24 18 24H14C12.8954 24 12 23.1046 12 22V10Z">
              <animate
                attributeName="opacity"
                values="1;0.8;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M44 10C44 8.89543 44.8954 8 46 8H50C51.1046 8 52 8.89543 52 10V22C52 23.1046 51.1046 24 50 24H46C44.8954 24 44 23.1046 44 22V10Z">
              <animate
                attributeName="opacity"
                values="1;0.8;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Outer Plates with gradient */}
          <g className="fill-orange-700">
            <path d="M8 8C8 6.89543 8.89543 6 10 6H14C15.1046 6 16 6.89543 16 8V24C16 25.1046 15.1046 26 14 26H10C8.89543 26 8 25.1046 8 24V8Z">
              <animate
                attributeName="opacity"
                values="1;0.7;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M48 8C48 6.89543 48.8954 6 50 6H54C55.1046 6 56 6.89543 56 8V24C56 25.1046 55.1046 26 54 26H50C48.8954 26 48 25.1046 48 24V8Z">
              <animate
                attributeName="opacity"
                values="1;0.7;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Shine effect */}
          <path
            d="M10 15.5L54 15.5"
            stroke="white"
            strokeWidth="0.5"
            strokeLinecap="round"
            className="opacity-50"
          >
            <animate
              attributeName="opacity"
              values="0.5;0.2;0.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-br from-orange-500 via-orange-600 to-orange-400 text-transparent bg-clip-text tracking-tight">
            StrengthQuest
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-orange-400/0 via-orange-400 to-orange-400/0 mt-2 mb-1"></div>
          <span className="text-sm text-gray-600 tracking-wide font-medium">
            Intelligent Strength Tracking
          </span>
        </div>
      </div>
    </div>
  );
}; 