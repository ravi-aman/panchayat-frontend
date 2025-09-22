function Hero() {
  return (
    <div className="text-center mt-40">
      <h1 className="font-bold text-[65px] max-sm:text-[40px]">
        Bridging Future <span className=" text-blue-700">Partnerships</span>
      </h1>
      <p className="text-[17px] my-3  text-gray-600 max-sm:px-5">
        Simplify investments in Startups & MSMEs with our efficient, user-friendly financial
        solution.
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
