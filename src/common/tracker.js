let imported = false
export const tracker = () => {
  if (imported) return
  /*eslint-disable */
  // Commenting out the Google Analytics script loading to prevent CSP violations.
  // (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  // (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  // m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  // })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  imported = true
  // ga('create', 'UA-65598064-4', 'auto'); // Also comment out ga calls if not needed.
  // ga('set', 'checkProtocolTask', function(){});
}