export const DOORS_KEY = "nw.doors-opened";

export const DOORS_SCRIPT = `try{if(sessionStorage.getItem("${DOORS_KEY}")==="1")document.documentElement.classList.add("doors-seen")}catch(e){}`;
