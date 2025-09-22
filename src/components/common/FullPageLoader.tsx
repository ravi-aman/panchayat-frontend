import React from 'react';

const FullPageLoader: React.FC = () => {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white w-screen h-screen`}
    >
      <div className="relative flex items-center justify-center w-[250px] h-[250px]">
        {/* Circle 1 */}
        <div
          className="absolute border-[3.5px] border-transparent rounded-full animate-spin"
          style={{
            width: '250px',
            height: '250px',
            borderTopColor: 'rgb(99,102,241)',
            borderRightColor: 'rgb(99,102,241)',
            animationDelay: '-0.15s',
          }}
        ></div>
        {/* Circle 2 */}
        <div
          className="absolute border-[3.5px] border-transparent rounded-full animate-spin"
          style={{
            width: '200px',
            height: '200px',
            borderTopColor: '#404041',
            borderRightColor: '#404041',
            animationDelay: '-0.3s',
          }}
        ></div>
        {/* Circle 3 */}
        <div
          className="absolute border-[3.5px] border-transparent rounded-full animate-spin"
          style={{
            width: '150px',
            height: '150px',
            borderTopColor: 'rgb(99,102,241)',
            borderRightColor: 'rgb(99,102,241)',
            animationDelay: '-0.45s',
          }}
        ></div>
        {/* Circle 4 */}
        <div
          className="absolute border-[3.5px] border-transparent rounded-full animate-spin"
          style={{
            width: '100px',
            height: '100px',
            borderTopColor: '#404041',
            borderRightColor: '#404041',
            animationDelay: '-0.6s',
          }}
        ></div>
      </div>
    </div>
  );
};

export default FullPageLoader;
