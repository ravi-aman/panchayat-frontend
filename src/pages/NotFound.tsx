import React from 'react';
import { Link } from 'react-router-dom';
// import commigSoon from "../../assets/coming_soon.mp4";

const NotFound: React.FC = () => {
  // return(
  //     <div>

  //         <video src={commigSoon} autoPlay loop muted className="h-screen"/>
  //     </div>
  //     )
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
};

export default NotFound;
