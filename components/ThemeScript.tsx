/** جلوگیری از چشمک تم قبل از رنگ‌آمیزی — اجرا در سرور، بدون هیدراسیون اضافه */
export function ThemeScript() {
  const code = `(function(){
try{
var k='t4v-theme';
var t=localStorage.getItem(k);
if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);return;}
if(window.matchMedia('(prefers-color-scheme: light)').matches)
document.documentElement.setAttribute('data-theme','light');
else document.documentElement.setAttribute('data-theme','dark');
}catch(e){document.documentElement.setAttribute('data-theme','dark');}
})();`;
  return (
    <script dangerouslySetInnerHTML={{ __html: code }} />
  );
}
