export default function FullscreenIframe() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950">
      <iframe
        src="/pentafocus_elemental_focus_engine_chakra_ui.html" // or srcDoc={rawHtml}
        title="PentaFocus Fullscreen App"
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}