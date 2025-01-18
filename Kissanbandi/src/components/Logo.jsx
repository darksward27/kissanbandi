import React from 'react';
import PropTypes from 'prop-types';

const Logo = ({ size = 'normal', variant = 'horizontal' }) => {
  const sizes = {
    small: {
      container: "space-x-2",
      svg: "w-8 h-8",
      text: "text-2xl"
    },
    normal: {
      container: "space-x-3",
      svg: "w-10 h-10",
      text: "text-3xl"
    },
    large: {
      container: "space-x-4",
      svg: "w-12 h-12",
      text: "text-4xl"
    }
  };

  const variants = {
    horizontal: "flex items-center",
    vertical: "flex flex-col items-center text-center"
  };

  const currentSize = sizes[size];
  
  return (
    <div className={`${variants[variant]} ${variant === 'horizontal' ? currentSize.container : 'space-y-2'}`}>
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={currentSize.svg}
      >
        <rect width="32" height="32" rx="8" className="fill-green-50" />
        <path d="M16 6C13.8 6 12 7.8 12 10C12 11.5 12.8 12.9 14 13.6C14 13.7 14 13.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14H8C8 16.2 9.8 18 12 18C14.2 18 16 16.2 16 14C16 13.9 16 13.7 16 13.6C17.2 12.9 18 11.5 18 10C18 7.8 16.2 6 14 6H16Z" className="fill-green-600" />
        <path d="M16 26C18.2 26 20 24.2 20 22C20 20.5 19.2 19.1 18 18.4C18 18.3 18 18.1 18 18C18 16.9 18.9 16 20 16C21.1 16 22 16.9 22 18H24C24 15.8 22.2 14 20 14C17.8 14 16 15.8 16 18C16 18.1 16 18.3 16 18.4C14.8 19.1 14 20.5 14 22C14 24.2 15.8 26 18 26H16Z" className="fill-green-600" />
      </svg>
      <div className={`flex ${variant === 'vertical' ? 'flex-col items-center' : 'flex-col'}`}>
        <span className={`${currentSize.text} font-bold text-green-700 leading-none tracking-tight`}>
          Kissan
        </span>
        <span className={`${currentSize.text} font-bold text-green-600 leading-none tracking-tight`}>
          Bandi
        </span>
      </div>
    </div>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  variant: PropTypes.oneOf(['horizontal', 'vertical'])
};

export default Logo; 