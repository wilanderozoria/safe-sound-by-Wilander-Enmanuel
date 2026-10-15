const KEY='safesound.settings.v1';
const defaults={microphone:'',threshold:70,warning:60,minExcessSeconds:3,historyWindow:30,alerts:true,calibration:0};
export function loadSettings(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
export function saveSettings(settings){localStorage.setItem(KEY,JSON.stringify(settings));}
export { defaults };
