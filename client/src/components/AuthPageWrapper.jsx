export default function AuthPageWrapper({ children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 py-20 md:py-8 z-10">
      {/* Fixed positioning ensures true centering over the globe background */}
      <div className="w-full max-w-md relative z-20">
        {/* z-20 ensures auth forms appear above globe but below navbar */}
        {children}
      </div>
    </div>
  )
}