import { useNavigate } from 'react-router';


import { Button } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const Header: React.FC = () => {
     const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <div className="group cursor-pointer">
            <div
              className="
                px-6 py-3 rounded-xl
                bg-gradient-to-r from-blue-600 to-indigo-600
                transition-all duration-300
                group-hover:from-indigo-600 group-hover:to-purple-600
                group-hover:shadow-xl group-hover:scale-105
              "
            >
              <h1
                className="
                  text-xl font-extrabold text-white
                  tracking-wide
                  drop-shadow-sm
                "
                onClick={() => navigate('/')}
              >
                UniClub
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              size="large"
              icon={<LoginOutlined />}
              className="
                font-semibold
                border-gray-300
                hover:border-blue-500
                hover:text-blue-600
              "
            >
              Login
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              className="
                font-semibold
                bg-gradient-to-r from-blue-600 to-indigo-600
                border-none
                hover:from-indigo-600 hover:to-purple-600
                shadow-md hover:shadow-lg
              "
            >
              Sign Up
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
