import React from 'react';

interface FormHeaderProps {
  title: string;
  highlight: string;
  description: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, highlight, description }) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-5xl font-extrabold mb-6 tracking-tight mt-20">
        {title} <span className="text-[#FF6B00] italic underline decoration-orange-300 underline-offset-[12px]">{highlight}</span>
      </h1>
      <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FormHeader;