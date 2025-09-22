import React from 'react';

const RegisterComplete: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-5">
      <div className="flex flex-col md:flex-row rounded-lg overflow-hidden w-full max-w-6xl gap-5 md:gap-10 animate-fade-in">
        {/* Left panel */}
        <div className="w-full md:w-[55%] h-full bg-blue-600 text-white p-8 sm:p-10 md:pt-30 rounded-[10px] md:rounded-[50px] text-center md:text-left flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight md:text-6xl">
            Start your
            <br /> Journey with us.
          </h1>
          <p className="mt-3 text-base sm:text-lg">
            Discover the India's best community of <br className="hidden sm:block" />
            startups and MSME's
          </p>
        </div>

        {/* Right panel */}
        <div className="p-6 sm:p-8 md:p-10 h-fit self-center bg-white rounded-[10px] w-full md:w-[35%] shadow-lg flex flex-col items-center justify-center">
          <div className="mb-4 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 sm:w-16 sm:h-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-center">Almost There!</h2>
          <p className="mt-2 mb-6 text-sm sm:text-base text-center text-gray-600">
            Check your email to reset your account
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={() => {
                window.open('https://gmail.com', '_blank', 'noopener,noreferrer');
              }}
              className="w-full py-2 font-semibold text-gray-700 transition-all duration-300 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Open Gmail
            </button>

            <button
              onClick={() => {
                window.location.href = '/auth/signin';
              }}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-[1.001]"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterComplete;
