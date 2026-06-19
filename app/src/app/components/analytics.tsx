"use client";

import { useEffect } from "react";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function Analytics() {
  useEffect(() => {
    // Microsoft Clarity — only loads when a real project id is configured.
    if (!CLARITY_ID) return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_ID}");
    `;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
