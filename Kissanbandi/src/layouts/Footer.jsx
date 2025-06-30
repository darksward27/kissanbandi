import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  Leaf,
  Heart
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-green-50 to-red-50">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-green-100 via-green-200 to-red-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-3xl font-bold text-green-800">
                Stay Fresh with Our Updates
              </h3>
              <Heart className="w-8 h-8 text-red-400 ml-3" />
            </div>
            <p className="text-green-700 mb-8 text-lg">
              Get exclusive deals, seasonal offers, and fresh produce updates delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="px-6 py-4 rounded-full flex-1 focus:outline-none focus:ring-4 focus:ring-white/30 text-gray-800"
              />
              <button className="bg-red-400 hover:bg-red-500 text-white px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-md">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-12">
          
          {/* Company Info - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-300 to-red-300 p-3 rounded-full mr-4">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-red-500 bg-clip-text text-transparent">
                KissanBandi
              </h2>
            </div>
            <p className="text-gray-700 mb-8 text-lg leading-relaxed max-w-md">
              Bridging the gap between fresh farms and your family table. 
              Premium quality, sustainable farming, delivered with love since 2024.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8 max-w-md">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">500+</div>
                <div className="text-sm text-gray-600">Happy Families</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">50+</div>
                <div className="text-sm text-gray-600">Partner Farms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">24/7</div>
                <div className="text-sm text-gray-600">Fresh Supply</div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4">
              <a href="#" className="bg-green-100 hover:bg-green-300 text-green-600 hover:text-green-800 p-3 rounded-full transition-all duration-300 transform hover:scale-110">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-red-100 hover:bg-red-300 text-red-500 hover:text-red-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-green-100 hover:bg-green-300 text-green-600 hover:text-green-800 p-3 rounded-full transition-all duration-300 transform hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-red-100 hover:bg-red-300 text-red-500 hover:text-red-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-green-300">
              Explore
            </h3>
            <ul className="space-y-4">
              {[
                { name: 'Fresh Fruits', color: 'text-red-400' },
                { name: 'Organic Vegetables', color: 'text-green-500' },
                { name: 'Our Farmers', color: 'text-red-400' },
                { name: 'Delivery Zones', color: 'text-green-500' },
                { name: 'Seasonal Offers', color: 'text-red-400' },
                { name: 'Farm Stories', color: 'text-green-500' }
              ].map((link) => (
                <li key={link.name}>
                  <a href="#" className={`${link.color} hover:underline font-medium transition-colors flex items-center group`}>
                    <span className="w-2 h-2 bg-current rounded-full mr-3 group-hover:scale-125 transition-transform"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-red-300">
              Get in Touch
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4 group">
                <div className="bg-green-100 group-hover:bg-green-300 text-green-500 group-hover:text-green-700 p-2 rounded-lg transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Visit Us</div>
                  <span className="text-gray-600 text-sm">
                    123 Fresh Market Street,<br />
                    Garden City, 12345
                  </span>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="bg-red-100 group-hover:bg-red-300 text-red-400 group-hover:text-red-600 p-2 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Call Us</div>
                  <span className="text-gray-600 text-sm">+91 1234567890</span>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="bg-green-100 group-hover:bg-green-300 text-green-500 group-hover:text-green-700 p-2 rounded-lg transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Email Us</div>
                  <span className="text-gray-600 text-sm">support@kissanbandi.com</span>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="bg-red-100 group-hover:bg-red-300 text-red-400 group-hover:text-red-600 p-2 rounded-lg transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Open Hours</div>
                  <span className="text-gray-600 text-sm">Mon - Sat: 8AM - 10PM</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-green-200 to-red-200 text-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex items-center text-sm">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              <span>© 2024 KissanBandi. Made with love for fresh living.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className="text-green-600 hover:text-green-800 text-sm transition-colors border-b border-transparent hover:border-green-600">
                Privacy Policy
              </a>
              <span className="text-green-500">•</span>
              <a href="#" className="text-red-500 hover:text-red-700 text-sm transition-colors border-b border-transparent hover:border-red-500">
                Terms of Service
              </a>
              <span className="text-red-400">•</span>
              <a href="#" className="text-green-600 hover:text-green-800 text-sm transition-colors border-b border-transparent hover:border-green-600">
                Shipping Policy
              </a>
              <span className="text-green-500">•</span>
              <a href="#" className="text-red-500 hover:text-red-700 text-sm transition-colors border-b border-transparent hover:border-red-500">
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;