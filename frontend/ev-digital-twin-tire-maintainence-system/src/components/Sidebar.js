import React from 'react';

const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'battery', label: 'Battery Health' },
    { id: 'performance', label: 'Performance' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <h2>EV Monitor</h2>
      <nav style={{ marginTop: '30px' }}>
        {navItems.map(item => (
          <div 
            key={item.id}
            className="nav-item"
            onClick={() => setActiveView(item.id)}
            style={{ 
              color: activeView === item.id ? '#00ff88' : 'white',
              fontWeight: activeView === item.id ? 'bold' : 'normal'
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;