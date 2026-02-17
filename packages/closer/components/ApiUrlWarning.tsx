const ApiUrlWarning = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return null;

  return (
    <div
      className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-900"
      role="alert"
    >
      NEXT_PUBLIC_API_URL is not set. API requests may fail. Set it in your
      environment to connect to the backend.
    </div>
  );
};

export default ApiUrlWarning;
