# UI Snippet: Dynamic Pill Transcript

The user liked this UI pattern but requested a simpler version for the final implementation to avoid visual clutter with the particle system.
We are saving it here for future reference.

## Usage

Inside `GeminiVoiceChat.tsx`, replace the Transcript section with:

```tsx
{
  /* Transcript - Dynamic Pill UI */
}
<div className="absolute left-1/2 -translate-x-1/2 bottom-[140px] w-full max-w-lg px-6 z-30 pointer-events-none">
  <div className="flex flex-col gap-3 items-center w-full">
    {/* AI Bubble */}
    <div
      className={`
    w-full flex items-center gap-3 transition-all duration-500 ease-out
    ${sessionState === "SPEAKING" ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2 scale-95"}
    `}
    >
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shadow-sm shrink-0">
        <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
      </div>
      <div className="bg-white/90 backdrop-blur-md shadow-lg border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 leading-relaxed max-w-[90%]">
        <span className="font-semibold text-blue-600 text-xs block mb-1">
          Gemini
        </span>
        {aiTranscript || (
          <span className="text-gray-400 italic">Thinking...</span>
        )}
      </div>
    </div>

    {/* User Bubble */}
    <div
      className={`
    w-full flex flex-row-reverse items-center gap-3 transition-all duration-500 ease-out
    ${sessionState === "LISTENING" ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2 scale-95"}
    `}
    >
      <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center shadow-sm shrink-0">
        <div className="w-4 h-4 rounded-full bg-cyan-500" />
      </div>
      <div className="bg-gray-800/90 backdrop-blur-md shadow-lg border border-gray-700 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white leading-relaxed max-w-[90%]">
        <span className="font-semibold text-cyan-400 text-xs block mb-1 text-right">
          You
        </span>
        {userTranscript || (
          <span className="text-gray-400 italic">Listening...</span>
        )}
      </div>
    </div>
  </div>
</div>;
```
