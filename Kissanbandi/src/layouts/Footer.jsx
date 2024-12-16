import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50">
      {/* Newsletter Section */}
      <div className="bg-green-600 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Get Fresh Updates & Special Offers
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-3 rounded-full flex-1 max-w-md focus:outline-none"
              />
              <button className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-200">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <h2 className="text-2xl font-bold text-green-700 mb-6">KissanBandi</h2>
            <p className="text-gray-600 mb-6">
              Delivering fresh, premium quality fruits and vegetables directly from farms 
              to your doorstep since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-600 transition-colors">
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {['About Us', 'Shop Now', 'Our Farmers', 'Delivery Areas', 'FAQs', 'Contact Us'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-600">
                  123 Fresh Market Street,<br />
                  Garden City, 12345
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">+91 1234567890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">support@freshharvest.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">Mon - Sat: 8:00 AM - 10:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Download Our App</h3>
            <p className="text-gray-600 mb-6">
              Shop on the go with our mobile app. Available on iOS and Android.
            </p>
            <div className="space-y-4">
              <button className="bg-black text-white w-full py-3 rounded-lg hover:bg-gray-800 transition duration-200">
                Download on App Store
              </button>
              <button className="bg-black text-white w-full py-3 rounded-lg hover:bg-gray-800 transition duration-200">
                Get it on Google Play
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-600 text-sm">
              © 2024 FreshHarvest. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-green-600 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-green-600 text-sm">
                Shipping Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;