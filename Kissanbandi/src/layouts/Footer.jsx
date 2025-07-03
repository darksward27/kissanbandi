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
    <footer className="bg-green-50">
      {/* Newsletter Section */}
      <div className="bg-green-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-2xl font-bold text-green-800">
                Stay Fresh with Our Updates
              </h3>
            </div>
            <p className="text-green-700 mb-6">
              Get exclusive deals, seasonal offers, and fresh produce updates delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 border border-green-200"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-8">
          
          {/* Company Info - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 p-2 rounded-full mr-3">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-800">
                KissanBandi
              </h2>
            </div>
            <p className="text-gray-700 mb-6 max-w-md">
              Bridging the gap between fresh farms and your family table. 
              Premium quality, sustainable farming, delivered with love since 2024.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 max-w-md">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600">Happy Families</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">50+</div>
                <div className="text-sm text-gray-600">Partner Farms</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-gray-600">Fresh Supply</div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3">
              <a href="#" className="bg-green-100 hover:bg-green-200 text-green-600 p-2 rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-green-100 hover:bg-green-200 text-green-600 p-2 rounded-full transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-green-100 hover:bg-green-200 text-green-600 p-2 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-green-100 hover:bg-green-200 text-green-600 p-2 rounded-full transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              {[
                'Fresh Fruits',
                'Organic Vegetables',
                'Our Farmers',
                'Delivery Zones',
                'Seasonal Offers',
                'Farm Stories'
              ].map((link) => (
                <li key={link}>
                  <a href="#" className="text-green-600 hover:text-green-800 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-800">Visit Us</div>
                  <span className="text-gray-600 text-sm">
                    123 Fresh Market Street,<br />
                    Garden City, 12345
                  </span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-800">Call Us</div>
                  <span className="text-gray-600 text-sm">+91 1234567890</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-800">Email Us</div>
                  <span className="text-gray-600 text-sm">support@kissanbandi.com</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-green-600 mt-0.5" />
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
      <div className="bg-green-200 text-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
            <div className="flex items-center text-sm">
              <Heart className="w-4 h-4 text-green-600 mr-2" />
              <span>© 2024 KissanBandi. Made with love for fresh living.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#" className="text-green-700 hover:text-green-900 text-sm transition-colors">
                Privacy Policy
              </a>
              <span className="text-green-600">•</span>
              <a href="#" className="text-green-700 hover:text-green-900 text-sm transition-colors">
                Terms of Service
              </a>
              <span className="text-green-600">•</span>
              <a href="#" className="text-green-700 hover:text-green-900 text-sm transition-colors">
                Shipping Policy
              </a>
              <span className="text-green-600">•</span>
              <a href="#" className="text-green-700 hover:text-green-900 text-sm transition-colors">
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