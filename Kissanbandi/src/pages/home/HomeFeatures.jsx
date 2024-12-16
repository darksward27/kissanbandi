import React, { useState, useEffect } from 'react';
import { Truck, Clock, Leaf, BadgeCheck } from 'lucide-react';

const HomeFeatures = () => {
    useEffect(() => {
        // Smooth scroll polyfill
        window.scrollTo({ top: 0});
    
        return () => {
          document.documentElement.style.scrollBehavior = 'auto';
        };
      }, []);
  const features = [
    {
      icon: <Truck className="w-12 h-12 text-green-600" />,
      title: "Free Home Delivery",
      description: "Free delivery for all orders above ₹500. We deliver fresh to your doorstep."
    },
    {
      icon: <Clock className="w-12 h-12 text-green-600" />,
      title: "Express Delivery",
      description: "Same day delivery for orders placed before 2 PM."
    },
    {
      icon: <Leaf className="w-12 h-12 text-green-600" />,
      title: "Fresh & Organic",
      description: "100% fresh produce sourced directly from local farmers."
    },
    {
      icon: <BadgeCheck className="w-12 h-12 text-green-600" />,
      title: "Quality Assured",
      description: "Every product undergoes strict quality checks before delivery."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose FreshHarvest?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 cursor-pointer">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition duration-300 text-center"
            >
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeFeatures;