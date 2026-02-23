export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var c=document.documentElement.classList;c.remove('dark','light');c.add(localStorage.getItem('command-center-theme')==='light'?'light':'dark');})();`,
      }}
    />
  );
}
