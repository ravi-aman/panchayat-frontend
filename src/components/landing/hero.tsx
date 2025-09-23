function Hero() {
  return (
    <div className="text-center mt-40">
      <h1 className="font-bold text-[65px] max-sm:text-[40px]">
        Report Today, Build Tomorrow’s <span className=" text-blue-700"> Future </span>
      </h1>
      <p className="text-[17px] my-3  text-gray-600 max-sm:px-5">
        Empower your voice, drive accountability, and help create sustainable, people-first cities.
      </p>
      <button
        onClick={() => (window.location.href = '/dashboard/startups')}
        className="bg-blue-600 py-5 px-12 max-sm:px-5 max-sm:py-3 font-bold  text-white rounded-2xl cursor-pointer  my-5 hover:bg-blue-500"
      >
        START NOW
      </button>
    </div>
  );
}

export default Hero;
