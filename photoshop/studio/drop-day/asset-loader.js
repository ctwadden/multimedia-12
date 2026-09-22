(function(){
  const assets=window.DROP_DAY_ASSETS||{};
  function apply(){
    document.querySelectorAll('img[src]').forEach(img=>{
      const key=img.getAttribute('src');
      if(assets[key]) img.src=assets[key];
    });
    document.querySelectorAll('a[href]').forEach(a=>{
      const key=a.getAttribute('href');
      if(assets[key]){
        a.href=assets[key];
        if(a.hasAttribute('download')){
          a.setAttribute('download', key.split('/').pop());
        }
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();