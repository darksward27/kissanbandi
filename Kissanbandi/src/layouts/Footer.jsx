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
  Coffee,
  Heart
} from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#823000' }}>
 
    {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-8">
          
          {/* Company Info - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div 
                className="p-2 rounded-full mr-3"
                style={{ 
                  background: `linear-gradient(135deg, #f59b52 0%, #ffe5b8 100%)` 
                }}
              >
                <Coffee className="w-6 h-6" style={{ color: '#823000' }} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                BOGAT
              </h2>
            </div>
            <p className="text-white/80 mb-6 max-w-md leading-relaxed">
              Preserving the authentic taste of India through premium spices and traditional coffee. 
              From heritage farms to your kitchen, delivering excellence since generations.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 max-w-md">
              <div className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#f59b52' }}
                >
                  1000+
                </div>
                <div className="text-sm text-white/60">Happy Customers</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#f59b52' }}
                >
                  25+
                </div>
                <div className="text-sm text-white/60">Heritage Farms</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#f59b52' }}
                >
                  100%
                </div>
                <div className="text-sm text-white/60">Authentic</div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="p-2 rounded-full transition-all duration-300 hover:transform hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(245, 155, 82, 0.2)',
                  border: '2px solid rgba(245, 155, 82, 0.3)'
                }}
              >
                <Facebook className="w-5 h-5" style={{ color: '#f59b52' }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full transition-all duration-300 hover:transform hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(245, 155, 82, 0.2)',
                  border: '2px solid rgba(245, 155, 82, 0.3)'
                }}
              >
                <Twitter className="w-5 h-5" style={{ color: '#f59b52' }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full transition-all duration-300 hover:transform hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(245, 155, 82, 0.2)',
                  border: '2px solid rgba(245, 155, 82, 0.3)'
                }}
              >
                <Instagram className="w-5 h-5" style={{ color: '#f59b52' }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-full transition-all duration-300 hover:transform hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(245, 155, 82, 0.2)',
                  border: '2px solid rgba(245, 155, 82, 0.3)'
                }}
              >
                <Youtube className="w-5 h-5" style={{ color: '#f59b52' }} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Explore
            </h3>
            <ul className="space-y-2">
              {[
                'Premium Coffee',
                'Authentic Spices',
                'Heritage Collection',
                'Delivery Zones',
                'Special Offers',
                'Our Story'
              ].map((link) => (
                <li key={link}>
                  <a 
                    href="#" 
                    className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                    style={{ 
                      borderBottom: '1px solid transparent' 
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderBottomColor = '#f59b52';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderBottomColor = 'transparent';
                    }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#f59b52' }} />
                <div>
                  <div className="font-semibold text-white">Visit Us</div>
                  <span className="text-white/70 text-sm">
                    Heritage Spice Market,<br />
                    Karnataka, India 560001
                  </span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 mt-0.5" style={{ color: '#f59b52' }} />
                <div>
                  <div className="font-semibold text-white">Call Us</div>
                  <span className="text-white/70 text-sm">+91 9876543210</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 mt-0.5" style={{ color: '#f59b52' }} />
                <div>
                  <div className="font-semibold text-white">Email Us</div>
                  <span className="text-white/70 text-sm">support@bogat.com</span>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Clock className="w-5 h-5 mt-0.5" style={{ color: '#f59b52' }} />
                <div>
                  <div className="font-semibold text-white">Open Hours</div>
                  <span className="text-white/70 text-sm">Mon - Sat: 9AM - 8PM</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="text-white border-t"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTopColor: 'rgba(245, 155, 82, 0.3)'
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
            <div className="flex items-center text-sm">
              <Heart className="w-4 h-4 mr-2" style={{ color: '#f59b52' }} />
              <span className="text-white/80">© 2024 BOGAT. Crafted with tradition for authentic flavors.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a 
                href="#" 
                className="text-white/70 hover:text-white text-sm transition-colors duration-300"
                style={{ 
                  borderBottom: '1px solid transparent' 
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderBottomColor = '#f59b52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderBottomColor = 'transparent';
                }}
              >
                Privacy Policy
              </a>
              <span style={{ color: '#f59b52' }}>•</span>
              <a 
                href="#" 
                className="text-white/70 hover:text-white text-sm transition-colors duration-300"
                style={{ 
                  borderBottom: '1px solid transparent' 
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderBottomColor = '#f59b52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderBottomColor = 'transparent';
                }}
              >
                Terms of Service
              </a>
              <span style={{ color: '#f59b52' }}>•</span>
              <a 
                href="#" 
                className="text-white/70 hover:text-white text-sm transition-colors duration-300"
                style={{ 
                  borderBottom: '1px solid transparent' 
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderBottomColor = '#f59b52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderBottomColor = 'transparent';
                }}
              >
                Shipping Policy
              </a>
              <span style={{ color: '#f59b52' }}>•</span>
              <a 
                href="#" 
                className="text-white/70 hover:text-white text-sm transition-colors duration-300"
                style={{ 
                  borderBottom: '1px solid transparent' 
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderBottomColor = '#f59b52';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderBottomColor = 'transparent';
                }}
              >
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